# Frontend Setup Guide

This guide will help you set up and run the Arras Labs Real Estate Tokenization frontend.

## Prerequisites

- Node.js v18+ installed
- MetaMask browser extension
- A local blockchain running (Hardhat node)
- Smart contracts deployed

## Quick Start

### 1. Start Local Blockchain

In a new terminal:
```bash
npx hardhat node
```

Leave this terminal running. It will display test accounts with their private keys.

### 2. Deploy Smart Contracts

In another terminal:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

**Important:** Copy the contract address from the deployment output. You'll see something like:
```
✅ RealEstate contract deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 3. Configure Frontend Environment

#### Option A: Manual Setup (Recommended)
1. Copy the example environment file:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Edit `frontend/.env` and add the contract address:
   ```env
   VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   VITE_CHAIN_ID=31337
   VITE_NETWORK_NAME=Hardhat Local
   ```

#### Option B: Automated Setup
```bash
npx ts-node scripts/setup-frontend.ts 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 5. Start Frontend Development Server

```bash
npm run dev
```

The frontend will be available at **http://localhost:5173**

### 6. Configure MetaMask

#### Add Hardhat Local Network

1. Open MetaMask
2. Click network selector → "Add network" → "Add a network manually"
3. Enter these details:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://localhost:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: ETH

#### Import Test Account

1. Copy a private key from the Hardhat node terminal (Account #0 or any other)
2. In MetaMask: Click account icon → "Import Account"
3. Paste the private key
4. You now have a funded test account!

## Using the Application

### Viewing Properties

- Browse available properties on the homepage
- Each property shows:
  - Real-time ETH/USD conversion rates
  - Interactive map with actual location
  - Nearby points of interest (metro, shops, etc.)
  - Pool completion percentage
  - Estimated annual yield

### Buying Fractional Tokens

1. Click on a property
2. Enter the number of tokens you want to buy
3. Confirm the transaction in MetaMask
4. Wait for confirmation

### Managing Your Investments

- View "My Properties" to see properties you own (NFTs)
- View "My Investments" to see fractional token holdings
- Track dividends and yields

## Features

### Real-Time Pricing
- Fetches live ETH/USD rates from CoinGecko API
- Updates every 60 seconds
- No API key required

### Interactive Maps
- Shows exact property locations using Nominatim geocoding
- Displays nearby amenities (transit, dining, shopping, etc.)
- Powered by OpenStreetMap (no API key needed)

### Blockchain Integration
- Fractional property ownership via ERC721 NFTs
- Pool-based token sales ($50 per token)
- Automatic dividend distribution
- KYC/compliance features
- Pull payment security pattern

## Troubleshooting

### "ENS name not configured" Error

This means the contract address is not set in your `.env` file:
1. Check that `frontend/.env` exists
2. Verify `VITE_CONTRACT_ADDRESS` has a valid address (starts with 0x)
3. Restart the development server after changing .env

### MetaMask Not Connecting

1. Make sure MetaMask is unlocked
2. Check you're on the correct network (Hardhat Local)
3. Try refreshing the page
4. Check browser console for errors

### "KYC verification required" Error

The deployer account (Account #0 from Hardhat node) is automatically KYC verified. Other accounts need to be verified by the admin:
```bash
# In Hardhat console
const realEstate = await ethers.getContractAt("RealEstate", "0x...");
await realEstate.setKYCVerification("0xUserAddress", true);
```

### Map Not Loading

- Check your internet connection (maps require external APIs)
- Wait a few seconds for geocoding to complete
- Some addresses may not be found in OpenStreetMap

## Development

### Project Structure

```
frontend/
├── src/
│   ├── components/         # React components
│   │   ├── PropertyMap.tsx # Interactive map
│   │   ├── PropertyDetails.tsx
│   │   └── ...
│   ├── services/           # External services
│   │   ├── priceOracle.ts  # CoinGecko integration
│   │   └── geocoding.ts    # Nominatim + Overpass
│   ├── hooks/              # Custom React hooks
│   │   └── useWeb3.ts      # Web3 integration
│   └── utils/
│       └── constants.ts    # Contract ABI and config
└── .env                    # Environment variables
```

### Environment Variables

- `VITE_CONTRACT_ADDRESS`: RealEstate contract address (required)
- `VITE_CHAIN_ID`: Blockchain chain ID (default: 31337)
- `VITE_NETWORK_NAME`: Network display name

## Production Deployment

### Polygon Mumbai Testnet

1. Deploy contracts:
   ```bash
   npx hardhat run scripts/deploy.ts --network polygonMumbai
   ```

2. Update `.env`:
   ```env
   VITE_CONTRACT_ADDRESS=0x...
   VITE_CHAIN_ID=80001
   VITE_NETWORK_NAME=Polygon Mumbai
   ```

3. Build frontend:
   ```bash
   npm run build
   ```

4. Deploy `dist/` folder to hosting service

## Support

For issues or questions:
- Check the main README.md
- Review smart contract documentation
- Open an issue on GitHub

---

**Arras Labs** - Democratizing property investment through blockchain technology
