import { GetLogsParameters, Log, PublicClient } from "viem";

/**
 * Fetch logs in chunks to avoid "block range too large" errors
 * Works with any RPC provider (public or paid)
 *
 * @param client - Viem public client
 * @param params - GetLogs parameters
 * @param chunkSize - Number of blocks per chunk (default: 10000 for public RPCs)
 * @returns All logs matching the filter
 */
export async function fetchLogsInChunks<TAbiEvent extends any = undefined>(
  client: PublicClient,
  params: Omit<GetLogsParameters<any>, "fromBlock" | "toBlock"> & {
    fromBlock: bigint;
    toBlock: bigint;
  },
  chunkSize: number = 5000,
): Promise<Log<bigint, number, false, any>[]> {
  const { fromBlock, toBlock, ...restParams } = params;

  const latestBlock = toBlock;
  const totalBlocks = latestBlock - fromBlock + 1n;

  // If range is small enough, fetch in one go
  if (totalBlocks <= BigInt(chunkSize)) {
    console.log(`📊 Fetching logs from block ${fromBlock} to ${latestBlock} (${totalBlocks} blocks) in one request`);
    return (await client.getLogs({
      ...restParams,
      fromBlock,
      toBlock: latestBlock,
    } as any)) as Log<bigint, number, false, any>[];
  }

  // Otherwise, fetch in chunks
  console.log(
    `📊 Fetching logs from block ${fromBlock} to ${latestBlock} (${totalBlocks} blocks) in chunks of ${chunkSize}`,
  );
  const allLogs: Log<bigint, number, false, any>[] = [];
  let currentBlock = fromBlock;
  let chunkIndex = 0;

  while (currentBlock <= latestBlock) {
    const endBlock =
      currentBlock + BigInt(chunkSize) - 1n > latestBlock ? latestBlock : currentBlock + BigInt(chunkSize) - 1n;
    chunkIndex++;

    console.log(`  📦 Chunk ${chunkIndex}: fetching blocks ${currentBlock} to ${endBlock}`);

    try {
      const logs = (await client.getLogs({
        ...restParams,
        fromBlock: currentBlock,
        toBlock: endBlock,
      } as any)) as Log<bigint, number, false, any>[];

      console.log(`  ✅ Chunk ${chunkIndex}: found ${logs.length} events`);
      allLogs.push(...logs);
    } catch (error: any) {
      // If we still hit block range limits, try with smaller chunk size
      if (error?.message?.includes("block range") || error?.details?.includes("block range")) {
        console.warn(`Block range still too large, retrying with smaller chunks from ${currentBlock} to ${endBlock}`);

        // Recursively fetch with half the chunk size
        const smallerChunkLogs = await fetchLogsInChunks(
          client,
          {
            ...restParams,
            fromBlock: currentBlock,
            toBlock: endBlock,
          } as any,
          Math.floor(chunkSize / 2),
        );

        allLogs.push(...smallerChunkLogs);
      } else {
        throw error;
      }
    }

    currentBlock = endBlock + 1n;
  }

  console.log(`✅ Finished fetching logs: ${allLogs.length} total events found`);
  return allLogs;
}
