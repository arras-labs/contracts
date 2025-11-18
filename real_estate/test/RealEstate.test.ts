import { expect } from "chai";
import { ethers } from "hardhat";
import { RealEstate, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RealEstate - Fractional Property Tokenization", function () {
  let realEstate: RealEstate;
  let mockUSDC: MockUSDC;
  let owner: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
  let propertyManager: SignerWithAddress;

  const TOKEN_PRICE_USD = 50n;
  const PROPERTY_VALUE = 10000; // $10,000 = 200 tokens
  const ESTIMATED_YIELD = 500; // 5%

  beforeEach(async function () {
    [owner, investor1, investor2, propertyManager] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = (await MockUSDCFactory.deploy()) as unknown as MockUSDC;
    await mockUSDC.waitForDeployment();

    // Deploy RealEstate with USDC address
    const RealEstateFactory = await ethers.getContractFactory("RealEstate");
    realEstate = (await RealEstateFactory.deploy(await mockUSDC.getAddress())) as unknown as RealEstate;
    await realEstate.waitForDeployment();

    // Set KYC verification for test accounts
    await realEstate.setKYCVerification(owner.address, true);
    await realEstate.setKYCVerification(investor1.address, true);
    await realEstate.setKYCVerification(investor2.address, true);
    await realEstate.setKYCVerification(propertyManager.address, true);
  });

  describe("Deployment", function () {
    it("Should set the right admin role", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await realEstate.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should have correct name and symbol", async function () {
      expect(await realEstate.name()).to.equal("RealEstateNFT");
      expect(await realEstate.symbol()).to.equal("RENFT");
    });

    it("Should have correct token price", async function () {
      expect(await realEstate.TOKEN_PRICE_USD()).to.equal(TOKEN_PRICE_USD);
    });

    it("Should have USDC token configured", async function () {
      expect(await realEstate.usdcToken()).to.equal(await mockUSDC.getAddress());
    });
  });

  describe("Listing Properties with Token Pool", function () {
    it("Should list a new property with token pool", async function () {
      const tx = await realEstate.listProperty(
        "Luxury Apartment",
        "Modern apartment in city center",
        "New York",
        PROPERTY_VALUE,
        100, // 100 sqm
        "https://example.com/image.jpg",
        ESTIMATED_YIELD
      );

      await expect(tx)
        .to.emit(realEstate, "PropertyListed")
        .withArgs(1, "Luxury Apartment", PROPERTY_VALUE, 200, owner.address);

      const property = await realEstate.getProperty(1);
      expect(property.name).to.equal("Luxury Apartment");
      expect(property.totalValueUSD).to.equal(PROPERTY_VALUE);
      expect(property.totalTokens).to.equal(200); // 10000/50
      expect(property.tokensSold).to.equal(0);
      expect(property.isActive).to.be.true;
    });

    it("Should fail to list property with zero value", async function () {
      await expect(
        realEstate.listProperty(
          "Test Property",
          "Description",
          "Location",
          0,
          100,
          "url",
          ESTIMATED_YIELD
        )
      ).to.be.revertedWith("Value must be greater than zero");
    });

    it("Should fail to list property with zero area", async function () {
      await expect(
        realEstate.listProperty(
          "Test Property",
          "Description",
          "Location",
          PROPERTY_VALUE,
          0,
          "url",
          ESTIMATED_YIELD
        )
      ).to.be.revertedWith("Area must be greater than zero");
    });

    it("Should mint NFT to property owner", async function () {
      await realEstate.listProperty(
        "Property 1",
        "Desc",
        "Location",
        PROPERTY_VALUE,
        100,
        "url",
        ESTIMATED_YIELD
      );

      expect(await realEstate.ownerOf(1)).to.equal(owner.address);
    });
  });

  describe("Buying Tokens - Fractional Ownership", function () {
    beforeEach(async function () {
      await realEstate.listProperty(
        "Investment Property",
        "High yield property",
        "London",
        PROPERTY_VALUE,
        150,
        "https://example.com/property.jpg",
        ESTIMATED_YIELD
      );
    });

    it("Should allow investor to buy tokens", async function () {
      const tokenAmount = 10;
      const tokenPriceETH = ethers.parseEther("0.001"); // Mock price
      const totalCost = tokenPriceETH * BigInt(tokenAmount);

      const tx = await realEstate
        .connect(investor1)
        .buyTokens(1, tokenAmount, tokenPriceETH, { value: totalCost });

      await expect(tx)
        .to.emit(realEstate, "TokensPurchased")
        .withArgs(1, investor1.address, tokenAmount, totalCost, false);

      const balance = await realEstate.getInvestorTokens(1, investor1.address);
      expect(balance).to.equal(tokenAmount);
    });

    it("Should track multiple investors", async function () {
      const tokenPriceETH = ethers.parseEther("0.001");

      await realEstate
        .connect(investor1)
        .buyTokens(1, 50, tokenPriceETH, {
          value: tokenPriceETH * 50n,
        });

      await realEstate
        .connect(investor2)
        .buyTokens(1, 30, tokenPriceETH, {
          value: tokenPriceETH * 30n,
        });

      const poolInfo = await realEstate.getPoolInfo(1);
      expect(poolInfo.tokensSold).to.equal(80);
      expect(poolInfo.investors.length).to.equal(2);
    });

    it("Should fail to buy more tokens than available", async function () {
      const tokenPriceETH = ethers.parseEther("0.001");

      await expect(
        realEstate
          .connect(investor1)
          .buyTokens(1, 250, tokenPriceETH, {
            value: tokenPriceETH * 250n,
          })
      ).to.be.revertedWith("Insufficient tokens in pool");
    });

    it("Should fail to buy with insufficient funds", async function () {
      const tokenPriceETH = ethers.parseEther("0.001");

      await expect(
        realEstate
          .connect(investor1)
          .buyTokens(1, 10, tokenPriceETH, {
            value: tokenPriceETH * 5n, // Only paying for 5
          })
      ).to.be.revertedWith("Insufficient funds");
    });

    it("Should complete pool when all tokens sold", async function () {
      const tokenPriceETH = ethers.parseEther("0.001");

      const tx = await realEstate
        .connect(investor1)
        .buyTokens(1, 200, tokenPriceETH, {
          value: tokenPriceETH * 200n,
        });

      await expect(tx)
        .to.emit(realEstate, "PoolCompleted")
        .withArgs(1, PROPERTY_VALUE);

      const property = await realEstate.getProperty(1);
      expect(property.isActive).to.be.false;
    });

    it("Should queue funds for property owner withdrawal", async function () {
      const tokenPriceETH = ethers.parseEther("0.001");
      const tokenAmount = 10;
      const totalCost = tokenPriceETH * BigInt(tokenAmount);

      await realEstate
        .connect(investor1)
        .buyTokens(1, tokenAmount, tokenPriceETH, { value: totalCost });

      // Check pending withdrawals (minus 2.5% platform fee)
      const platformFee = (totalCost * 250n) / 10000n;
      const expectedPending = totalCost - platformFee;

      const pendingWithdrawal = await realEstate.pendingWithdrawals(owner.address);
      expect(pendingWithdrawal).to.equal(expectedPending);
    });

    it("Should allow owner to withdraw funds", async function () {
      const tokenPriceETH = ethers.parseEther("0.001");
      const tokenAmount = 10;
      const totalCost = tokenPriceETH * BigInt(tokenAmount);

      await realEstate
        .connect(investor1)
        .buyTokens(1, tokenAmount, tokenPriceETH, { value: totalCost });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      const tx = await realEstate.withdraw();
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      const finalBalance = await ethers.provider.getBalance(owner.address);
      const platformFee = (totalCost * 250n) / 10000n;
      const expectedWithdrawal = totalCost - platformFee;

      expect(finalBalance).to.equal(initialBalance + expectedWithdrawal - gasCost);
    });
  });

  describe("Pool Management", function () {
    beforeEach(async function () {
      await realEstate.listProperty(
        "Managed Property",
        "Description",
        "Location",
        PROPERTY_VALUE,
        100,
        "url",
        ESTIMATED_YIELD
      );
    });

    it("Should allow owner to deactivate pool", async function () {
      await expect(realEstate.deactivatePool(1))
        .to.emit(realEstate, "PropertyDelisted")
        .withArgs(1);

      const property = await realEstate.getProperty(1);
      expect(property.isActive).to.be.false;
    });

    it("Should fail to deactivate if not owner", async function () {
      await expect(
        realEstate.connect(investor1).deactivatePool(1)
      ).to.be.revertedWith("Not property owner");
    });

    it("Should allow owner to reactivate pool", async function () {
      await realEstate.deactivatePool(1);
      await realEstate.reactivatePool(1);

      const property = await realEstate.getProperty(1);
      expect(property.isActive).to.be.true;
    });

    it("Should fail to reactivate if all tokens sold", async function () {
      const tokenPriceETH = ethers.parseEther("0.001");

      await realEstate
        .connect(investor1)
        .buyTokens(1, 200, tokenPriceETH, {
          value: tokenPriceETH * 200n,
        });

      await expect(realEstate.reactivatePool(1)).to.be.revertedWith(
        "All tokens are already sold"
      );
    });
  });

  describe("Querying Pool Information", function () {
    beforeEach(async function () {
      await realEstate.listProperty(
        "Property 1",
        "Desc 1",
        "Location 1",
        PROPERTY_VALUE,
        100,
        "url1",
        ESTIMATED_YIELD
      );

      await realEstate.listProperty(
        "Property 2",
        "Desc 2",
        "Location 2",
        PROPERTY_VALUE * 2,
        200,
        "url2",
        ESTIMATED_YIELD
      );
    });

    it("Should get pool info correctly", async function () {
      const tokenPriceETH = ethers.parseEther("0.001");

      await realEstate
        .connect(investor1)
        .buyTokens(1, 50, tokenPriceETH, {
          value: tokenPriceETH * 50n,
        });

      const poolInfo = await realEstate.getPoolInfo(1);

      expect(poolInfo.totalTokens).to.equal(200);
      expect(poolInfo.tokensSold).to.equal(50);
      expect(poolInfo.tokensAvailable).to.equal(150);
      expect(poolInfo.percentageComplete).to.equal(25);
      expect(poolInfo.isActive).to.be.true;
    });

    it("Should get all active properties", async function () {
      const properties = await realEstate.getActiveProperties();
      expect(properties.length).to.equal(2);
    });

    it("Should get my properties correctly", async function () {
      await realEstate
        .connect(investor1)
        .listProperty(
          "Investor Property",
          "Desc",
          "Location",
          PROPERTY_VALUE,
          100,
          "url",
          ESTIMATED_YIELD
        );

      const ownerProperties = await realEstate.getMyProperties(owner.address);
      expect(ownerProperties.length).to.equal(2);

      const investorProperties = await realEstate.getMyProperties(
        investor1.address
      );
      expect(investorProperties.length).to.equal(1);
    });

    it("Should get my investments correctly", async function () {
      const tokenPriceETH = ethers.parseEther("0.001");

      await realEstate
        .connect(investor1)
        .buyTokens(1, 50, tokenPriceETH, {
          value: tokenPriceETH * 50n,
        });

      await realEstate
        .connect(investor1)
        .buyTokens(2, 100, tokenPriceETH, {
          value: tokenPriceETH * 100n,
        });

      const [investments, tokenAmounts] = await realEstate.getMyInvestments(
        investor1.address
      );

      expect(investments.length).to.equal(2);
      expect(tokenAmounts[0]).to.equal(50);
      expect(tokenAmounts[1]).to.equal(100);
    });
  });

  describe("Document Management", function () {
    beforeEach(async function () {
      await realEstate.listProperty(
        "Documented Property",
        "Description",
        "Location",
        PROPERTY_VALUE,
        100,
        "url",
        ESTIMATED_YIELD
      );
    });

    it("Should allow owner to upload document", async function () {
      const tx = await realEstate.uploadDocument(
        1,
        "Contract",
        "Legal Document",
        "QmXYZ123456789"
      );

      await expect(tx)
        .to.emit(realEstate, "DocumentUploaded")
        .withArgs(1, 1, "Contract", "Legal Document", owner.address);
    });

    it("Should fail to upload if not owner", async function () {
      await expect(
        realEstate
          .connect(investor1)
          .uploadDocument(1, "Contract", "Legal", "QmXYZ")
      ).to.be.revertedWith("Not property owner");
    });

    it("Should get property documents", async function () {
      await realEstate.uploadDocument(1, "Doc1", "Type1", "Hash1");
      await realEstate.uploadDocument(1, "Doc2", "Type2", "Hash2");

      const docs = await realEstate.getPropertyDocuments(1);
      expect(docs.length).to.equal(2);
      expect(docs[0].name).to.equal("Doc1");
      expect(docs[1].name).to.equal("Doc2");
    });
  });

  describe("Yield Management", function () {
    beforeEach(async function () {
      await realEstate.listProperty(
        "Yield Property",
        "Description",
        "Location",
        PROPERTY_VALUE,
        100,
        "url",
        ESTIMATED_YIELD
      );
    });

    it("Should allow owner to update yield", async function () {
      const newYield = 600; // 6%

      await expect(realEstate.updateEstimatedYield(1, newYield))
        .to.emit(realEstate, "YieldUpdated")
        .withArgs(1, newYield);

      const property = await realEstate.getProperty(1);
      expect(property.estimatedAnnualYield).to.equal(newYield);
    });

    it("Should fail to update yield if not owner", async function () {
      await expect(
        realEstate.connect(investor1).updateEstimatedYield(1, 600)
      ).to.be.revertedWith("Not property owner");
    });
  });
});
