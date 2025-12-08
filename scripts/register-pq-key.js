const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const pubKey = "0x8e380c018f3fb486ff505064d5ef1d6323973e21a432ad92ceba2add5c90b03392307b849ef090f441fe5cf7a4c1fc8b30f2ebd9f011998b3601bd9e571c73833e0527c4c047a86d3fd3e0361c56f784fd3e6c33b3e49d962f4addf71c16c42d";  
  if (!pubKey) {
    console.log("Usage: npx hardhat run scripts/register-pq-key.js --network localhost -- <public_key_hex>");
    return;
  }

  const QuantumSafeWallet = await ethers.getContractFactory("QuantumSafeWallet");
  const qsw = QuantumSafeWallet.attach(contractAddress);

  const [owner] = await ethers.getSigners();
  console.log(`Owner: ${owner.address}`);

  const tx = await qsw.connect(owner).registerAccount(pubKey);
  await tx.wait();

  console.log(`🔐 PQ Public Key stored for account ${owner.address}`);
  console.log(`Key: ${pubKey}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
