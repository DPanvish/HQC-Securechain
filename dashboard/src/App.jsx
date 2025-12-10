import React, { useEffect, useState } from "react";
import WalletStatusCard from "./WalletStatusCard";
import LotteryCard from "./LotteryCard";

const BACKEND_URL = "http://localhost:5000";

const App = () => {
  const [summary, setSummary] = useState(null);
  const [scanPath, setScanPath] = useState("contracts/QuantumSafeWallet.sol");
  const [scanResult, setScanResult] = useState(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${BACKEND_URL}/risk-summary`)
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch((err) => console.error(err));
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    setLoadingScan(true);
    setError("");
    setScanResult(null);

    try {
      const res = await fetch(
        `${BACKEND_URL}/scan?file=${encodeURIComponent(scanPath)}`
      );
      const data = await res.json();

      if (data.status === "ok") {
        setScanResult(data);
      } else {
        setError(data.error || "Scan failed");
      }
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoadingScan(false);
    }
  };

  const riskBadgeColor = (score) => {
    if (score >= 80) return "bg-red-500/20 text-red-300 border-red-500/50";
    if (score >= 50) return "bg-amber-500/20 text-amber-300 border-amber-500/50";
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-gradient-to-r from-indigo-600/40 via-slate-900 to-cyan-500/30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950/70 border border-indigo-400/40">
                🔐
              </span>
              HQC-SecureChain
            </h1>
            <p className="text-xs md:text-sm text-slate-200/80">
              Hybrid Quantum-Classical Blockchain Security Dashboard
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-200/80">
            <span className="px-2 py-1 rounded-full border border-emerald-400/40 bg-emerald-400/10">
              Backend: Online
            </span>
            <span className="px-2 py-1 rounded-full border border-cyan-400/40 bg-cyan-400/10">
              Network: Localhost
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[2fr,1.4fr]">
        {/* Left column */}
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-lg shadow-indigo-900/40">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total Reports
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {summary?.totalReports ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-lg shadow-indigo-900/40">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Average Risk
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {summary?.avgRisk
                  ? summary.avgRisk.toFixed(1)
                  : summary
                  ? "0.0"
                  : "..."}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-lg shadow-indigo-900/40">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                High-Risk Contracts
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {summary?.reports
                  ? summary.reports.filter((r) => r.riskScore >= 80).length
                  : 0}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                Scanned Contracts
              </h2>
              <span className="text-[10px] text-slate-400">
                From analyzer JSON reports
              </span>
            </div>
            {summary?.reports && summary.reports.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-800/80">
                <table className="min-w-full text-sm bg-slate-950/50">
                  <thead className="bg-slate-900/70 border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                        Contract
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-300">
                        Risk
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-300">
                        ecrecover
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-300">
                        Key Exposure
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.reports.map((r, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-800/70 hover:bg-slate-900/70 transition"
                      >
                        <td className="px-3 py-2 text-slate-100 text-xs md:text-sm">
                          {r.contract}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${riskBadgeColor(
                              r.riskScore
                            )}`}
                          >
                            {r.riskScore}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-xs text-slate-200">
                          {r.ecrecoverCount}
                        </td>
                        <td className="px-3 py-2 text-center text-xs text-slate-200">
                          {r.publicKeyExposureCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No reports yet. Run a scan below to generate one.
              </p>
            )}
          </div>

          {scanResult && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl shadow-black/40">
              <h2 className="text-sm font-semibold text-slate-100 mb-2">
                Latest Scan Result
              </h2>
              <p className="text-xs text-slate-400 mb-3">
                Contract:{" "}
                <span className="text-slate-100 font-mono">
                  {scanResult.contract}
                </span>
              </p>
              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                  <p className="text-slate-400 text-[11px]">Risk Score</p>
                  <p className="mt-1 text-lg font-semibold">
                    {scanResult.riskScore}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                  <p className="text-slate-400 text-[11px]">ecrecover Usage</p>
                  <p className="mt-1 text-lg font-semibold">
                    {scanResult.ecrecoverCount}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                  <p className="text-slate-400 text-[11px]">
                    Public Key Exposure
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {scanResult.publicKeyExposureCount}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right column */}
        <section className="space-y-4">
          <LotteryCard />
          <WalletStatusCard />
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-cyan-900/40">
            <h2 className="text-sm font-semibold text-slate-100 mb-1">
              Scan Contract for Quantum Risk
            </h2>
            <p className="text-[11px] text-slate-400 mb-3">
              Provide a Solidity contract path relative to the project root.
              The analyzer will inspect it for quantum-vulnerable patterns.
            </p>

            <form onSubmit={handleScan} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">
                  Contract path
                </label>
                <input
                  type="text"
                  value={scanPath}
                  onChange={(e) => setScanPath(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:border-cyan-400/70"
                />
              </div>
              <button
                type="submit"
                disabled={loadingScan}
                className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 hover:from-indigo-400 hover:to-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingScan ? "Scanning…" : "Run Scan"}
              </button>
            </form>

            {error && (
              <p className="mt-2 text-[11px] text-red-400">
                Error: {error}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-[11px] text-slate-300 shadow-lg shadow-slate-900/40">
            <h3 className="text-xs font-semibold text-slate-100 mb-1">
              About This Dashboard
            </h3>
            <p className="mb-1">
              This panel is part of{" "}
              <span className="font-semibold">HQC-SecureChain</span>, a hybrid
              Quantum-Classical security framework for blockchain migration to
              post-quantum cryptography.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
