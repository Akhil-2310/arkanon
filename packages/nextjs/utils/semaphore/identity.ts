import { Identity } from "@semaphore-protocol/core";

const STORAGE_KEY = "whisp_semaphore_identity";

export interface StoredIdentity {
  privateKey: string; // Base64 encoded private key
  commitment: string;
}

/**
 * Create a new Semaphore identity (random)
 */
export function createIdentity(): Identity {
  return new Identity();
}

/**
 * Create a deterministic Semaphore identity from a secret value
 * Useful for wallet-based identity generation
 */
export function createDeterministicIdentity(secret: string): Identity {
  return new Identity(secret);
}

/**
 * Store identity in localStorage
 * Stores the exported (base64) version of the private key
 */
export function storeIdentity(identity: Identity): void {
  if (typeof window === "undefined") return;

  // Use the export method to get a string representation
  const exportedPrivateKey = identity.export();

  const storedIdentity: StoredIdentity = {
    privateKey: exportedPrivateKey,
    commitment: identity.commitment.toString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedIdentity));
}

/**
 * Retrieve identity from localStorage
 */
export function retrieveIdentity(): Identity | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const { privateKey }: StoredIdentity = JSON.parse(stored);
    // Recreate identity from exported private key
    return Identity.import(privateKey);
  } catch (error) {
    console.error("Failed to retrieve identity:", error);
    return null;
  }
}

/**
 * Get or create identity - retrieves from storage or creates new one
 */
export function getOrCreateIdentity(): Identity {
  const existingIdentity = retrieveIdentity();
  if (existingIdentity) {
    return existingIdentity;
  }

  const newIdentity = createIdentity();
  storeIdentity(newIdentity);
  return newIdentity;
}

/**
 * Clear stored identity from localStorage
 */
export function clearIdentity(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if identity exists in storage
 */
export function hasIdentity(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Get identity commitment as bigint
 */
export function getIdentityCommitment(identity: Identity): bigint {
  return identity.commitment;
}

/**
 * Export identity for backup (user should save this securely)
 * Returns the private key as a base64 string
 */
export function exportIdentity(identity: Identity): string {
  return identity.export();
}

/**
 * Import identity from backup
 * Accepts a private key as a base64 string
 */
export function importIdentity(privateKeyBase64: string): Identity {
  const identity = Identity.import(privateKeyBase64);
  storeIdentity(identity);
  return identity;
}
