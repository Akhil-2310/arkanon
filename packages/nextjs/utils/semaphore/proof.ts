import { Identity } from "@semaphore-protocol/core";
import { Group } from "@semaphore-protocol/core";
import { generateProof } from "@semaphore-protocol/proof";
import { encodeAbiParameters, keccak256, parseAbiParameters } from "viem";

export interface SemaphoreProofData {
  merkleTreeDepth: number;
  merkleTreeRoot: bigint;
  nullifier: bigint;
  message: bigint;
  scope: bigint;
  points: bigint[];
}

/**
 * Generate a Semaphore proof for posting or voting
 *
 * Usage from Semaphore V4:
 * const scope = group.root
 * const message = 1
 * const proof = await generateProof(identity, group, message, scope)
 *
 * @param identity - User's Semaphore identity
 * @param group - The group (contains members' commitments)
 * @param message - The message to prove (number or bigint)
 * @param scope - The scope - typically the group.root
 * @returns Formatted proof data for contract submission
 */
export async function generateSemaphoreProof(
  identity: Identity,
  group: Group,
  message: number | bigint,
  scope: number | bigint,
): Promise<SemaphoreProofData> {
  try {
    // Convert to bigint
    const messageBigInt = typeof message === "number" ? BigInt(message) : message;
    const scopeBigInt = typeof scope === "number" ? BigInt(scope) : scope;

    // Generate the proof using the Semaphore library
    // This will automatically fetch the circuit files from a CDN if not provided
    const proof = await generateProof(identity, group, messageBigInt, scopeBigInt);

    return {
      merkleTreeDepth: Number(proof.merkleTreeDepth),
      merkleTreeRoot: BigInt(proof.merkleTreeRoot),
      nullifier: BigInt(proof.nullifier),
      message: BigInt(proof.message),
      scope: BigInt(proof.scope),
      points: proof.points.map(p => BigInt(p)),
    };
  } catch (error) {
    console.error("Failed to generate Semaphore proof:", error);
    throw new Error("Failed to generate proof. Make sure you are a member of this group.");
  }
}

/**
 * Hash a message using the same method as Semaphore contract
 * This creates a keccak256 hash compatible with the SNARK scalar modulus
 * Matches the contract's _hash function:
 * function _hash(uint256 message) private pure returns (uint256) {
 *     return uint256(keccak256(abi.encodePacked(message))) >> 8;
 * }
 *
 * @param message - The message to hash (uint256 value)
 * @returns BigInt hash value compatible with SNARK scalar modulus
 */
export function hashMessageForSemaphore(message: bigint): bigint {
  // Apply the Semaphore hash: keccak256(abi.encodePacked(message)) >> 8
  const packed = encodeAbiParameters(parseAbiParameters("uint256"), [message]);
  const hash = keccak256(packed);

  // Right shift by 8 bits to make it compatible with SNARK scalar modulus
  return BigInt(hash) >> BigInt(8);
}

/**
 * Convert a string message to a bigint for use in Semaphore proofs
 * @param content - The string content to convert
 * @returns BigInt representation of the string
 */
export function stringToBigInt(content: string): bigint {
  // Hash the string to get a uint256 value
  const hash = keccak256(encodeAbiParameters(parseAbiParameters("string"), [content]));
  return BigInt(hash);
}

/**
 * Helper function to hash content for use as a message in Semaphore proof
 * This is a convenience wrapper that combines stringToBigInt with the message
 *
 * @param content - The string content to hash
 * @returns BigInt hash value
 */
export function hashMessage(content: string): bigint {
  // For Semaphore proofs, the message is the content itself converted to bigint
  // The circuit and contract will handle the final hashing
  return stringToBigInt(content);
}

/**
 * Compute what the signalHash will be on-chain
 * This matches what the contract emits in SignalSent event:
 * uint256 signalHash = uint256(keccak256(abi.encodePacked(proof.message))) >> 8;
 *
 * @param proofMessage - The message from the proof
 * @returns The signal hash that will be emitted on-chain
 */
export function computeSignalHash(proofMessage: bigint): bigint {
  return hashMessageForSemaphore(proofMessage);
}

/**
 * Compute what the scopeHash will be on-chain
 * This matches what the contract emits in SignalSent event:
 * uint256 scopeHash = uint256(keccak256(abi.encodePacked(proof.scope))) >> 8;
 *
 * @param proofScope - The scope from the proof
 * @returns The scope hash that will be emitted on-chain
 */
export function computeScopeHash(proofScope: bigint): bigint {
  return hashMessageForSemaphore(proofScope);
}

/**
 * Create a Group object from member commitments
 * This is needed to generate proofs
 */
export function createGroupFromCommitments(memberCommitments: bigint[]): Group {
  const group = new Group();
  memberCommitments.forEach(commitment => {
    group.addMember(commitment);
  });
  return group;
}

/**
 * Format proof for contract submission
 */
export function formatProofForContract(proof: SemaphoreProofData): {
  merkleTreeDepth: bigint;
  merkleTreeRoot: bigint;
  nullifier: bigint;
  message: bigint;
  scope: bigint;
  points: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
} {
  // Ensure we have exactly 8 points
  const points = proof.points.slice(0, 8);
  while (points.length < 8) {
    points.push(BigInt(0));
  }

  return {
    merkleTreeDepth: BigInt(proof.merkleTreeDepth),
    merkleTreeRoot: proof.merkleTreeRoot,
    nullifier: proof.nullifier,
    message: proof.message,
    scope: proof.scope,
    points: points as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
  };
}
