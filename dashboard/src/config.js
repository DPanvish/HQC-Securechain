// src/walletConfig.js

// Hardhat local node RPC
export const RPC_URL = "http://127.0.0.1:8545";

export const QSW_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Minimal ABI only for getAccount()
export const QSW_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_owner", "type": "address" }
    ],
    "name": "getAccount",
    "outputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "bytes",   "name": "pqPublicKey", "type": "bytes" },
      {
        "internalType": "enum QuantumSafeWallet.Mode",
        "name": "mode",
        "type": "uint8"
      },
      { "internalType": "bool", "name": "exists", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
