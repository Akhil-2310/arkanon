import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Whisp } from "../typechain-types";

/**
 * Deploys the Whisp contract (Anonymous Social Platform)
 * Depends on Semaphore being deployed first
 * 
 * @param hre HardhatRuntimeEnvironment object
 */
const deployWhisp: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  // Get the deployed Semaphore contract address
  const semaphoreDeployment = await deployments.get("Semaphore");
  const semaphoreAddress = semaphoreDeployment.address;

  log("📝 Deploying Whisp contract...");
  log(`🔗 Using Semaphore at: ${semaphoreAddress}`);

  const deployment = await deploy("Whisp", {
    from: deployer,
    args: [semaphoreAddress],
    log: true,
    autoMine: true,
  });

  log(`✅ Whisp deployed at: ${deployment.address}`);
  log(`🌐 Network: ${hre.network.name}`);
  log(`📊 Chain ID: ${await ethers.provider.getNetwork().then(n => n.chainId)}`);

  // Verify the deployment
  const whisp = (await ethers.getContractAt(
    "Whisp",
    deployment.address,
    await ethers.getSigner(deployer),
  )) as Whisp;

  const configuredSemaphore = await whisp.semaphore();
  log(`🔍 Contract reports Semaphore: ${configuredSemaphore}`);

  if (configuredSemaphore.toLowerCase() !== semaphoreAddress.toLowerCase()) {
    throw new Error("❌ Semaphore address mismatch!");
  }

  log("✅ Whisp deployment verified successfully!");
  log("");
  log("🚀 Next steps:");
  log("1. Update arkiv.yaml with the deployed contract addresses");
  log("2. Run: npx arkiv dev (to start Arkiv indexer locally)");
  log("3. Run: npx arkiv deploy (to deploy Arkiv to production)");
  log(`4. Whisp contract address: ${deployment.address}`);
  log(`5. Semaphore contract address: ${semaphoreAddress}`);
};

export default deployWhisp;
deployWhisp.tags = ["Whisp"];
deployWhisp.dependencies = ["Semaphore"];

