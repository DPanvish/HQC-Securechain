export const LOTTERY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const LOTTERY_ABI = [
  "function buyTicket() payable",
  "function getParticipants(uint256) view returns (address[])",
  "function currentRoundId() view returns (uint256)",
  "function requestRandomness()",
  "function fulfillRandomness(bytes32)",
  "function rounds(uint256) view returns (uint256 id,address[] participants,address winner,bytes32 randomness,uint256 timestamp,bool settled)",
];
