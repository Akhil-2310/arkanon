import { storeIdentity } from "./identity";
import { Identity } from "@semaphore-protocol/core";

/**
 * Create a deterministic Semaphore identity from a wallet signature
 * This allows users to recover their identity by signing the same message with their wallet
 *
 * @param signer - The wallet signer (from wagmi/viem)
 * @param customMessage - Optional custom message to sign (defaults to a standard message)
 * @returns Promise<Identity> - The deterministic Semaphore identity
 *
 * Usage:
 * ```ts
 * const { data: walletClient } = useWalletClient();
 * const identity = await createWalletBasedIdentity(walletClient);
 * ```
 */
export async function createWalletBasedIdentity(
  signer: any, // WalletClient from wagmi
  customMessage?: string,
): Promise<Identity> {
  const message =
    customMessage ||
    "Sign this message to create your Whisp anonymous identity. This signature will be used to deterministically generate your Semaphore identity.";

  try {
    // Request signature from wallet
    const signature = await signer.signMessage({ message });

    // Create deterministic identity from signature
    const identity = new Identity(signature);

    // Store identity in localStorage
    storeIdentity(identity);

    return identity;
  } catch (error) {
    console.error("Failed to create wallet-based identity:", error);
    throw new Error("Failed to sign message for identity creation");
  }
}

/**
 * Recover a Semaphore identity by signing the same message again
 * This is useful if the user cleared their localStorage
 *
 * @param signer - The wallet signer
 * @param customMessage - The same custom message used during creation (if any)
 * @returns Promise<Identity> - The recovered Semaphore identity
 */
export async function recoverWalletBasedIdentity(signer: any, customMessage?: string): Promise<Identity> {
  // This is the same as creating - deterministic generation ensures same identity
  return createWalletBasedIdentity(signer, customMessage);
}
