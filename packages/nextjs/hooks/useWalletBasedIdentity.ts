import { useState } from "react";
import { Identity } from "@semaphore-protocol/core";
import { useWalletClient } from "wagmi";
import { retrieveIdentity } from "~~/utils/semaphore/identity";
import { createWalletBasedIdentity, recoverWalletBasedIdentity } from "~~/utils/semaphore/walletIdentity";

/**
 * Hook to manage wallet-based Semaphore identities
 * This creates a deterministic identity from the user's wallet signature
 * allowing identity recovery by signing the same message again
 */
export function useWalletBasedIdentity() {
  const { data: walletClient } = useWalletClient();
  const [identity, setIdentity] = useState<Identity | null>(retrieveIdentity());
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Create a new wallet-based identity by signing a message
   * If identity already exists, it will be replaced
   */
  const createIdentity = async (customMessage?: string) => {
    if (!walletClient) {
      throw new Error("Wallet not connected");
    }

    setIsCreating(true);
    try {
      const newIdentity = await createWalletBasedIdentity(walletClient, customMessage);
      setIdentity(newIdentity);
      return newIdentity;
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Recover identity by signing the same message
   * Useful if localStorage was cleared
   */
  const recoverIdentity = async (customMessage?: string) => {
    if (!walletClient) {
      throw new Error("Wallet not connected");
    }

    setIsCreating(true);
    try {
      const recoveredIdentity = await recoverWalletBasedIdentity(walletClient, customMessage);
      setIdentity(recoveredIdentity);
      return recoveredIdentity;
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Get existing identity or create a new one
   */
  const getOrCreateIdentity = async (customMessage?: string) => {
    const existing = retrieveIdentity();
    if (existing) {
      setIdentity(existing);
      return existing;
    }
    return createIdentity(customMessage);
  };

  return {
    identity,
    identityCommitment: identity?.commitment,
    isCreating,
    createIdentity,
    recoverIdentity,
    getOrCreateIdentity,
    hasIdentity: identity !== null,
  };
}
