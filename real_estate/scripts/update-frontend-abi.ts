import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Update Frontend ABI
 * This script updates the frontend constants.ts file with the latest compiled ABI
 *
 * Run this after:
 * 1. Compiling contracts: npm run compile
 * 2. Before starting the frontend
 *
 * Usage: npx ts-node scripts/update-frontend-abi.ts
 */

const ARTIFACT_PATH = join(__dirname, "../artifacts/contracts/RealEstate.sol/RealEstate.json");
const FRONTEND_CONSTANTS_PATH = join(__dirname, "../frontend/src/utils/constants.ts");

try {
  console.log("📦 Reading compiled contract artifact...");
  const artifact = JSON.parse(readFileSync(ARTIFACT_PATH, "utf-8"));
  const abi = artifact.abi;

  console.log("✅ ABI loaded successfully");
  console.log(`📊 Functions found: ${abi.filter((item: any) => item.type === "function").length}`);
  console.log(`📢 Events found: ${abi.filter((item: any) => item.type === "event").length}`);

  console.log("\n📝 Generating constants.ts file...");

  const constantsContent = `export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
export const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || "31337");
export const NETWORK_NAME =
  import.meta.env.VITE_NETWORK_NAME || "Hardhat Local";

export const CONTRACT_ABI = ${JSON.stringify(abi, null, 2)} as const;
`;

  writeFileSync(FRONTEND_CONSTANTS_PATH, constantsContent);

  console.log("✅ Frontend constants.ts updated successfully!");
  console.log(`📁 Location: ${FRONTEND_CONSTANTS_PATH}`);
  console.log("\n🎉 Done! Your frontend now has the latest contract ABI.");
  console.log("\n📝 Next steps:");
  console.log("   1. Deploy contract: npx hardhat run scripts/deploy.ts --network localhost");
  console.log("   2. Update frontend/.env with contract address");
  console.log("   3. Start frontend: cd frontend && npm run dev");

} catch (error: any) {
  console.error("❌ Error updating frontend ABI:");

  if (error.code === "ENOENT") {
    console.error("\n⚠️  Contract artifact not found!");
    console.error("Please compile the contracts first:");
    console.error("   npm run compile");
  } else {
    console.error(error.message);
  }

  process.exit(1);
}
