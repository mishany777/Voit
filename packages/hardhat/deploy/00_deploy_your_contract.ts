import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployElectionManager: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;

  const deployment = await deploy("ElectionManager", {
    from: deployer,
    args: [],
    autoMine: true,
  });

  log(`✅ ElectionManager deployed at address: ${deployment.address}`);
  log(`👋 Contract deployed by: ${deployer}`);
};

export default deployElectionManager;

deployElectionManager.tags = ["ElectionManager"];
