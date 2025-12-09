// dashboard/src/LotteryCard.jsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { RPC_URL } from "./walletConfig"; // you already have RPC_URL
// create a lotteryConfig.js or add to walletConfig
import { LOTTERY_ADDRESS, LOTTERY_ABI } from "./lotteryConfig";

function short(hex) {
  if (!hex) return "—";
  if (hex.length <= 16) return hex;
  return hex.slice(0, 10) + "…" + hex.slice(-6);
}

export default function LotteryCard() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [currentRound, setCurrentRound] = useState(null);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    const p = new ethers.JsonRpcProvider(RPC_URL);
    setProvider(p);

    // request user wallet address if available (metaMask)
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_requestAccounts" }).then((accs) => {
        setAccount(accs[0]);
      }).catch(() => {});
    }
    loadRoundData(p);
    // eslint-disable-next-line
  }, []);

  async function loadRoundData(p) {
    if (!p || !LOTTERY_ADDRESS) return;
    try {
      const contract = new ethers.Contract(LOTTERY_ADDRESS, LOTTERY_ABI, p);
      const rid = await contract.currentRoundId();
      const roundId = Number(rid.toString());
      setCurrentRound(roundId);

      // get participants of previous round? get participants current round
      const parts = await contract.getParticipants(roundId);
      setParticipants(parts);
      // try to read prev round winner if settled
      if (roundId > 0) {
        const prev = await contract.rounds(BigInt(roundId - 1));
        if (prev && prev.settled) {
          setWinner(prev.winner);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function buyTicket() {
    if (!provider) return;
    try {
      setLoading(true);
      // Need signer (user wallet) for buyTicket
      const signer = new ethers.Web3Provider(window.ethereum).getSigner();
      const contract = new ethers.Contract(LOTTERY_ADDRESS, LOTTERY_ABI, signer);
      const tx = await contract.buyTicket({ value: 0 }); // change if ticketPrice > 0
      await tx.wait();
      setTxHash(tx.hash);
      await loadRoundData(provider);
    } catch (e) {
      console.error(e);
      alert("Buy failed: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function requestRandomness() {
    // Calls backend to perform on-chain requestRandomness as admin
    try {
      setLoading(true);
      const resp = await fetch("http://localhost:5000/lottery/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await resp.json();
      if (json.status === "ok") {
        alert("Requested randomness (tx: " + json.tx + ")");
      } else {
        alert("Failed: " + JSON.stringify(json));
      }
    } catch (e) {
      console.error(e);
      alert("Request failed: " + e.message);
    } finally {
      setLoading(false);
      await loadRoundData(provider);
    }
  }

  async function fulfillRandomness() {
    try {
      setLoading(true);
      const resp = await fetch("http://localhost:5000/lottery/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}) // or include randomHex for deterministic testing
      });
      const json = await resp.json();
      if (json.status === "ok") {
        alert("Fulfilled randomness, tx: " + json.tx);
        await loadRoundData(provider);
      } else {
        alert("Fulfill failed: " + JSON.stringify(json));
      }
    } catch (e) {
      console.error(e);
      alert("Fulfill failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="text-sm font-semibold mb-2">Quantum Random Lottery</h3>

      <p className="text-xs text-slate-400">Round: {currentRound ?? "..."}</p>
      <p className="text-xs text-slate-400">Participants: {participants.length}</p>

      <div className="mt-3 space-y-2">
        <button onClick={buyTicket} disabled={loading} className="w-full rounded-xl py-2 bg-indigo-600">Buy Ticket</button>
        <button onClick={requestRandomness} disabled={loading} className="w-full rounded-xl py-2 bg-amber-600">Request Randomness (admin)</button>
        <button onClick={fulfillRandomness} disabled={loading} className="w-full rounded-xl py-2 bg-emerald-600">Fulfill Randomness (admin)</button>
      </div>

      {winner && (
        <div className="mt-3">
          <p className="text-xs text-slate-300">Winner (last round): <span className="font-mono">{short(winner)}</span></p>
        </div>
      )}

      {txHash && (
        <div className="mt-2 text-xs text-slate-400">Last tx: {short(txHash)}</div>
      )}
    </div>
  );
}
