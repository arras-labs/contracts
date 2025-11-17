import { ethers } from "hardhat";

/**
 * Deploy script for RealEstate contract - Arras Labs
 * Democratizing property investment through tokenization
 */
async function main() {
  console.log("🚀 Starting RealEstate contract deployment...");
  console.log("📋 Mission: Making property investment accessible to everyone");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("\n👤 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // USDC Contract Addresses (use appropriate one for your network)
  const USDC_ADDRESSES: { [key: string]: string } = {
    // Mainnet
    ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    polygon: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",

    // Testnets
    polygonAmoy: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582", // Mock USDC
    polygonMumbai: "0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747", // Mock USDC
    ganache: "0x0000000000000000000000000000000000000000", // Will be replaced with mock

    // Hardhat
    hardhat: "0x0000000000000000000000000000000000000000", // Mock for testing
  };

  // Get network name
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "hardhat" : network.name;
  console.log("🌐 Network:", networkName, "- Chain ID:", network.chainId);

  // Get USDC address for this network
  let usdcAddress = USDC_ADDRESSES[networkName] || USDC_ADDRESSES["hardhat"];

  // For local development, deploy a mock USDC
  if (networkName === "ganache" || networkName === "hardhat" || networkName === "localhost") {
    console.log("\n📝 Deploying mock USDC for local development...");

    // Deploy mock ERC20 token as USDC
    const MockERC20 = await ethers.getContractFactory("contracts/MockUSDC.sol:MockUSDC");
    const mockUsdc = await MockERC20.deploy();
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();

    console.log("✅ Mock USDC deployed at:", usdcAddress);
  }

  console.log("💵 Using USDC address:", usdcAddress);

  // Deploy RealEstate contract
  console.log("\n🏗️  Deploying RealEstate contract...");
  const RealEstate = await ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy(usdcAddress);

  await realEstate.waitForDeployment();
  const contractAddress = await realEstate.getAddress();

  console.log("✅ RealEstate contract deployed at:", contractAddress);

  // Add sample properties
  console.log("\n📋 Adding sample properties...");
  console.log("💡 Each fractional token = $50 USD");
  console.log("💡 Yield expressed in basis points (500 = 5.00% annual)");

  const properties = [
    {
      name: "Modern Villa with Pool",
      description:
        "Stunning modern villa with swimming pool, garden, and ocean view. 4 bedrooms, 3 bathrooms. Perfect for families seeking luxury living.",
      location: "Malibu, California",
      totalValueUSD: 500000, // $500,000 = 10,000 tokens
      area: 350,
      imageUrl:
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
      estimatedYield: 450, // 4.5% annual yield
    },
    {
      name: "Historic Downtown Apartment",
      description:
        "Elegant renovated apartment in the heart of downtown. 2 bedrooms, 1 bathroom. Walking distance to all amenities.",
      location: "Boston, Massachusetts",
      totalValueUSD: 250000, // $250,000 = 5,000 tokens
      area: 120,
      imageUrl:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      estimatedYield: 550, // 5.5% annual yield
    },
    {
      name: "Luxury Penthouse",
      description:
        "Luxury penthouse with panoramic terrace. 3 bedrooms, 2 bathrooms, double garage. Breathtaking city views.",
      location: "Miami, Florida",
      totalValueUSD: 750000, // $750,000 = 15,000 tokens
      area: 280,
      imageUrl:
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      estimatedYield: 400, // 4.0% annual yield
    },
    {
      name: "Country Estate",
      description:
        "Fully restored rustic estate on 5000sqm of land. 5 bedrooms, 3 bathrooms. Ideal for nature lovers.",
      location: "Austin, Texas",
      totalValueUSD: 350000, // $350,000 = 7,000 tokens
      area: 400,
      imageUrl:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      estimatedYield: 600, // 6.0% annual yield
    },
    {
      name: "Designer Loft",
      description:
        "Loft in converted industrial zone, modern minimalist design. Open-plan, 1 bathroom. Perfect for young professionals.",
      location: "Portland, Oregon",
      totalValueUSD: 180000, // $180,000 = 3,600 tokens
      area: 180,
      imageUrl:
        "https://images.unsplash.com/photo-1502672260066-6bc35f0b3764?w=800",
      estimatedYield: 500, // 5.0% annual yield
    },
  ];

  for (const property of properties) {
    const tx = await realEstate.listProperty(
      property.name,
      property.description,
      property.location,
      property.totalValueUSD,
      property.area,
      property.imageUrl,
      property.estimatedYield
    );
    await tx.wait();

    const tokens = Math.floor(property.totalValueUSD / 50);
    const yieldPercent = (property.estimatedYield / 100).toFixed(2);
    console.log(
      `✅ Added: ${property.name} - $${property.totalValueUSD.toLocaleString()} (${tokens} tokens, ${yieldPercent}% yield)`
    );
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Configuration Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract Address:", contractAddress);
  console.log("USDC Address:", usdcAddress);
  console.log("Network:", networkName);
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n📄 Save this to your frontend .env file:");
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`VITE_USDC_ADDRESS=${usdcAddress}`);
  console.log(`VITE_CHAIN_ID=${network.chainId}`);

  console.log("\n🌟 Arras Labs - Democratizing Property Investment");
  console.log("💡 Making real estate accessible to everyone");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
