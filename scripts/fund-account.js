// scripts/fund-account.js
const { ethers } = require("hardhat");

async function main() {
  const [funder] = await ethers.getSigners();          
  const target = "0xfabb0ac9d68b0b445fb7357272ff202c5651694a";     
  const tx = await funder.sendTransaction({
    to: target,
    value: ethers.parseEther("1.0")                   
  });
  await tx.wait();
  console.log("Sent 1 ETH to", target, "tx:", tx.hash);
}
main().catch(console.error);
