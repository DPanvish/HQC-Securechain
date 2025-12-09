const express = require("express");
const cors = require("cors");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const { getProvider, getAdminSigner, getLotteryContract } = require("./lottery-oracle");

const app = express();
app.use(cors());
app.use(express.json());

// Simple health check
app.get("/", (req, res) => {
  res.send("🔐 HQC-SecureChain Backend Running");
});

// Run analyzer on a given contract file and return parsed JSON result
app.get("/scan", (req, res) => {
  const file = req.query.file;

  if (!file) {
    return res.status(400).json({ error: "Missing 'file' query parameter" });
  }

  try {
    const scriptPath = path.join(__dirname, "../tools/smart-contract-analyzer/analyzer.js");
    const contractPath = path.join(__dirname, "..", file);

    if (!fs.existsSync(contractPath)) {
      return res.status(404).json({ error: "Contract file not found", file: contractPath });
    }

    // Run the analyzer script
    // This script writes a JSON report to tools/smart-contract-analyzer/report-output/
    execSync(`node "${scriptPath}" "${contractPath}"`, { encoding: "utf8" });

    // Get the latest report file
    const reportsDir = path.resolve(__dirname, "../tools/smart-contract-analyzer/report-output");
    const files = fs.readdirSync(reportsDir)
      .filter(f => f.endsWith("-analysis.json"))
      .sort(); // timestamp-based name -> last one is latest

    if (files.length === 0) {
      return res.status(500).json({ error: "No analysis reports found" });
    }

    const latestReportPath = path.join(reportsDir, files[files.length - 1]);
    const report = JSON.parse(fs.readFileSync(latestReportPath, "utf8"));

    return res.json({
      status: "ok",
      contract: report.contract,
      riskScore: report.riskScore,
      ecrecoverCount: report.ecrecoverCount,
      publicKeyExposureCount: report.publicKeyExposureCount,
      warnings: report.warnings || []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", error: err.toString() });
  }
});

// (Optional) simple summary endpoint to plug into dashboard later
app.get("/risk-summary", (req, res) => {
  try {
    const reportsDir = path.resolve(__dirname, "../tools/smart-contract-analyzer/report-output");
    if (!fs.existsSync(reportsDir)) {
      return res.json({ totalReports: 0, avgRisk: 0, reports: [] });
    }

    const files = fs.readdirSync(reportsDir)
      .filter(f => f.endsWith("-analysis.json"));

    if (files.length === 0) {
      return res.json({ totalReports: 0, avgRisk: 0, reports: [] });
    }

    let sum = 0;
    const reports = [];

    for (const f of files) {
      const r = JSON.parse(fs.readFileSync(path.join(reportsDir, f), "utf8"));
      sum += r.riskScore || 0;
      reports.push({
        contract: r.contract,
        riskScore: r.riskScore,
        ecrecoverCount: r.ecrecoverCount,
        publicKeyExposureCount: r.publicKeyExposureCount
      });
    }

    const avg = sum / files.length;

    return res.json({
      totalReports: files.length,
      avgRisk: avg,
      reports
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.toString() });
  }
});

// Simulated quantum random
app.get("/qrng", (req, res) => {
  const buf = crypto.randomBytes(32);
  const hex = "0x" + buf.toString("hex");

  res.json({
    source: "simulated-qrng",
    bytes: hex,
  })
})

// Request: optionally call on-chain requestRandomness (emits event)
app.post("/lottery/request", async (req, res) => {
  try {
    const signer = getAdminSigner();
    const lottery = getLotteryContract(signer);
    // call requestRandomness on chain so logs show intention (optional)
    const tx = await lottery.requestRandomness();
    await tx.wait();
    res.json({ status: "ok", tx: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Fulfill: backend fetches QRNG and calls fulfillRandomness() as admin
app.post("/lottery/fulfill", async (req, res) => {
  // Optionally accept `randomHex` in body to allow deterministic testing.
  try {
    const randomHex = req.body.randomHex || (await (await fetchQRNG()).then(r => r.bytes));
    if (!randomHex.startsWith("0x") || randomHex.length !== 66) {
      return res.status(400).json({ status: "error", error: "randomHex must be 0x-prefixed 32-byte hex" });
    }

    const signer = getAdminSigner();
    const lottery = getLotteryContract(signer);

    const tx = await lottery.fulfillRandomness(randomHex);
    await tx.wait();

    // After settlement, we can fetch round info for the previous round
    const prevRoundIdBn = (await lottery.currentRoundId()) - 1n;
    const round = await lottery.rounds(prevRoundIdBn);
    res.json({ status: "ok", tx: tx.hash, round });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", error: err.message });
  }
});


async function fetchQRNG() {
  // use local QRNG endpoint or external provider - here we call local /qrng
  const resp = await fetch("http://localhost:5000/qrng");
  return resp.json();
}

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
