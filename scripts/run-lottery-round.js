const { ethers } = require("hardhat");
const crypto = require("crypto");

async function main() {
  const [admin, user1, user2, user3] = await ethers.getSigners();

  const lotteryAddress = "0xYOUR_LOTTERY_ADDRESS_HERE"; // paste from deploy log
  const lottery = await ethers.getContractAt("QuantumRandomLottery", lotteryAddress, admin);

  console.log("Current round:", (await lottery.currentRoundId()).toString());

  // Users buy tickets
  await (await lottery.connect(user1).buyTicket({ value: 0n })).wait();
  await (await lottery.connect(user2).buyTicket({ value: 0n })).wait();
  await (await lottery.connect(user3).buyTicket({ value: 0n })).wait();

  console.log("Tickets bought by:", user1.address, user2.address, user3.address);

  // Signal randomness request (for logs)
  await (await lottery.requestRandomness()).wait();
  console.log("Randomness requested for round", (await lottery.currentRoundId()).toString());

  // Simulate QRNG: 32 bytes random
  const randomBytes = crypto.randomBytes(32);
  const randomHex = "0x" + randomBytes.toString("hex");
  console.log("Off-chain random hex:", randomHex);

  // Fulfill randomness (oracle/admin)
  const tx = await lottery.fulfillRandomness(randomHex);
  await tx.wait();

  const prevRoundId = (await lottery.currentRoundId()) - 1n;
  const round = await lottery.rounds(prevRoundId);

  console.log("Round settled:");
  console.log("  Round ID:", round.id.toString());
  console.log("  Winner:", round.winner);
  console.log("  Randomness:", round.randomness);
  console.log("  Settled:", round.settled);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
