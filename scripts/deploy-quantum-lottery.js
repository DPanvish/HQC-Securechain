const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners(); 

  console.log("Deploying QuantumRandomLottery from:", deployer.address);

  const ticketPriceWei = 0n; // or ethers.parseEther("0.01") for paid tickets

  const Lottery = await ethers.getContractFactory("QuantumRandomLottery");
  const lottery = await Lottery.deploy(ticketPriceWei);
  await lottery.waitForDeployment();

  console.log("QuantumRandomLottery deployed at:", await lottery.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
