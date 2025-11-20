"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { TransactionHash } from "~~/app/blockexplorer/_components/TransactionHash";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useSemaphoreIdentity } from "~~/hooks/useSemaphoreIdentity";
import { fetchGroupMembers } from "~~/utils/semaphore/groupMembers";
import {
  computeSignalHash,
  createGroupFromCommitments,
  formatProofForContract,
  generateSemaphoreProof,
} from "~~/utils/semaphore/proof";
import { createVote, getProposalById, getVoteCounts } from "~~/utils/supabase/client";

type Proposal = {
  id: string;
  registry_id: number;
  title: string;
  description: string;
  options: string[];
  end_date: string;
  created_at: string;
};

export default function ProposalDetailPage({
  params,
}: {
  params: Promise<{ registryId: string; proposalId: string }>;
}) {
  const resolvedParams = use(params);
  const registryId = parseInt(resolvedParams.registryId);
  const proposalId = resolvedParams.proposalId;
  const router = useRouter();
  const { isConnected } = useAccount();
  const { identity } = useSemaphoreIdentity();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [voteCounts, setVoteCounts] = useState<{ [key: number]: number }>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const { writeContractAsync: writeWhispAsync } = useScaffoldWriteContract({
    contractName: "Whisp",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proposalData, counts] = await Promise.all([getProposalById(proposalId), getVoteCounts(proposalId)]);
        setProposal(proposalData);
        setVoteCounts(counts);
      } catch (error) {
        console.error("Error fetching proposal:", error);
        toast.error("Failed to load proposal");
      }
    };

    fetchData();
  }, [proposalId]);

  const handleVote = async () => {
    if (selectedOption === null) {
      toast.error("Please select an option");
      return;
    }

    if (!isConnected || !identity) {
      toast.error("Please connect your wallet and ensure your identity is initialized");
      return;
    }

    setIsVoting(true);

    try {
      // 1. Fetch actual group members from MemberJoined events
      toast.loading("Fetching group members...");
      const members = await fetchGroupMembers(registryId);
      const group = createGroupFromCommitments(members);
      toast.dismiss();

      // 2. Check if user's identity is in the group
      const userCommitment = identity.commitment;
      const isMember = members.some(member => member === userCommitment);

      if (!isMember) {
        console.error("Identity not found in group!");
        console.error("Your commitment:", userCommitment.toString());
        console.error(
          "Group members:",
          members.map(m => m.toString()),
        );
        toast.error("Your identity is not a member of this group. Please join the group first.");
        return;
      }

      // 3. Message is simply the option index (0, 1, 2, etc.)
      const message = BigInt(selectedOption);

      // 4. Scope must be unique per proposal to prevent nullifier reuse
      // We combine group.root with proposal ID to create a unique scope
      // This allows voting on multiple proposals while preventing double-voting on each
      const proposalIdHash = BigInt(
        "0x" +
          Array.from(new TextEncoder().encode(proposalId))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("")
            .slice(0, 60), // Take first 60 hex chars to avoid overflow
      );
      const scope = group.root ^ proposalIdHash; // XOR to combine them uniquely

      // 5. Generate Semaphore proof
      toast.loading("Generating zero-knowledge proof...");
      const proof = await generateSemaphoreProof(identity, group, message, scope);
      toast.dismiss();

      // 6. Format proof for contract
      const formattedProof = formatProofForContract(proof);

      // 7. Submit proof to contract
      toast.loading("Submitting proof to blockchain...");
      const txHash = await writeWhispAsync({
        functionName: "validateSignal",
        args: [BigInt(registryId), formattedProof],
      });
      toast.dismiss();

      // Store transaction hash
      if (txHash) {
        setTransactionHash(txHash);
      }

      // 8. Store vote in Supabase
      const signalHash = computeSignalHash(proof.message).toString();
      const nullifier = proof.nullifier.toString();

      await createVote(proposalId, selectedOption, signalHash, nullifier);

      toast.success("Vote submitted successfully!");

      // Refresh vote counts
      const counts = await getVoteCounts(proposalId);
      setVoteCounts(counts);
    } catch (error: any) {
      console.error("Error voting:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to submit vote");
    } finally {
      setIsVoting(false);
    }
  };

  if (!proposal) {
    return (
      <div className="min-h-screen bg-base-200 text-base-content flex items-center justify-center">
        <p>Loading proposal...</p>
      </div>
    );
  }

  const isExpired = new Date(proposal.end_date) <= new Date();
  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-base-200 text-base-content py-10 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-base-100 rounded-xl p-8 border border-base-300">
          <h1 className="text-3xl font-bold mb-4">{proposal.title}</h1>
          <p className="text-base-content opacity-70 mb-6">{proposal.description}</p>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-base-content opacity-50 mb-2">
              <span>Ends: {new Date(proposal.end_date).toLocaleString()}</span>
              <span className={isExpired ? "text-error" : "text-success"}>
                {isExpired ? "Voting Closed" : "Voting Open"}
              </span>
            </div>
            <div className="text-sm text-base-content opacity-50">Total Votes: {totalVotes}</div>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="text-xl font-semibold">Options</h3>
            {(proposal.options as string[]).map((option, index) => {
              const votes = voteCounts[index] || 0;
              const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;

              return (
                <div
                  key={index}
                  onClick={() => {
                    if (!isExpired) {
                      setSelectedOption(index);
                      setTransactionHash(null); // Clear previous transaction hash
                    }
                  }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedOption === index
                      ? "border-primary bg-primary bg-opacity-20"
                      : "border-base-300 bg-base-200 hover:border-primary"
                  } ${isExpired ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{option}</span>
                    <span className="text-sm text-base-content opacity-70">
                      {votes} votes ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {!isExpired && (
            <div className="flex gap-4">
              <button
                onClick={handleVote}
                disabled={isVoting || selectedOption === null || !isConnected}
                className="btn btn-primary"
              >
                {isVoting ? "Submitting Vote..." : "Submit Vote"}
              </button>
              <button onClick={() => router.push(`/group/${registryId}`)} className="btn btn-outline">
                Back to Group
              </button>
            </div>
          )}

          {/* Transaction Details */}
          {transactionHash && (
            <div className="mt-6 bg-success bg-opacity-20 border border-success rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <h3 className="text-lg font-semibold text-base-content">Vote Transaction Confirmed!</h3>
              </div>
              <p className="text-sm text-base-content opacity-70 mb-3">
                Your anonymous vote has been successfully submitted to the blockchain.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-base-content">Transaction:</span>
                <TransactionHash hash={transactionHash} />
              </div>
            </div>
          )}

          {isExpired && (
            <button onClick={() => router.push(`/group/${registryId}`)} className="btn btn-outline">
              Back to Group
            </button>
          )}

          <div className="mt-6 bg-info bg-opacity-20 border border-info rounded-lg p-4">
            <p className="text-sm text-base-content">
              🔒 <strong>Anonymous Voting:</strong> Your vote is submitted using zero-knowledge proofs, keeping your
              identity private while proving you&apos;re a group member.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
