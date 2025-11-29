const parser = require("solidity-parser-antlr");
const fs = require("fs");
const path = require("path");

function analyzeContract(contractPath) {
    const code = fs.readFileSync(contractPath, "utf8");
    let ast;

    try{
        ast = parser.parse(code, {tolerant: true});
    }catch(err){
        return {
            error: "Parsing failed: " + err.message
        };
    }

    let warnings = [];
    let ecrecoverCount = 0;
    let publicKeyExposureCount = 0;

    parser.visit(ast, {
        FunctionCall(node){
            if (node.expression?.name === "ecrecover") {
                warnings.push("⚠ Uses ecrecover — vulnerable to quantum attacks");
                ecrecoverCount++;
            }
        },
        VariableDeclaration(node) {
            if (node.typeName?.name === "bytes" || node.typeName?.name === "bytes32") {
                if (node.name.toLowerCase().includes("pub") || node.name.toLowerCase().includes("key")) {
                    publicKeyExposureCount++;
                }
            }
        }
    });

    const riskScore = (ecrecoverCount * 50) + (publicKeyExposureCount * 10);
    const finalScore = Math.min(riskScore, 100);

    return {
        contract: path.basename(contractPath),
        ecrecoverCount,
        publicKeyExposureCount,
        riskScore: finalScore,
        warnings
    };
}

const targetFile = process.argv[2];

if (!targetFile) {
  console.log("\nUsage:");
  console.log("node tools/smart-contract-analyzer/analyzer.js <path_to_contract.sol>\n");
  process.exit(1);
}

const result = analyzeContract(targetFile);

const savePath = `tools/smart-contract-analyzer/report-output/${Date.now()}-analysis.json`;
fs.writeFileSync(savePath, JSON.stringify(result, null, 2));

console.log("\n📄 Analysis complete");
console.log("Result saved to:", savePath);
console.log("\n--- SUMMARY ---");
console.log(result);
console.log("----------------\n");