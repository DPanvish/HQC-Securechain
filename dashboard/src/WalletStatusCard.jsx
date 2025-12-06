import { useState } from "react";
import { ethers } from "ethers";
import { RPC_URL, QSW_ADDRESS, QSW_ABI } from "./config";


const modeLabel = (mode) => {
    if(mode === 0){
        return "CLASSICAL_ONLY";
    }

    if(mode === 1){
        return "HYBRID";
    }

    if(mode === 2){
        return "PQC_ONLY";
    }

    return "UNKNOWN";
};

const modeColor = (mode) => {
    if(mode === 1){
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
    }

    if(mode === 2){
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/50";
    }

    return "bg-slate-500/20 text-slate-200 border-slate-500/40";
};

const shorten = (hex) => {
    if(!hex || hex === "0x"){
        return "—";
    }

    if(hex.length <= 18){
        return hex;
    }

    return `${hex.slice(0, 10)}…${hex.slice(-6)}`;
};

const WalletStatusCard = () => {
    const [address, setAddress] = useState("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const [accountInfo, setAccountInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchStatus = async () => {
        setLoading(true);
        setError("");
        setAccountInfo(null);

        try {
            if (!ethers.isAddress(address)) {
            throw new Error("Invalid Ethereum address");
            }

            // Connect to Hardhat node
            const provider = new ethers.JsonRpcProvider(RPC_URL);

            // Attach contract
            const contract = new ethers.Contract(QSW_ADDRESS, QSW_ABI, provider);

            // Call view function
            const result = await contract.getAccount(address);
            // result is an array-like: [owner, pqPublicKey, mode, exists]
            const owner = result[0];
            const pqBytes = result[1];
            const mode = Number(result[2]);
            const exists = result[3];

            setAccountInfo({
                owner,
                pqKeyHex: pqBytes ? ethers.hexlify(pqBytes) : "0x",
                mode,
                exists,
            });
        } catch (err) {
            console.error(err);
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    };  

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-indigo-900/40">
            <h2 className="text-sm font-semibold text-slate-100 mb-1">
                Hybrid Wallet Status
            </h2> 
            <p className="text-[11px] text-slate-400 mb-3">
                Query the <span className="font-semibold text-cyan-300">QuantumSafeWallet</span>{" "}
                contract on your local Hardhat node to see how an address is configured
                (classical / hybrid / PQ-only) and whether a PQ key is registered.
            </p>  

            <div className="space-y-2 mb-3">
                <label className="text-[11px] text-slate-300">
                    Account address
                </label>
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:border-indigo-400/70 font-mono"
                />
            </div>

            <button
                onClick={fetchStatus}
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-xl bg-linear-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-900/40 hover:from-indigo-400 hover:to-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {loading ? "Checking…" : "Check Wallet Status"}
            </button>

            {error && (
                <p className="mt-2 text-[11px] text-red-400">
                    Error: {error}
                </p>
            )}

      {accountInfo && (
        <div className="mt-3 space-y-2 text-[11px] text-slate-200">
            <div className="flex items-center justify-between">
                <span className="text-slate-400">Owner:</span>
                <span className="font-mono text-[10px]">
                    {shorten(accountInfo.owner)}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-slate-400">Exists:</span>
                <span className={accountInfo.exists ? "text-emerald-300" : "text-red-300"}>
                    {accountInfo.exists ? "Yes" : "No"}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-slate-400">Mode:</span>
                <span
                    className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${modeColor(
                        accountInfo.mode
                    )}`}
                >
                    {modeLabel(accountInfo.mode)}
                </span>
            </div>

            <div className="mt-1">
                <span className="text-slate-400">PQ Public Key:</span>
                <div className="mt-1 font-mono text-[10px] text-slate-100 break-all">
                    {shorten(accountInfo.pqKeyHex)}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default WalletStatusCard;