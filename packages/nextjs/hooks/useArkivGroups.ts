/**
 * React hooks for Arkiv data storage
 *
 * These hooks interact with Arkiv Mendoza testnet to store and retrieve
 * group metadata off-chain while keeping the core group logic on Scroll Sepolia.
 */

/**
 * React hooks for Arkiv data storage
 *
 * ⚠️ SECURITY: All write operations go through server-side API routes
 * to keep the Arkiv private key secure.
 */
import { useEffect, useState } from "react";
import { useDeployedContractInfo } from "./scaffold-eth";
import {
  type GroupMetadata,
  createArkivPublicClient,
  fetchAllGroupsFromArkiv,
  fetchGroupByRegistryId,
  fetchGroupsByCreator,
  searchGroupsByName,
} from "~~/utils/arkiv/client";

/**
 * Helper to check if Arkiv is configured on the server
 */
async function checkArkivServerConfig(): Promise<boolean> {
  try {
    const response = await fetch("/api/arkiv/health");
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Hook to fetch all groups from Arkiv
 */
export function useArkivAllGroups(category?: string) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { data: contractInfo } = useDeployedContractInfo("Whisp");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!contractInfo?.address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const publicClient = createArkivPublicClient();
        const data = await fetchAllGroupsFromArkiv(publicClient, contractInfo.address, category);

        if (mounted) {
          setGroups(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          console.error("Error fetching groups from Arkiv:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [category, contractInfo?.address]);

  return { groups, loading, error };
}

/**
 * Hook to fetch a single group by registry ID
 */
export function useArkivGroup(registryId: string | undefined) {
  const [group, setGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { data: contractInfo } = useDeployedContractInfo("Whisp");

  useEffect(() => {
    let mounted = true;

    if (!registryId || !contractInfo?.address) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const publicClient = createArkivPublicClient();
        const data = await fetchGroupByRegistryId(publicClient, registryId!, contractInfo!.address);

        if (mounted) {
          setGroup(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          console.error("Error fetching group from Arkiv:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [registryId, contractInfo?.address]);

  return { group, loading, error };
}

/**
 * Hook to fetch groups created by a user
 */
export function useArkivGroupsByCreator(creator: string | undefined) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { data: contractInfo } = useDeployedContractInfo("Whisp");

  useEffect(() => {
    let mounted = true;

    if (!creator || !contractInfo?.address) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const publicClient = createArkivPublicClient();
        const data = await fetchGroupsByCreator(publicClient, creator as any, contractInfo!.address);

        if (mounted) {
          setGroups(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          console.error("Error fetching creator's groups from Arkiv:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [creator, contractInfo?.address]);

  return { groups, loading, error };
}

/**
 * Hook to search groups by name/description
 */
export function useArkivSearchGroups(searchTerm: string | undefined) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { data: contractInfo } = useDeployedContractInfo("Whisp");

  useEffect(() => {
    let mounted = true;

    if (!searchTerm || searchTerm.trim().length === 0 || !contractInfo?.address) {
      setGroups([]);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const publicClient = createArkivPublicClient();
        const data = await searchGroupsByName(publicClient, searchTerm!, contractInfo!.address);

        if (mounted) {
          setGroups(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          console.error("Error searching groups on Arkiv:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    // Debounce search
    const timeoutId = setTimeout(load, 300);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchTerm, contractInfo?.address]);

  return { groups, loading, error };
}

/**
 * Hook to store a group on Arkiv after creating it on-chain
 * Uses server-side API to keep private key secure
 */
export function useStoreGroupOnArkiv() {
  const { data: contractInfo } = useDeployedContractInfo("Whisp");
  const [isStoring, setIsStoring] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // Check server configuration on mount
  useEffect(() => {
    checkArkivServerConfig().then(setIsConfigured);
  }, []);

  const storeGroup = async (metadata: Omit<GroupMetadata, "contractAddress" | "chainId">) => {
    if (!contractInfo?.address) {
      throw new Error("Contract info not available");
    }

    setIsStoring(true);
    try {
      // Call server-side API route
      const response = await fetch("/api/arkiv/store-group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...metadata,
          contractAddress: contractInfo.address,
          chainId: 534351, // Scroll Sepolia
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to store on Arkiv");
      }

      const result = await response.json();
      console.log("✅ Group stored on Arkiv:", result.entityKey);
      return result;
    } catch (error) {
      console.error("Error storing group on Arkiv:", error);
      throw error;
    } finally {
      setIsStoring(false);
    }
  };

  return {
    storeGroup,
    isStoring,
    isConfigured,
  };
}

/**
 * Hook to store a signal on Arkiv (optional)
 * Uses server-side API to keep private key secure
 */
export function useStoreSignalOnArkiv() {
  const [isStoring, setIsStoring] = useState(false);

  const storeSignal = async (metadata: {
    registryId: string;
    message: string;
    scope: string;
    timestamp: number;
    signalHash: string;
    nullifier: string;
  }) => {
    setIsStoring(true);
    try {
      const response = await fetch("/api/arkiv/store-signal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to store signal on Arkiv");
      }

      const result = await response.json();
      console.log("✅ Signal stored on Arkiv:", result.entityKey);
      return result;
    } catch (error) {
      console.error("Error storing signal on Arkiv:", error);
      throw error;
    } finally {
      setIsStoring(false);
    }
  };

  return {
    storeSignal,
    isStoring,
  };
}
