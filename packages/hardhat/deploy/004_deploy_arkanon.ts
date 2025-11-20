import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Whisp } from "../typechain-types";

/**
 * Deploys ONLY the Whisp contract using existing Semaphore deployment on Scroll Sepolia
 * 
 * Scroll Sepolia Semaphore Contracts:
 * - SemaphoreVerifier: 0x4DeC9E3784EcC1eE002001BfE91deEf4A48931f8
 * - PoseidonT3: 0xB43122Ecb241DD50062641f089876679fd06599a
 * - Semaphore: 0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D
 * 
 * @param hre HardhatRuntimeEnvironment object
 */
const deployWhispOnly: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  // Existing Semaphore contract on Scroll Sepolia
  const SEMAPHORE_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";

  log("");
  log("═══════════════════════════════════════════════");
  log("📝 Deploying Whisp Contract");
  log("═══════════════════════════════════════════════");
  log(`🔗 Using existing Semaphore at: ${SEMAPHORE_ADDRESS}`);
  log(`📊 Network: ${hre.network.name}`);
  log(`👤 Deployer: ${deployer}`);
  log("");

  // Only deploy if on Scroll Sepolia
  if (hre.network.name !== "scrollSepolia") {
    log("⚠️  Warning: This script is optimized for Scroll Sepolia");
    log("⚠️  Using pre-deployed Semaphore address");
  }

  const deployment = await deploy("Whisp", {
    from: deployer,
    args: [SEMAPHORE_ADDRESS],
    log: true,
    autoMine: true,
  });

  log("");
  log("═══════════════════════════════════════════════");
  log("✅ Whisp Deployment Complete!");
  log("═══════════════════════════════════════════════");
  log(`📍 Whisp Address: ${deployment.address}`);
  log(`🔗 Semaphore Address: ${SEMAPHORE_ADDRESS}`);
  log(`⛽ Gas Used: ${deployment.receipt?.gasUsed?.toString() || "N/A"}`);
  log(`📊 Chain ID: ${await ethers.provider.getNetwork().then(n => n.chainId)}`);
  log("");

  // Verify the deployment
  try {
    const whisp = (await ethers.getContractAt(
      "Whisp",
      deployment.address,
      await ethers.getSigner(deployer),
    )) as Whisp;

    const configuredSemaphore = await whisp.semaphore();
    log("🔍 Verifying configuration...");
    log(`   Contract reports Semaphore: ${configuredSemaphore}`);

    if (configuredSemaphore.toLowerCase() !== SEMAPHORE_ADDRESS.toLowerCase()) {
      log("❌ ERROR: Semaphore address mismatch!");
      throw new Error("Semaphore address verification failed");
    }

    log("✅ Configuration verified!");
  } catch (error) {
    log("⚠️  Warning: Could not verify configuration");
    log(`   ${error}`);
  }

  log("");
  log("═══════════════════════════════════════════════");
  log("🚀 Next Steps:");
  log("═══════════════════════════════════════════════");
  log("1. Configure Arkiv:");
  log("   • Get Arkiv account at: https://arkiv.network/docs/getting-started");
  log("   • Fund account at: https://faucet.arkiv.network");
  log("   • Set ARKIV_PRIVATE_KEY in packages/nextjs/.env");
  log("");
  log("2. Start frontend:");
  log("   cd packages/nextjs");
  log("   yarn dev");
  log("");
  log("3. Create your first group at http://localhost:3000");
  log("");
  log("═══════════════════════════════════════════════");
  log(`📋 Contract Addresses (Save these!):`);
  log("═══════════════════════════════════════════════");
  log(`Whisp:              ${deployment.address}`);
  log(`Semaphore:          ${SEMAPHORE_ADDRESS}`);
  log(`SemaphoreVerifier:  0x4DeC9E3784EcC1eE002001BfE91deEf4A48931f8`);
  log(`PoseidonT3:         0xB43122Ecb241DD50062641f089876679fd06599a`);
  log("═══════════════════════════════════════════════");
  log("");
};

export default deployWhispOnly;
deployWhispOnly.tags = ["Whisp", "WhispOnly"];
// No dependencies - uses existing Semaphore deployment

