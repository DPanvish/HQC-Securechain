const express = require("express");
const cors = require("cors");
const {execSync} = require("child_process");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("🔐 HQC-SecureChain Backend Running");
})

app.get("/scan", (req, res) => {
    const file = req.query.file;

    if (!file) return res.json({ error: "Missing file param" });

    try {
        const scriptPath = path.join(__dirname, "../tools/smart-contract-analyzer/analyzer.js");
  
        const output = execSync(`node ${scriptPath} ${file}`, { encoding: "utf8" });
        return res.json({ status: "ok", result: output });
    }catch (err) {
        return res.json({ status: "error", msg: err.toString() });
    }
});

app.listen(5000, () => {
    console.log("🚀 Backend running at http://localhost:5000");
})