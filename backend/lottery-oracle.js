// backend/lottery-oracle.js
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const { RPC_URL = "http://127.0.0.1:8545", LOTTERY_ADDRESS, ADMIN_PRIVATE_KEY } = process.env;

if (!LOTTERY_ADDRESS) {
  console.warn("LOTTERY_ADDRESS not set in env; oracle endpoints will fail until set.");
}

const QSW_ABI = [ /* keep existing ABI if needed */ ];

const LOTTERY_ABI = [
  // minimal ABI for functions we call
  "function buyTicket() payable",
  "function getParticipants(uint256) view returns (address[])",
  "function currentRoundId() view returns (uint256)",
  "function requestRandomness()",
  "function fulfillRandomness(bytes32)",
  "event RoundSettled(uint256 indexed roundId, address indexed winner, bytes32 randomness)"
];

function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

function getAdminSigner() {
  if (!ADMIN_PRIVATE_KEY) throw new Error("ADMIN_PRIVATE_KEY not set in env");
  const provider = getProvider();
  return new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
}

function getLotteryContract(signerOrProvider = null) {
  const provider = signerOrProvider || getProvider();
  const abi = LOTTERY_ABI;
  return new ethers.Contract(LOTTERY_ADDRESS, abi, signerOrProvider || provider);
}

module.exports = {
  getProvider,
  getAdminSigner,
  getLotteryContract
};
