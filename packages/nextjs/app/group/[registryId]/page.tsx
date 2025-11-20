"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { type Post, type Proposal, getPostsByGroup, getProposalsByGroup } from "~~/utils/supabase/client";

type Group = {
  groupId: bigint;
  creator: string;
  name: string;
  description: string;
  createdAt: bigint;
  exists: boolean;
};

export default function GroupDetailPage({ params }: { params: Promise<{ registryId: string }> }) {
  const resolvedParams = use(params);
  const registryId = parseInt(resolvedParams.registryId);
  const router = useRouter();
  const { isConnected } = useAccount();
  const [posts, setPosts] = useState<Post[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "proposals">("posts");

  // Fetch group data
  const { data: groupData } = useScaffoldReadContract({
    contractName: "Whisp",
    functionName: "groups",
    args: [BigInt(registryId)],
  });

  // Parse the tuple returned from the contract
  // Contract returns: [groupId, creator, createdAt, exists, name, description, imageUrl, category]
  let group: Group | undefined;
  if (groupData) {
    const [groupId, creator, createdAt, exists, name, description] = groupData as [
      bigint,
      string,
      bigint,
      boolean,
      string,
      string,
      string,
      string,
    ];
    group = {
      groupId,
      creator,
      name,
      description,
      createdAt,
      exists,
    };
  }

  // Fetch posts and proposals from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsData, proposalsData] = await Promise.all([
          getPostsByGroup(registryId),
          getProposalsByGroup(registryId),
        ]);
        setPosts(postsData);
        setProposals(proposalsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [registryId]);

  if (!group || !group.exists) {
    return (
      <div className="min-h-screen bg-base-200 text-base-content flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Group Not Found</h1>
          <button onClick={() => router.push("/browse-groups")} className="btn btn-primary">
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 text-base-content py-10 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Group Header */}
        <div className="bg-base-100 rounded-xl p-8 mb-6 border border-base-300">
          <h1 className="text-4xl font-bold mb-4">{group.name}</h1>
          <p className="text-base-content opacity-70 mb-4">{group.description}</p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/group/${registryId}/create-post`)}
              className="btn btn-primary"
              disabled={!isConnected}
            >
              Create Post
            </button>
            <button
              onClick={() => router.push(`/group/${registryId}/create-proposal`)}
              className="btn btn-secondary"
              disabled={!isConnected}
            >
              Create Proposal
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("posts")}
            className={`btn ${activeTab === "posts" ? "btn-primary" : "btn-outline"}`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("proposals")}
            className={`btn ${activeTab === "proposals" ? "btn-primary" : "btn-outline"}`}
          >
            Proposals ({proposals.length})
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === "posts" && (
            <>
              {posts.length === 0 ? (
                <div className="bg-base-100 rounded-lg p-8 text-center border border-base-300">
                  <p className="text-base-content opacity-70">No posts yet. Be the first to post!</p>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="bg-base-100 rounded-lg p-6 border border-base-300">
                    <p className="text-base-content mb-2">{post.content}</p>
                    <p className="text-xs text-base-content opacity-50">
                      Posted anonymously on {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "proposals" && (
            <>
              {proposals.length === 0 ? (
                <div className="bg-base-100 rounded-lg p-8 text-center border border-base-300">
                  <p className="text-base-content opacity-70">No proposals yet. Create the first proposal!</p>
                </div>
              ) : (
                proposals.map(proposal => (
                  <div
                    key={proposal.id}
                    className="bg-base-100 rounded-lg p-6 border border-base-300 hover:border-primary transition-all cursor-pointer"
                    onClick={() => router.push(`/group/${registryId}/proposal/${proposal.id}`)}
                  >
                    <h3 className="text-xl font-bold mb-2">{proposal.title}</h3>
                    <p className="text-base-content opacity-70 mb-4">{proposal.description}</p>
                    <div className="flex justify-between items-center text-sm text-base-content opacity-50">
                      <span>Options: {(proposal.options as string[]).length}</span>
                      <span>Ends: {new Date(proposal.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
