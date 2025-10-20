import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x06F4a48b62a09426B2cfeA745771299199A1c57D";
  console.log("🔍 Verifico contratto:", contractAddress);

  const RealEstate = await ethers.getContractAt("RealEstate", contractAddress);

  const total = await RealEstate.getTotalProperties();
  console.log("\n📊 Totale proprietà:", total.toString());

  const propertiesForSale = await RealEstate.getPropertiesForSale();
  console.log("🏠 Proprietà in vendita:", propertiesForSale.length);

  const [deployer] = await ethers.getSigners();
  console.log("\n👤 Deployer address:", deployer.address);

  const myProps = await RealEstate.getMyProperties(deployer.address);
  console.log("🏡 Proprietà del deployer:", myProps.length);

  if (propertiesForSale.length > 0) {
    console.log("\n📋 Lista proprietà in vendita:");
    for (let i = 0; i < propertiesForSale.length; i++) {
      const prop = propertiesForSale[i];
      console.log(`\n  ${i + 1}. ${prop.name}`);
      console.log(`     ID: ${prop.id.toString()}`);
      console.log(`     Location: ${prop.location}`);
      console.log(`     Prezzo: ${ethers.formatEther(prop.price)} ETH`);
      console.log(`     Owner: ${prop.owner}`);
      console.log(`     In vendita: ${prop.isForSale}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
