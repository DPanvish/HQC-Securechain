const express = require("express");
const cors = require("cors");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
