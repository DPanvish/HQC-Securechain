const crypto = require("crypto");

function generatePqPublicKey(bytes = 64) {
    const buf = crypto.randomBytes(bytes);
    return "0x" + buf.toString("hex");
}

const pqPubKey = generatePqPublicKey(96);
console.log("\n===== Simulated PQ Public Key =====");
console.log(pqPubKey);
console.log("====================================\n");