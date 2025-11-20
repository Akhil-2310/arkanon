"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { TransactionHash } from "~~/app/blockexplorer/_components/TransactionHash";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useSemaphoreIdentity } from "~~/hooks/useSemaphoreIdentity";
import { fetchGroupMembers } from "~~/utils/semaphore/groupMembers";
import {
  computeScopeHash,
  computeSignalHash,
  createGroupFromCommitments,
  formatProofForContract,
  generateSemaphoreProof,
  hashMessage,
} from "~~/utils/semaphore/proof";
import { createPost } from "~~/utils/supabase/client";

export default function CreatePostPage({ params }: { params: Promise<{ registryId: string }> }) {
  const resolvedParams = use(params);
  const registryId = parseInt(resolvedParams.registryId);
  const router = useRouter();
  const { isConnected } = useAccount();
  const { identity } = useSemaphoreIdentity();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Fetch group data to get groupId for Semaphore
  const { data: groupData } = useScaffoldReadContract({
    contractName: "Whisp",
    functionName: "groups",
    args: [BigInt(registryId)],
  });

  const { writeContractAsync: writeWhispAsync } = useScaffoldWriteContract({
    contractName: "Whisp",
  });

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please enter post content");
      return;
    }

    if (!isConnected || !identity) {
      toast.error("Please connect your wallet and ensure your identity is initialized");
      return;
    }

    if (!groupData) {
      toast.error("Group data not loaded");
      return;
    }

    setIsSubmitting(true);

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

      // 3. Hash the message (post content) to use as message
      const message = hashMessage(content);

      // 4. Use a unique scope for each post (timestamp + registryId) so users can post multiple times
      // This ensures each post has a different nullifier
      const scope = BigInt(Date.now()) + BigInt(registryId);

      // 5. Generate Semaphore proof
      toast.loading("Generating zero-knowledge proof... This may take a moment.");
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

      // 8. Store post content in Supabase
      // The signal hash and scope hash are computed on-chain as:
      // signalHash = keccak256(abi.encodePacked(proof.message)) >> 8
      // scopeHash = keccak256(abi.encodePacked(proof.scope)) >> 8
      const signalHash = computeSignalHash(proof.message).toString();
      const scopeHash = computeScopeHash(proof.scope).toString();
      const nullifier = proof.nullifier.toString();

      await createPost(registryId, content, signalHash, scopeHash, nullifier);

      toast.success("Post created successfully!");
      router.push(`/group/${registryId}`);
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-base-100 rounded-xl p-8 border border-base-300">
          <h1 className="text-3xl font-bold mb-6">Create Anonymous Post</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Post Content</label>
              <textarea
                value={content}
                onChange={e => {
                  setContent(e.target.value);
                  setTransactionHash(null); // Clear previous transaction hash
                }}
                placeholder="Share your thoughts anonymously..."
                className="textarea textarea-bordered w-full h-40 rounded"
                disabled={isSubmitting}
              />
            </div>

            <div className="bg-info bg-opacity-20 border border-info rounded-lg p-4">
              <p className="text-sm text-base-content">
                🔒 <strong>Privacy Notice:</strong> Your post will be published anonymously using zero-knowledge proofs.
                Only members of this group can post, but your identity will remain private.
              </p>
            </div>

            {identity && (
              <div className="bg-base-200 border border-base-300 rounded-lg p-3">
                <p className="text-xs text-base-content opacity-70">
                  <strong>Your Identity Commitment:</strong>{" "}
                  <code className="text-xs break-all">{identity.commitment.toString()}</code>
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim() || !isConnected}
                className="btn btn-primary"
              >
                {isSubmitting ? "Publishing..." : "Publish Post"}
              </button>
              <button
                onClick={() => router.push(`/group/${registryId}`)}
                className="btn btn-outline"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>

            {/* Transaction Details */}
            {transactionHash && (
              <div className="mt-6 bg-success bg-opacity-20 border border-success rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <h3 className="text-lg font-semibold text-base-content">Post Transaction Confirmed!</h3>
                </div>
                <p className="text-sm text-base-content opacity-70 mb-3">
                  Your anonymous post has been successfully submitted to the blockchain.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-base-content">Transaction:</span>
                  <TransactionHash hash={transactionHash} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
