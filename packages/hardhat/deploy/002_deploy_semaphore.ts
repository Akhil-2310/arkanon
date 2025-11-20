import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Semaphore } from "../typechain-types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const verifierDeployment = await deployments.get("SemaphoreVerifier");
  const verifierAddress = verifierDeployment.address;
  const poseidon = await deployments.get("PoseidonT3");

  const deployment = await deploy("Semaphore", {
    from: deployer,
    args: [verifierAddress],
    log: true,
    autoMine: true,
    libraries: {
      PoseidonT3: poseidon.address,
    },
  });

  log(`✅ Semaphore deployed at: ${deployment.address}`);
  log(`🔗 Using verifier: ${verifierAddress}`);

  const semaphore = (await ethers.getContractAt(
    "Semaphore",
    deployment.address,
    await ethers.getSigner(deployer),
  )) as Semaphore;

  const configuredVerifier = await semaphore.verifier();
  log(`🔍 Contract reports verifier: ${configuredVerifier}`);
};

export default func;
func.tags = ["Semaphore"];
func.dependencies = ["SemaphoreVerifier", "PoseidonT3"];
