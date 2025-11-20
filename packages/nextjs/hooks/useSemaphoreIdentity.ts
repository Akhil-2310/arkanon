import { useEffect, useState } from "react";
import { Identity } from "@semaphore-protocol/core";
import { useAccount } from "wagmi";
import { clearIdentity, getOrCreateIdentity, storeIdentity } from "~~/utils/semaphore/identity";

/**
 * Hook to manage Semaphore identity for the connected wallet
 * Automatically creates and stores identity when wallet is connected
 */
export function useSemaphoreIdentity() {
  const { address, isConnected } = useAccount();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      // Get or create identity when wallet is connected
      const semaphoreIdentity = getOrCreateIdentity();
      setIdentity(semaphoreIdentity);
      setIsLoading(false);
    } else {
      // Clear identity when wallet is disconnected
      setIdentity(null);
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Function to regenerate identity
  const regenerateIdentity = () => {
    if (!isConnected) return;
    clearIdentity();
    const newIdentity = getOrCreateIdentity();
    setIdentity(newIdentity);
  };

  // Function to export identity for backup
  const exportIdentityBackup = () => {
    if (!identity) return null;
    // Use the export method to get base64 string
    return identity.export();
  };

  // Function to import identity from backup (using exported private key string)
  const importIdentityFromBackup = (exportedPrivateKey: string) => {
    const newIdentity = Identity.import(exportedPrivateKey);
    storeIdentity(newIdentity);
    setIdentity(newIdentity);
  };

  return {
    identity,
    identityCommitment: identity?.commitment,
    isLoading,
    regenerateIdentity,
    exportIdentity: exportIdentityBackup,
    importIdentityFromBackup,
    hasIdentity: identity !== null,
  };
}
