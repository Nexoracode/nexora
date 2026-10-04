import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const oneLine = (pem: string) => pem.trim().replace(/\n/g, "\\n");

console.log("# Put in this panel's .env");
console.log(`LICENSE_PRIVATE_KEY="${oneLine(privateKey.export({ type: "pkcs8", format: "pem" }).toString())}"`);
console.log("\n# Put in every customer site's .env");
console.log(`LICENSE_PUBLIC_KEY="${oneLine(publicKey.export({ type: "spki", format: "pem" }).toString())}"`);
