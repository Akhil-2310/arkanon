import { createPublicClient, http } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";
import { getTargetNetworks } from "~~/utils/scaffold-eth/networks";
import { fetchLogsInChunks } from "~~/utils/scaffold-eth/fetchLogsInChunks";

/**
 * Fetch all members of a group by listening to MemberJoined events
 * @param registryId - The registry ID of the group
 * @returns Array of identity commitments of all members
 */
export async function fetchGroupMembers(registryId: number): Promise<bigint[]> {
  try {
    const targetNetworks = getTargetNetworks();
    const targetNetwork = targetNetworks[0];

    if (!targetNetwork) {
      throw new Error("No target network found");
    }

    const chainId = targetNetwork.id;
    const contracts = deployedContracts[chainId as keyof typeof deployedContracts];

    if (!contracts || !contracts.Whisp) {
      throw new Error(`Whisp contract not found for chain ${chainId}`);
    }

    const whispContract = contracts.Whisp;

    // Create public client for this network
    const rpcUrl =
      scaffoldConfig.rpcOverrides?.[chainId as keyof typeof scaffoldConfig.rpcOverrides] ||
      targetNetwork.rpcUrls.default.http[0];
    const client = createPublicClient({
      chain: targetNetwork,
      transport: http(rpcUrl),
    });

    // Get current block number for chunked fetching
    const latestBlock = await client.getBlockNumber();
    
    // Start from last 10k blocks (about 8 hours on Scroll) - this covers all recent activity
    // Contract was just deployed, so all members will be in recent blocks
    const fromBlock = latestBlock > 10000n ? latestBlock - 10000n : 0n;

    console.log(`🔍 Fetching MemberJoined events from block ${fromBlock} to ${latestBlock}`);

    // Fetch MemberJoined events for this registryId
    const events = await client.getLogs({
      address: whispContract.address as `0x${string}`,
      event: {
        type: "event",
        name: "MemberJoined",
        inputs: [
          {
            indexed: true,
            name: "registryId",
            type: "uint256",
          },
          {
            indexed: true,
            name: "groupId",
            type: "uint256",
          },
          {
            indexed: true,
            name: "member",
            type: "address",
          },
          {
            indexed: false,
            name: "commitment",
            type: "uint256",
          },
          {
            indexed: false,
            name: "joinedAt",
            type: "uint64",
          },
        ],
      },
      args: {
        registryId: BigInt(registryId),
      },
      fromBlock,
      toBlock: latestBlock,
    });

    // Extract commitments from events
    const commitments: bigint[] = [];

    console.log(`✅ Found ${events.length} MemberJoined events`);

    for (const event of events) {
      if (event.args && event.args.commitment) {
        commitments.push(event.args.commitment as bigint);
        console.log(`  → Member commitment: ${event.args.commitment}`);
      }
    }

    if (commitments.length === 0) {
      console.error(`❌ No members found for registryId ${registryId}`);
      console.error(`   Searched blocks ${fromBlock} to ${latestBlock}`);
      console.error(`   Contract address: ${whispContract.address}`);
      console.error(`   Try joining the group first, then wait a few seconds for the transaction to confirm.`);
      throw new Error("No members found in this group. Make sure you've joined and the transaction is confirmed.");
    }

    console.log(`✅ Total members found: ${commitments.length}`);
    return commitments;
  } catch (error) {
    console.error("Error fetching group members:", error);
    throw error;
  }
}
