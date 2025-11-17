const fs = require("fs");
const path = require("path");

// Leggi l'artifact del contratto compilato
const artifactPath = path.join(
  __dirname,
  "../artifacts/contracts/RealEstate.sol/RealEstate.json"
);
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

// Estrai l'ABI
const abi = artifact.abi;

// Crea il contenuto del file constants.ts
const constantsContent = `export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
export const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || "1337");
export const NETWORK_NAME =
  import.meta.env.VITE_NETWORK_NAME || "Ganache Local";

export const CONTRACT_ABI = ${JSON.stringify(abi, null, 2)} as const;
`;

// Scrivi il file constants.ts
const constantsPath = path.join(
  __dirname,
  "../frontend/src/utils/constants.ts"
);
fs.writeFileSync(constantsPath, constantsContent, "utf8");

console.log("✅ ABI aggiornato con successo in constants.ts!");
console.log(
  `   Funzioni trovate: ${
    abi.filter((item) => item.type === "function").length
  }`
);
console.log(
  `   Eventi trovati: ${abi.filter((item) => item.type === "event").length}`
);
