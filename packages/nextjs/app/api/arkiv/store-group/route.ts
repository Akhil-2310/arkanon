/**
 * Server-side API route for storing group metadata on Arkiv
 * This keeps the Arkiv private key secure on the server
 */

import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http } from "@arkiv-network/sdk";
import { stringToPayload } from "@arkiv-network/sdk/utils";
import { mendoza } from "@arkiv-network/sdk/chains";
import { privateKeyToAccount } from "viem/accounts";

const ARKIV_RPC = "https://mendoza.hoodi.arkiv.network/rpc";
const DEFAULT_EXPIRY = 60 * 60 * 24 * 30; // 30 days

// Server-side private key (NEVER exposed to client)
const ARKIV_PRIVATE_KEY = process.env.ARKIV_PRIVATE_KEY as `0x${string}`;

if (!ARKIV_PRIVATE_KEY) {
  console.error("❌ ARKIV_PRIVATE_KEY not set in environment variables!");
}

export async function POST(request: NextRequest) {
  try {
    // Validate private key exists
    if (!ARKIV_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Arkiv not configured on server" },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      registryId,
      name,
      description,
      imageUrl,
      category,
      creator,
      createdAt,
      chainId,
      contractAddress,
    } = body;

    // Validate required fields
    if (!registryId || !name || !creator || !contractAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create Arkiv wallet client
    const walletClient = createWalletClient({
      chain: mendoza,
      transport: http(ARKIV_RPC),
      account: privateKeyToAccount(ARKIV_PRIVATE_KEY),
    });

    // Prepare payload
    const payload = JSON.stringify({
      name,
      description: description || "",
      imageUrl: imageUrl || "",
      creator,
      createdAt: createdAt || Date.now(),
    });

    // Store entity on Arkiv
    const result = await walletClient.createEntity({
      payload: stringToPayload(payload),
      contentType: "application/json",
      attributes: [
        { key: "type", value: "whisp-group" },
        { key: "registryId", value: registryId.toString() },
        { key: "category", value: category || "General" },
        { key: "chainId", value: (chainId || 534351).toString() },
        { key: "contractAddress", value: contractAddress.toLowerCase() },
        { key: "creator", value: creator.toLowerCase() },
        { key: "name", value: name },
      ],
      expiresIn: DEFAULT_EXPIRY,
    });

    console.log("✅ Group stored on Arkiv:", result.entityKey);

    return NextResponse.json({
      success: true,
      entityKey: result.entityKey,
      txHash: result.txHash,
    });
  } catch (error: any) {
    console.error("Error storing group on Arkiv:", error);
    return NextResponse.json(
      { error: error.message || "Failed to store on Arkiv" },
      { status: 500 }
    );
  }
}

