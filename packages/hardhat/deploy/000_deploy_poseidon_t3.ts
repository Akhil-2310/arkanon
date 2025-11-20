import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("PoseidonT3", {
    contract: "poseidon-solidity/PoseidonT3.sol:PoseidonT3",
    from: deployer,
    log: true,
  });
};

export default func;
func.tags = ["PoseidonT3"];
