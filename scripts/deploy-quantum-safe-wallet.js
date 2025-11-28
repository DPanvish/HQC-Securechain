const { ethers } = require("hardhat");

async function main() {
  const QuantumSafeWallet = await ethers.getContractFactory("QuantumSafeWallet");
  const qsw = await QuantumSafeWallet.deploy();

  await qsw.waitForDeployment();  // <-- v6 correct deployment wait
  console.log("QuantumSafeWallet deployed at:", await qsw.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
