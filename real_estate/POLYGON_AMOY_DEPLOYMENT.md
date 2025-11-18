# Polygon Amoy Testnet Deployment Guide

This guide will help you deploy and test the Arras Labs Real Estate Tokenization platform on Polygon Amoy testnet.

## 🌐 Why Polygon Amoy Testnet?

- **Real blockchain environment** - No local network issues
- **Free test tokens** - Get POL (Polygon) tokens from faucet
- **Public accessibility** - Share the app with anyone
- **Production-like** - Identical to Polygon mainnet behavior

---

## 📋 Prerequisites

1. **MetaMask** installed in your browser
2. **Node.js** v18+ installed
3. **Git** for version control
4. **Alchemy or Infura account** (free tier)

---

## 🚀 Step 1: Get Polygon Amoy Test Tokens (POL)

### Add Polygon Amoy Network to MetaMask

1. Open MetaMask
2. Click network selector → "Add network" → "Add a network manually"
3. Enter these details:
   ```
   Network Name: Polygon Amoy Testnet
   RPC URL: https://rpc-amoy.polygon.technology/
   Chain ID: 80002
   Currency Symbol: POL
   Block Explorer: https://amoy.polygonscan.com/
   ```
4. Click "Save"

### Get Test POL Tokens

1. Go to **Polygon Faucet**: https://faucet.polygon.technology/
2. Select "Polygon Amoy"
3. Paste your MetaMask wallet address
4. Complete CAPTCHA
5. Click "Submit"
6. Wait 1-2 minutes - you'll receive **0.5 POL** (enough for many transactions)

**Alternative faucets:**
- https://www.alchemy.com/faucets/polygon-amoy
- https://faucets.chain.link/polygon-amoy

---

## 🔑 Step 2: Get Alchemy API Key (Free)

1. Go to https://www.alchemy.com/
2. Sign up for free account
3. Click "Create new app"
   - Name: "Arras Labs RealEstate"
   - Chain: Polygon
   - Network: Amoy (Testnet)
4. Click "View Key"
5. Copy the **HTTPS URL** (looks like: `https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY`)

---

## ⚙️ Step 3: Configure Project for Testnet

### 1. Create .env File

In the project root (`real_estate/`):

```bash
cp .env.example .env
nano .env  # or use your favorite editor
```

Add your configuration:

```env
# Alchemy RPC URL for Polygon Amoy
POLYGON_AMOY_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY

# Your MetaMask private key (NEVER share this or commit to git!)
# To get it: MetaMask → Account details → Export private key
PRIVATE_KEY=your_private_key_here

# Optional: For verifying contracts on PolygonScan
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Ganache (keep for local dev if needed)
GANACHE_URL=http://127.0.0.1:7545
```

**⚠️ SECURITY WARNING:**
- NEVER commit `.env` to git
- NEVER share your private key
- Use a test wallet, not your main wallet with real funds

### 2. Verify .gitignore

Make sure `.env` is in `.gitignore`:

```bash
echo ".env" >> .gitignore
```

---

## 🏗️ Step 4: Compile and Deploy to Polygon Amoy

### 1. Clean and Compile

```bash
npm run clean
npm run compile
```

You should see:
```
✅ Compiled 23 Solidity files successfully
```

### 2. Deploy to Polygon Amoy

```bash
npm run deploy:polygon
```

This will:
1. Deploy MockUSDC contract
2. Deploy RealEstate contract
3. Add 5 sample properties
4. Output contract addresses

**Save the output!** You'll see something like:

```
✅ RealEstate contract deployed at: 0x1234...5678
✅ Mock USDC deployed at: 0xabcd...efgh

📄 Save this to your frontend .env file:
VITE_CONTRACT_ADDRESS=0x1234...5678
VITE_USDC_ADDRESS=0xabcd...efgh
VITE_CHAIN_ID=80002
```

**⭐ IMPORTANT:** Copy the contract address!

---

## 🎨 Step 5: Configure Frontend

### 1. Update Frontend Environment

```bash
cd frontend
cp .env.example .env
nano .env
```

Add your contract address:

```env
VITE_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
VITE_CHAIN_ID=80002
VITE_NETWORK_NAME=Polygon Amoy
```

### 2. Update Frontend ABI

From the root directory:

```bash
npm run update-abi
```

This syncs the compiled contract ABI to the frontend.

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 4. Start Frontend

```bash
npm run dev
```

Open http://localhost:5173

---

## 🔗 Step 6: Connect and Test

### 1. Connect MetaMask

1. Open the frontend (http://localhost:5173)
2. Make sure MetaMask is on **Polygon Amoy** network
3. Click "Connect Wallet"
4. Approve the connection

You should see:
- Your wallet address
- Your POL balance
- 5 sample properties

### 2. Test Listing a Property

1. Click "List Property"
2. Fill in details:
   ```
   Name: Test Villa
   Description: Beautiful villa for testing
   Location: Via Roma 1, Milan, Italy
   Value (USD): 100000
   Area (sqm): 150
   Image URL: https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800
   Estimated Yield: 500 (5%)
   ```
3. Click "Publish"
4. MetaMask will pop up:
   - **Network**: Polygon Amoy
   - **Gas Fee**: ~0.001 POL
   - **To**: Your contract address
5. Click "Confirm"
6. Wait for confirmation (10-30 seconds)
7. Property should appear in the list!

### 3. Test Buying Tokens

1. Click on a property
2. Enter number of tokens (e.g., 10 tokens = $500 USD)
3. You'll see the ETH/POL equivalent (live prices from CoinGecko)
4. Click "Buy Tokens"
5. Confirm in MetaMask
6. Wait for confirmation
7. Your investment should appear in "My Investments"

### 4. Test Map Features

1. Click on a property with a real address
2. Go to "Location & Amenities" tab
3. You should see:
   - Interactive map with property location
   - Nearby points of interest (metro, shops, etc.)
   - Distance calculations
   - Category filters

---

## 🔍 Step 7: Verify on Polygon Scan

### View Your Contract

1. Go to https://amoy.polygonscan.com/
2. Search for your contract address
3. You can see:
   - All transactions
   - Contract code
   - Events emitted
   - Token transfers

### Verify Contract Source Code

```bash
npx hardhat verify --network polygonAmoy 0xYourContractAddress 0xUSDCAddress
```

This makes your contract readable on PolygonScan.

---

## 🐛 Troubleshooting

### "Insufficient funds" Error

**Problem**: Not enough POL for gas fees

**Solution**:
1. Get more POL from faucet
2. Each transaction costs ~0.001-0.01 POL
3. 0.5 POL = ~50-500 transactions

### "Network mismatch" Error

**Problem**: MetaMask is on wrong network

**Solution**:
1. Open MetaMask
2. Select "Polygon Amoy Testnet"
3. Refresh the page

### "Transaction underpriced" Error

**Problem**: Gas price too low

**Solution**:
1. Open MetaMask
2. Click "Edit" on gas settings
3. Increase priority fee slightly
4. Try again

### "could not decode result data" Error

**Problem**: ABI mismatch between frontend and contract

**Solution**:
```bash
# From project root
npm run clean
npm run compile
npm run update-abi

# Redeploy if needed
npm run deploy:polygon

# Update frontend .env with new contract address
cd frontend
npm run dev
```

### "Nonce too high" Error

**Problem**: MetaMask transaction queue is confused

**Solution**:
1. MetaMask → Settings → Advanced
2. "Clear activity tab data"
3. "Reset account"
4. Try again

---

## 📊 Cost Estimates

**Polygon Amoy Testnet** (all free test tokens):

| Action | Gas Cost | POL Cost |
|--------|----------|----------|
| Deploy Contract | ~3M gas | ~0.003 POL |
| List Property | ~200K gas | ~0.0002 POL |
| Buy Tokens | ~150K gas | ~0.00015 POL |
| Claim Dividends | ~100K gas | ~0.0001 POL |

**0.5 POL from faucet = ~100+ test transactions**

---

## 🚀 Production Deployment (Polygon Mainnet)

When ready for production:

### 1. Get Real MATIC/POL

Buy POL on an exchange (Coinbase, Binance, etc.) and transfer to your wallet.

### 2. Update Configuration

```env
POLYGON_MAINNET_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_production_wallet_private_key
```

### 3. Deploy to Mainnet

```bash
npm run deploy:mainnet
```

⚠️ **This uses REAL money!**
- Contract deployment: ~$1-3 USD
- Each transaction: ~$0.01-0.10 USD

### 4. Use Real USDC

Update `scripts/deploy.ts` to use real USDC address:
```typescript
// Polygon mainnet USDC
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
```

---

## 📚 Additional Resources

- **Polygon Docs**: https://docs.polygon.technology/
- **Hardhat Docs**: https://hardhat.org/
- **Ethers.js Docs**: https://docs.ethers.org/
- **MetaMask Docs**: https://docs.metamask.io/

- **Polygon Faucet**: https://faucet.polygon.technology/
- **Polygon Amoy Explorer**: https://amoy.polygonscan.com/
- **Gas Tracker**: https://polygonscan.com/gastracker

---

## ✅ Quick Checklist

Before deploying:

- [ ] MetaMask installed and configured
- [ ] Polygon Amoy network added to MetaMask
- [ ] Test POL tokens received (0.5 POL minimum)
- [ ] Alchemy account created (free tier)
- [ ] `.env` file configured with API key and private key
- [ ] Contracts compile without errors (`npm run compile`)
- [ ] `.env` NOT committed to git

After deployment:

- [ ] Contract address saved
- [ ] Frontend `.env` updated with contract address
- [ ] Frontend ABI updated (`npm run update-abi`)
- [ ] Frontend runs without errors
- [ ] Can connect wallet
- [ ] Can see sample properties
- [ ] Can list new property
- [ ] Can buy tokens
- [ ] Transactions visible on PolygonScan

---

## 🎉 Success!

You now have a fully working real estate tokenization platform on Polygon Amoy testnet!

**Next steps:**
1. Share the URL with friends for testing
2. Gather feedback
3. Add more features
4. Deploy to mainnet when ready

**Questions or issues?**
- Check PolygonScan for transaction details
- Review console logs in browser (F12)
- Check hardhat terminal for deployment logs

---

**Arras Labs** - Democratizing property investment through blockchain technology 🏠
