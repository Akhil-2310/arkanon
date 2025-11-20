/**
 * Server-side API route for storing signal metadata on Arkiv (optional)
 * This keeps the Arkiv private key secure on the server
 */

import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http } from "@arkiv-network/sdk";
import { stringToPayload } from "@arkiv-network/sdk/utils";
import { mendoza } from "@arkiv-network/sdk/chains";
import { privateKeyToAccount } from "viem/accounts";

const ARKIV_RPC = "https://mendoza.hoodi.arkiv.network/rpc";
const DEFAULT_EXPIRY = 60 * 60 * 24 * 30; // 30 days

const ARKIV_PRIVATE_KEY = process.env.ARKIV_PRIVATE_KEY as `0x${string}`;

if (!ARKIV_PRIVATE_KEY) {
  console.error("❌ ARKIV_PRIVATE_KEY not set in environment variables!");
}

export async function POST(request: NextRequest) {
  try {
    if (!ARKIV_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Arkiv not configured on server" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      registryId,
      message,
      scope,
      timestamp,
      signalHash,
      nullifier,
    } = body;

    if (!registryId || !signalHash || !nullifier) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const walletClient = createWalletClient({
      chain: mendoza,
      transport: http(ARKIV_RPC),
      account: privateKeyToAccount(ARKIV_PRIVATE_KEY),
    });

    const payload = JSON.stringify({
      message: message || "",
      scope: scope || "",
      timestamp: timestamp || Date.now(),
    });

    const result = await walletClient.createEntity({
      payload: stringToPayload(payload),
      contentType: "application/json",
      attributes: [
        { key: "type", value: "whisp-signal" },
        { key: "registryId", value: registryId.toString() },
        { key: "signalHash", value: signalHash },
        { key: "nullifier", value: nullifier },
        { key: "scope", value: scope || "" },
      ],
      expiresIn: DEFAULT_EXPIRY,
    });

    console.log("✅ Signal stored on Arkiv:", result.entityKey);

    return NextResponse.json({
      success: true,
      entityKey: result.entityKey,
      txHash: result.txHash,
    });
  } catch (error: any) {
    console.error("Error storing signal on Arkiv:", error);
    return NextResponse.json(
      { error: error.message || "Failed to store on Arkiv" },
      { status: 500 }
    );
  }
}

