/**
 * Arkiv Client for Whisp (Read-Only)
 *
 * Arkiv is an on-chain data storage layer where we store group metadata as entities.
 * Each entity has attributes, payload, and expiration time.
 *
 * ⚠️ IMPORTANT: Write operations are handled server-side for security.
 * This client only handles READ operations.
 *
 * Official docs: https://arkiv.network
 */
import { createPublicClient, http } from "@arkiv-network/sdk";
import { mendoza } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { bytesToString } from "@arkiv-network/sdk/utils";
import type { Address } from "viem";

// Arkiv Mendoza Testnet RPC
const ARKIV_RPC = "https://mendoza.hoodi.arkiv.network/rpc";

/**
 * Create Arkiv public client for reading entities
 * This is safe to use client-side as it only reads data
 */
export function createArkivPublicClient() {
  return createPublicClient({
    chain: mendoza,
    transport: http(ARKIV_RPC),
  });
}

// Types
export interface GroupMetadata {
  registryId: string;
  name: string;
  description: string;
  imageUrl?: string;
  category?: string;
  creator: Address;
  createdAt: number;
  chainId: number; // The chain where the Whisp contract lives (Scroll Sepolia)
  contractAddress: Address; // Whisp contract address
}

export interface SignalMetadata {
  registryId: string;
  message: string;
  scope: string;
  timestamp: number;
  signalHash: string;
  nullifier: string;
}

/**
 * NOTE: Write operations (storeGroupOnArkiv, storeSignalOnArkiv) are now
 * handled server-side via API routes for security.
 *
 * See:
 * - /app/api/arkiv/store-group/route.ts
 * - /app/api/arkiv/store-signal/route.ts
 *
 * Use the hooks from useArkivGroups.ts instead:
 * - useStoreGroupOnArkiv()
 * - useStoreSignalOnArkiv()
 */

/**
 * Fetch all groups from Arkiv
 */
export async function fetchAllGroupsFromArkiv(
  publicClient: ReturnType<typeof createArkivPublicClient>,
  contractAddress: Address,
  category?: string,
) {
  try {
    const whereConditions = [eq("type", "whisp-group"), eq("contractAddress", contractAddress.toLowerCase())];

    if (category) {
      whereConditions.push(eq("category", category));
    }

    console.log("🔍 Querying Arkiv for groups:", {
      contractAddress: contractAddress.toLowerCase(),
      category,
    });

    const result = await publicClient.buildQuery().where(whereConditions).fetch();

    console.log(`✅ Found ${result.entities.length} groups on Arkiv`);

    return result.entities.map(entity => {
      const payload = JSON.parse(bytesToString(entity.payload));
      const attrs = Object.fromEntries(entity.attributes.map(a => [a.key, a.value]));

      return {
        entityKey: entity.entityKey,
        registryId: attrs.registryId,
        name: payload.name,
        description: payload.description,
        imageUrl: payload.imageUrl,
        category: attrs.category,
        creator: payload.creator as Address,
        createdAt: payload.createdAt,
        chainId: parseInt(attrs.chainId),
        contractAddress: attrs.contractAddress as Address,
      };
    });
  } catch (error) {
    console.error("❌ Error fetching all groups from Arkiv:", error);
    return [];
  }
}

/**
 * Fetch a single group by registryId
 */
export async function fetchGroupByRegistryId(
  publicClient: ReturnType<typeof createArkivPublicClient>,
  registryId: string,
  contractAddress: Address,
) {
  try {
    const result = await publicClient
      .buildQuery()
      .where([
        eq("type", "whisp-group"),
        eq("registryId", registryId),
        eq("contractAddress", contractAddress.toLowerCase()),
      ])
      .fetch();

    if (!result || !result.entities || result.entities.length === 0) {
      return null;
    }

    const entity = result.entities[0];

    // Handle empty or malformed payload
    if (!entity.payload || entity.payload.length === 0) {
      return null;
    }

    const payloadString = bytesToString(entity.payload);
    if (!payloadString || payloadString.trim() === "") {
      return null;
    }

    const payload = JSON.parse(payloadString);
    const attrs = Object.fromEntries(entity.attributes.map(a => [a.key, a.value]));

    return {
      entityKey: entity.entityKey,
      registryId: attrs.registryId,
      name: payload.name,
      description: payload.description,
      imageUrl: payload.imageUrl,
      category: attrs.category,
      creator: payload.creator as Address,
      createdAt: payload.createdAt,
      chainId: parseInt(attrs.chainId || "534351"),
      contractAddress: attrs.contractAddress as Address,
    };
  } catch (error) {
    console.warn(`⚠️ No Arkiv metadata for group ${registryId}:`, error);
    return null;
  }
}

/**
 * Fetch groups by creator
 */
export async function fetchGroupsByCreator(
  publicClient: ReturnType<typeof createArkivPublicClient>,
  creator: Address,
  contractAddress: Address,
) {
  const result = await publicClient
    .buildQuery()
    .where([
      eq("type", "whisp-group"),
      eq("creator", creator.toLowerCase()),
      eq("contractAddress", contractAddress.toLowerCase()),
    ])
    .fetch();

  return result.entities.map(entity => {
    const payload = JSON.parse(bytesToString(entity.payload));
    const attrs = Object.fromEntries(entity.attributes.map(a => [a.key, a.value]));

    return {
      entityKey: entity.entityKey,
      registryId: attrs.registryId,
      name: payload.name,
      description: payload.description,
      imageUrl: payload.imageUrl,
      category: attrs.category,
      creator: payload.creator as Address,
      createdAt: payload.createdAt,
    };
  });
}

/**
 * Search groups by name
 */
export async function searchGroupsByName(
  publicClient: ReturnType<typeof createArkivPublicClient>,
  searchTerm: string,
  contractAddress: Address,
) {
  // Fetch all groups and filter client-side
  // Note: Arkiv query doesn't support full-text search, so we filter after fetching
  const allGroups = await fetchAllGroupsFromArkiv(publicClient, contractAddress);

  const lowerSearch = searchTerm.toLowerCase();
  return allGroups.filter(
    group => group.name.toLowerCase().includes(lowerSearch) || group.description.toLowerCase().includes(lowerSearch),
  );
}

/**
 * NOTE: extendGroupExpiration should also be done server-side.
 * Create an API route if you need this functionality.
 */

/**
 * Subscribe to new group creations in real-time
 */
export async function subscribeToGroupCreations(
  publicClient: ReturnType<typeof createArkivPublicClient>,
  contractAddress: Address,
  onGroupCreated: (group: any) => void,
) {
  const stop = await publicClient.subscribeEntityEvents({
    onEntityCreated: async event => {
      try {
        const entity = await publicClient.getEntity(event.entityKey);
        const attrs = Object.fromEntries(entity.attributes.map(a => [a.key, a.value]));

        if (attrs.type === "whisp-group" && attrs.contractAddress?.toLowerCase() === contractAddress.toLowerCase()) {
          const payload = JSON.parse(bytesToString(entity.payload));
          onGroupCreated({
            entityKey: entity.entityKey,
            registryId: attrs.registryId,
            name: payload.name,
            description: payload.description,
            imageUrl: payload.imageUrl,
            category: attrs.category,
            creator: payload.creator,
            createdAt: payload.createdAt,
          });
        }
      } catch (err) {
        console.error("[subscribeToGroupCreations] error:", err);
      }
    },
    onError: err => console.error("[subscribeEntityEvents] error:", err),
  });

  return stop; // Call stop() to unsubscribe
}
