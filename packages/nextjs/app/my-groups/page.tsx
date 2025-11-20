"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { usePublicClient } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

// Component to display a single joined group
function MyGroupCard({ registryId }: { registryId: number }) {
  const router = useRouter();
  
  // Fetch all group data from contract (includes metadata now!)
  const { data: groupData } = useScaffoldReadContract({
    contractName: "Whisp",
    functionName: "groups",
    args: [BigInt(registryId)],
  });

  if (!groupData) return null;
  
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
    <div className="card bg-base-100 shadow-xl p-6 space-y-3 border border-base-300 hover:border-primary transition-all duration-300">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} className="w-full h-32 object-cover rounded-lg mb-2" />
      )}
      <div className="flex items-center gap-2">
        <h2 className="font-bold text-xl text-base-content">{name || `Group #${registryId}`}</h2>
        {category && <span className="badge badge-primary badge-sm">{category}</span>}
      </div>
      <p className="text-sm text-base-content opacity-70">{description || "No description"}</p>
      <p className="text-xs text-base-content opacity-50">Joined on: {formatDate(createdAt)}</p>

      <div className="flex gap-4 pt-2">
        <button className="btn btn-primary btn-sm" onClick={() => router.push(`/group/${registryId}`)}>
          View Group
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => router.push(`/group/${registryId}/create-post`)}
        >
          Create Post
        </button>
      </div>
    </div>
  );
}

export default function MyGroups() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [myGroupIds, setMyGroupIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();
  const { data: whispContract } = useDeployedContractInfo("Whisp");

  // Read total number of groups
  const { data: nextGroupIndex } = useScaffoldReadContract({
    contractName: "Whisp",
    functionName: "nextGroupIndex",
  });

  // Check which groups the user has joined by reading hasJoined mapping
  useEffect(() => {
    if (!address || !isConnected || !nextGroupIndex || !publicClient || !whispContract) {
      setMyGroupIds([]);
      return;
    }

    const checkMembership = async () => {
      setIsLoading(true);
      const totalGroups = Number(nextGroupIndex);
      const joined: number[] = [];

      // Check each group to see if user has joined
      // This is efficient because we're just reading a mapping (no event scanning!)
      for (let i = 0; i < totalGroups; i++) {
        try {
          // Direct contract read - super fast!
          const hasJoined = await publicClient.readContract({
            address: whispContract.address,
            abi: whispContract.abi,
            functionName: "hasJoined",
            args: [BigInt(i), address],
          });

          if (hasJoined) {
            joined.push(i);
          }
        } catch (error) {
          console.error(`Error checking group ${i}:`, error);
        }
      }

      setMyGroupIds(joined);
      setIsLoading(false);
    };

    checkMembership();
  }, [address, isConnected, nextGroupIndex, publicClient, whispContract]);

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-base-200 text-base-content py-10 px-6">
        <section className="max-w-xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-primary text-center mb-6">My Anonymous Groups</h1>
          <div className="p-6 bg-base-100 rounded-lg shadow-lg border border-base-300">
            <p className="text-base-content opacity-70 text-center">Please connect your wallet to see your groups.</p>
          </div>
        </section>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-base-200 text-base-content py-10 px-6">
        <section className="max-w-xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-primary text-center mb-6">My Anonymous Groups</h1>
          <div className="p-6 bg-base-100 rounded-lg shadow-lg border border-base-300">
            <p className="text-base-content opacity-70 text-center">Loading your groups...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base-200 text-base-content py-10 px-6">
      <section className="max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-primary text-center mb-6">My Anonymous Groups</h1>

        {myGroupIds.length === 0 ? (
          <div className="p-6 bg-base-100 rounded-lg shadow-lg border border-base-300">
            <p className="text-base-content opacity-70 text-center mb-4">
              You haven&apos;t joined any groups yet. Browse groups to get started!
            </p>
            <div className="text-center">
              <button onClick={() => router.push("/browse-groups")} className="btn btn-primary">
                Browse Groups
              </button>
            </div>
          </div>
        ) : (
          myGroupIds.map(registryId => (
            <MyGroupCard key={registryId} registryId={registryId} />
          ))
        )}
      </section>
    </main>
  );
}
