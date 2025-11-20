import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { SemaphoreVerifier } from "../typechain-types";
import vkData from "./data/semaphore-verifier-vk.json";

type LogFn = (message: string) => void;

const VK_CHUNK_SIZE = Math.max(Number(process.env.SEMAPHORE_VK_CHUNK_SIZE ?? "2") || 2, 1);

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy (no constructor args)
  const result = await deploy("SemaphoreVerifier", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  log(`✅ SemaphoreVerifier deployed at: ${result.address}`);

  const deployerSigner = await ethers.getSigner(deployer);
  const verifier = (await ethers.getContractAt(
    "SemaphoreVerifier",
    result.address,
    deployerSigner,
  )) as SemaphoreVerifier;

  await seedVerificationKeys(verifier, log);

  const code = await ethers.provider.getCode(result.address);
  log(`📦 Code size: ${code.length / 2} bytes`);
};

export default func;
func.tags = ["SemaphoreVerifier"];

async function seedVerificationKeys(verifier: SemaphoreVerifier, log: LogFn) {
  const locked = await verifier.verificationKeysLocked();
  if (locked) {
    log("🔐 Verification keys already locked. Skipping upload.");
    return;
  }

  const entries = Object.entries(vkData.points).map(([depth, points]) => ({
    depth: Number(depth),
    points: points.map(point => BigInt(point)),
  }));

  const pending: typeof entries = [];
  for (const entry of entries) {
    const configured = await verifier.isVerificationKeyConfigured(entry.depth);
    if (!configured) {
      pending.push(entry);
    }
  }

  if (pending.length === 0) {
    log("ℹ️  All verification keys already uploaded. Locking now.");
  } else {
    for (const batch of chunkArray(pending, VK_CHUNK_SIZE)) {
      const depths = batch.map(entry => entry.depth);
      const points = batch.map(entry => entry.points);

      const tx = await verifier.uploadVerificationKeys(depths, points);
      await tx.wait();
      log(`⬆️  Uploaded verification keys for depths: ${depths.join(", ")}`);
    }
  }

  const lockTx = await verifier.lockVerificationKeys();
  await lockTx.wait();
  log("🔒 Verification keys locked.");
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let idx = 0; idx < items.length; idx += size) {
    chunks.push(items.slice(idx, idx + size));
  }

  return chunks;
}
