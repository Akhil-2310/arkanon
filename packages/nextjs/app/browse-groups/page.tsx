"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useSemaphoreIdentity } from "~~/hooks/useSemaphoreIdentity";

// Component to fetch and display a single group
function GroupCard({ registryId, onJoinGroup }: { registryId: number; onJoinGroup: (id: number) => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const { address } = useAccount();

  // Fetch all group data from contract (includes metadata now!)
  const { data: groupData } = useScaffoldReadContract({
    contractName: "Whisp",
    functionName: "groups",
    args: [BigInt(registryId)],
  });

  // Check if user has already joined
  const { data: hasJoinedData } = useScaffoldReadContract({
    contractName: "Whisp",
    functionName: "hasJoined",
    args: [BigInt(registryId), address as `0x${string}` | undefined],
  });

  const hasJoined = !!hasJoinedData;

  if (!groupData) return null;

  // Contract returns: [groupId, creator, createdAt, exists, name, description, imageUrl, category]
  const [groupId, creator, createdAt, exists, name, description, imageUrl, category] = groupData as readonly [
    bigint,
    string,
    bigint,
    boolean,
    string,
    string,
    string,
    string
  ];

  if (!exists) return null;

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  return (
    <>
      <div className="card bg-base-100 shadow-xl p-6 space-y-3 border border-base-300 hover:border-primary transition-all duration-300">
        {imageUrl && (
          <div className="w-full h-40 bg-base-300 rounded-lg overflow-hidden mb-2">
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-xl text-base-content">{name || `Group #${registryId}`}</h2>
          {category && <span className="badge badge-primary badge-sm">{category}</span>}
        </div>
        <p className="text-sm text-base-content opacity-70">
          {description || "No description provided"}
        </p>
        <p className="text-xs text-base-content opacity-50">Created: {formatDate(createdAt)}</p>
        <div className="flex gap-4 pt-2">
          <button className="btn btn-outline btn-sm" onClick={() => setShowDetails(true)}>
            View Details
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onJoinGroup(registryId)} disabled={hasJoined}>
            {hasJoined ? "Already Joined" : "Join Group"}
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-base-100 rounded-xl shadow-2xl p-8 max-w-md w-full border border-base-300 relative">
            <button
              className="absolute top-4 right-4 text-base-content opacity-70 hover:opacity-100"
              onClick={() => setShowDetails(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            <h2 className="text-3xl font-bold mb-4 text-base-content border-b border-base-300 pb-2">{name}</h2>
            <p className="text-base-content opacity-70 mb-6">{description}</p>

            <div className="space-y-3 text-sm">
              <p>
                <strong className="text-base-content">Registry ID:</strong> {registryId}
              </p>
              <p>
                <strong className="text-base-content">Group ID:</strong> {groupId.toString()}
              </p>
              <p>
                <strong className="text-base-content">Creator:</strong>{" "}
                <code className="bg-base-200 p-1 rounded text-base-content text-xs">
                  {creator.slice(0, 6)}...{creator.slice(-4)}
                </code>
              </p>
              <p>
                <strong className="text-base-content">Created On:</strong> {formatDate(createdAt)}
              </p>
            </div>

            <button
              className="btn btn-primary w-full mt-6"
              onClick={() => {
                setShowDetails(false);
                onJoinGroup(registryId);
              }}
              disabled={hasJoined}
            >
              {hasJoined ? "Already Joined" : "Join This Group"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function BrowseGroups() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { identity, identityCommitment } = useSemaphoreIdentity();
  const [refreshKey, setRefreshKey] = useState(0);

  // Read the total number of groups
  const { data: nextGroupIndex, refetch: refetchGroups } = useScaffoldReadContract({
    contractName: "Whisp",
    functionName: "nextGroupIndex",
  });

  const { writeContractAsync: writeWhispAsync } = useScaffoldWriteContract({
    contractName: "Whisp",
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchGroups();
  };

  const handleJoinGroup = async (registryId: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!identity || !identityCommitment) {
      toast.error("Semaphore identity not initialized");
      return;
    }

    try {
      await writeWhispAsync({
        functionName: "joinGroup",
        args: [BigInt(registryId), identityCommitment],
      });

      toast.success("Successfully joined the group!");

      // Redirect to my groups after a short delay
      setTimeout(() => {
        router.push("/my-groups");
      }, 2000);
    } catch (error: any) {
      console.error("Error joining group:", error);
      if (error.message?.includes("Already joined")) {
        toast.error("You have already joined this group");
      } else {
        toast.error(error.message || "Failed to join group");
      }
    }
  };

  const totalGroups = nextGroupIndex ? Number(nextGroupIndex) : 0;

  return (
    <div className="min-h-screen bg-base-200 text-base-content py-10">
      <section className="max-w-xl mx-auto space-y-6 p-6">
        <h1 className="text-3xl font-bold text-base-content text-center mb-6">Browse Anonymous Groups</h1>

        {totalGroups === 0 && (
          <div className="text-center">
            <p className="text-base-content opacity-50 mt-4">No groups found. Be the first to create one!</p>
          </div>
        )}

        {Array.from({ length: totalGroups }, (_, i) => (
          <GroupCard key={i} registryId={i} onJoinGroup={handleJoinGroup} />
        ))}
      </section>
    </div>
  );
}
