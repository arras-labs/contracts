# 🏠 Arras Labs - Fractional Property Tokenization Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636?logo=solidity)](https://docs.soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-FFDB1C.svg)](https://hardhat.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.0.1-4E5EE4?logo=openzeppelin)](https://openzeppelin.com/contracts/)

> **Democratizing real estate investment by breaking down barriers to entry and creating an inclusive, liquid ecosystem where anyone can invest in property.**

---

## 🌟 Our Mission

In a world where property investment is often a privilege of the wealthy, we are on a mission to tear down the barriers. Our goal is to revolutionize the real estate market, transforming it from an exclusive club into an open, inclusive, and liquid ecosystem for everyone.

We are building a platform to tokenize property, allowing anyone to invest in bricks and mortar with the same ease as buying a share. Imagine owning a fraction of a home, earning returns from rent, and having a say in a market that has been out of reach for too long.

**This is more than just a project; it's a movement towards radical change. We believe in a future where financial empowerment is not determined by your background, but by your ambition.**

---

## ✨ Features

### 🔐 Security First
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Pausable**: Emergency stop mechanism for critical situations
- **AccessControl**: Role-based permissions (Admin, Property Manager, Compliance Officer)
- **Pull Payment Pattern**: Secure fund management avoiding push vulnerabilities
- **Comprehensive Auditing**: Full event logging for transparency

### 💼 Fractional Ownership
- **$50 USD per Token**: Accessible entry point for all investors
- **Pool-Based System**: Collective investment in high-value properties
- **NFT Property Ownership**: Legal ownership represented as ERC721 tokens
- **Transparent Tracking**: Real-time visibility of investments and ownership

### 💰 Automated Dividends
- **Rent Distribution**: Automated dividend payments to token holders
- **Claim Mechanism**: Investors claim proportional rental income
- **Batch Claiming**: Claim all unclaimed dividends in one transaction
- **Transparent History**: Complete record of all distributions

### 🪙 Stablecoin Support
- **USDC Integration**: Stable pricing free from crypto volatility
- **Dual Payment System**: Accept ETH or USDC for purchases
- **Multi-Network**: Support for Ethereum, Polygon, and testnets

### 📋 Compliance & KYC
- **KYC Verification**: Regulatory compliance built-in
- **Blacklist System**: Enhanced security and compliance
- **Document Verification**: Compliance officer approval workflow
- **Audit Trail**: Complete transaction history for regulators

### 🎯 Platform Features
- **Platform Fees**: Sustainable 2.5% fee (configurable)
- **Property Management**: Tools for property owners
- **Document Storage**: IPFS integration for legal documents
- **Yield Tracking**: Monitor estimated and actual returns

---

## 🏗️ Architecture

### Smart Contract Structure

```
RealEstate.sol (Main Contract)
├── ERC721 (Property Ownership NFTs)
├── AccessControl (Role-based permissions)
├── ReentrancyGuard (Attack prevention)
└── Pausable (Emergency controls)

MockUSDC.sol (Testing)
└── ERC20 (Test stablecoin)
```

### Key Components

1. **Property Tokenization**: Each property is an ERC721 NFT with associated fractional tokens
2. **Investment Pools**: Investors buy $50 tokens representing fractional ownership
3. **Dividend System**: Property owners distribute rent proportionally to token holders
4. **Compliance Layer**: KYC/AML integration for regulatory compliance

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- MetaMask or compatible Web3 wallet
- (Optional) Docker for local blockchain

### Installation

```bash
# Clone the repository
git clone https://github.com/arras-labs/contracts.git
cd contracts/real_estate

# Install dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# Required: PRIVATE_KEY, RPC URLs
```

### Development

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests with gas reporting
npm run test:gas

# Start local blockchain
npm run node

# Deploy to local network
npm run deploy:ganache

# Deploy to Polygon testnet
npm run deploy:polygon
```

### Code Quality

```bash
# Lint Solidity and TypeScript
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

---

## 📝 Usage Examples

### For Property Owners

```solidity
// List a new property
uint256 propertyId = realEstate.listProperty(
    "Luxury Apartment",
    "Modern 2BR in downtown",
    "New York, NY",
    250000, // $250,000 USD
    120, // 120 sqm
    "ipfs://...",
    550 // 5.5% estimated yield
);

// Distribute rental income
realEstate.distributeDividends{value: 1 ether}(
    propertyId,
    "Q1 2024 Rent Distribution"
);

// Upload legal documents
realEstate.uploadDocument(
    propertyId,
    "Purchase Agreement",
    "Legal Contract",
    "QmXYZ..."
);
```

### For Investors

```solidity
// Buy fractional tokens (ETH)
realEstate.buyTokens{value: 0.1 ether}(
    propertyId,
    10, // Buy 10 tokens
    ethers.parseEther("0.01") // Price per token in ETH
);

// Buy fractional tokens (USDC)
usdc.approve(address(realEstate), 500 * 1e6); // Approve $500
realEstate.buyTokensWithStablecoin(propertyId, 10);

// Claim dividends
realEstate.claimAllDividends(propertyId);

// Check unclaimed dividends
uint256 unclaimed = realEstate.getUnclaimedDividends(propertyId, investor);
```

### For Admins

```solidity
// Verify KYC
realEstate.setKYCVerification(userAddress, true);

// Verify documents
realEstate.verifyDocument(documentId);

// Update platform fee
realEstate.setPlatformFee(200); // 2.0%

// Emergency pause
realEstate.pause();
```

---

## 🔧 Technology Stack

### Smart Contracts
- **Solidity 0.8.20**: Latest secure version
- **OpenZeppelin 5.0.1**: Battle-tested contract libraries
- **Hardhat**: Development environment

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Modern styling
- **Ethers.js v6**: Blockchain interaction
- **Vite**: Fast build tool

### Blockchain
- **Polygon**: Primary deployment target
- **Ethereum**: Mainnet support
- **Ganache**: Local development

---

## 🧪 Testing

Comprehensive test suite covering:

- ✅ Property listing and tokenization
- ✅ Fractional token purchases (ETH & USDC)
- ✅ Dividend distribution and claiming
- ✅ Access control and permissions
- ✅ KYC and compliance features
- ✅ Emergency pause mechanisms
- ✅ Document management
- ✅ Pool completion scenarios

```bash
# Run full test suite
npm test

# Run with coverage report
npm run test:coverage

# Run with gas profiling
npm run test:gas
```

---

## 📊 Contract Addresses

### Mainnets

| Network  | Contract Address | USDC Address |
|----------|------------------|--------------|
| Polygon  | TBD              | `0x2791Bca...` |
| Ethereum | TBD              | `0xA0b8699...` |

### Testnets

| Network       | Contract Address | USDC Address |
|---------------|------------------|--------------|
| Polygon Amoy  | TBD              | `0x41E94Eb...` |
| Mumbai        | TBD              | `0xe6b8a5C...` |

---

## 🔒 Security

### Audit Status
- [ ] Internal audit completed
- [ ] External audit pending
- [ ] Bug bounty program (Coming soon)

### Security Features
- Reentrancy protection on all payable functions
- Pull payment pattern for fund transfers
- Role-based access control
- Emergency pause capability
- Comprehensive input validation
- Event logging for transparency

### Reporting Vulnerabilities

If you discover a security vulnerability, please email us at:
**security@arras-labs.com**

Please do NOT create public GitHub issues for security vulnerabilities.

---

## 🗺️ Roadmap

### Phase 1: Foundation ✅ (Current)
- [x] Core tokenization contract
- [x] Fractional ownership system
- [x] Dividend distribution
- [x] KYC/compliance integration
- [x] Stablecoin support
- [x] Security audit preparation

### Phase 2: Governance 🚧 (Q2 2024)
- [ ] Token holder voting system
- [ ] Property management proposals
- [ ] Decentralized decision-making
- [ ] Governance token launch

### Phase 3: Liquidity 📋 (Q3 2024)
- [ ] Secondary market integration
- [ ] DEX liquidity pools
- [ ] Fractional token trading
- [ ] Price discovery mechanisms

### Phase 4: Expansion 🎯 (Q4 2024)
- [ ] Multi-chain deployment
- [ ] Oracle integration for valuations
- [ ] Insurance mechanisms
- [ ] Mobile app launch

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test additions or changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌐 Links

- **Website**: [https://arras-labs.com](https://arras-labs.com)
- **Documentation**: [https://docs.arras-labs.com](https://docs.arras-labs.com)
- **Twitter**: [@ArrasLabs](https://twitter.com/ArrasLabs)
- **Discord**: [Join our community](https://discord.gg/arras-labs)
- **Email**: hello@arras-labs.com

---

## 👥 Team

**Arras Labs** is built by a passionate team dedicated to democratizing real estate investment.

---

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Hardhat team for excellent development tools
- Polygon for scalable blockchain infrastructure
- Our community for continuous support and feedback

---

## 💡 Support

Need help? Have questions?

- 📖 Read the [Documentation](https://docs.arras-labs.com)
- 💬 Join our [Discord](https://discord.gg/arras-labs)
- 🐛 Report bugs via [GitHub Issues](https://github.com/arras-labs/contracts/issues)
- 📧 Email us at support@arras-labs.com

---

<div align="center">

**Built with ❤️ by Arras Labs**

*Making property investment accessible to everyone*

</div>
