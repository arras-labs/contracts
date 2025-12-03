import { expect } from "chai";
import { ethers } from "hardhat";
import { RealEstate } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RealEstate", function () {
  let realEstate: RealEstate;
  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, buyer, addr2] = await ethers.getSigners();

    const RealEstateFactory = await ethers.getContractFactory("RealEstate");
    realEstate = (await RealEstateFactory.deploy()) as unknown as RealEstate;
    await realEstate.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await realEstate.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await realEstate.name()).to.equal("RealEstateNFT");
      expect(await realEstate.symbol()).to.equal("RENFT");
    });
  });

  describe("Listing Properties", function () {
    it("Should list a new property", async function () {
      const tx = await realEstate.listProperty(
        "Villa Test",
        "Descrizione test",
        "Milano",
        ethers.parseEther("1.0"),
        100,
        "https://example.com/image.jpg"
      );

      await expect(tx)
        .to.emit(realEstate, "PropertyListed")
        .withArgs(1, "Villa Test", ethers.parseEther("1.0"), owner.address);

      const property = await realEstate.getProperty(1);
      expect(property.name).to.equal("Villa Test");
      expect(property.price).to.equal(ethers.parseEther("1.0"));
      expect(property.owner).to.equal(owner.address);
      expect(property.isForSale).to.be.true;
    });

    it("Should fail to list property with zero price", async function () {
      await expect(
        realEstate.listProperty(
          "Villa Test",
          "Descrizione",
          "Milano",
          0,
          100,
          "https://example.com/image.jpg"
        )
      ).to.be.revertedWith("Il prezzo deve essere maggiore di zero");
    });

    it("Should fail to list property with zero area", async function () {
      await expect(
        realEstate.listProperty(
          "Villa Test",
          "Descrizione",
          "Milano",
          ethers.parseEther("1.0"),
          0,
          "https://example.com/image.jpg"
        )
      ).to.be.revertedWith("L'area deve essere maggiore di zero");
    });

    it("Should increment property IDs correctly", async function () {
      await realEstate.listProperty(
        "Property 1",
        "Desc 1",
        "Location 1",
        ethers.parseEther("1.0"),
        100,
        "url1"
      );

      await realEstate.listProperty(
        "Property 2",
        "Desc 2",
        "Location 2",
        ethers.parseEther("2.0"),
        200,
        "url2"
      );

      expect(await realEstate.getTotalProperties()).to.equal(2);
    });
  });

  describe("Buying Properties", function () {
    beforeEach(async function () {
      await realEstate.listProperty(
        "Villa for Sale",
        "Beautiful villa",
        "Roma",
        ethers.parseEther("2.0"),
        150,
        "https://example.com/villa.jpg"
      );
    });

    it("Should allow buying a property", async function () {
      const propertyId = 1;
      const price = ethers.parseEther("2.0");

      const tx = await realEstate
        .connect(buyer)
        .buyProperty(propertyId, { value: price });

      await expect(tx)
        .to.emit(realEstate, "PropertySold")
        .withArgs(propertyId, owner.address, buyer.address, price);

      const property = await realEstate.getProperty(propertyId);
      expect(property.owner).to.equal(buyer.address);
      expect(property.isForSale).to.be.false;
      expect(await realEstate.ownerOf(propertyId)).to.equal(buyer.address);
    });

    it("Should fail to buy with insufficient funds", async function () {
      await expect(
        realEstate
          .connect(buyer)
          .buyProperty(1, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Fondi insufficienti");
    });

    it("Should fail to buy own property", async function () {
      await expect(
        realEstate
          .connect(owner)
          .buyProperty(1, { value: ethers.parseEther("2.0") })
      ).to.be.revertedWith("Non puoi acquistare la tua proprieta");
    });

    it("Should fail to buy property not for sale", async function () {
      await realEstate
        .connect(buyer)
        .buyProperty(1, { value: ethers.parseEther("2.0") });

      await expect(
        realEstate
          .connect(addr2)
          .buyProperty(1, { value: ethers.parseEther("2.0") })
      ).to.be.revertedWith("Proprieta non in vendita");
    });

    it("Should transfer funds to seller", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);
      const price = ethers.parseEther("2.0");

      await realEstate.connect(buyer).buyProperty(1, { value: price });

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.equal(initialBalance + price);
    });
  });

  describe("Managing Properties", function () {
    beforeEach(async function () {
      await realEstate.listProperty(
        "My Property",
        "Description",
        "Location",
        ethers.parseEther("1.0"),
        100,
        "url"
      );

      await realEstate
        .connect(buyer)
        .buyProperty(1, { value: ethers.parseEther("1.0") });
    });

    it("Should allow owner to set property for sale", async function () {
      const newPrice = ethers.parseEther("1.5");

      await expect(realEstate.connect(buyer).setForSale(1, newPrice))
        .to.emit(realEstate, "PropertyPriceChanged")
        .withArgs(1, ethers.parseEther("1.0"), newPrice);

      const property = await realEstate.getProperty(1);
      expect(property.isForSale).to.be.true;
      expect(property.price).to.equal(newPrice);
    });

    it("Should fail to set for sale if not owner", async function () {
      await expect(
        realEstate.connect(addr2).setForSale(1, ethers.parseEther("2.0"))
      ).to.be.revertedWith("Non sei il proprietario");
    });

    it("Should allow owner to remove from sale", async function () {
      await realEstate.connect(buyer).setForSale(1, ethers.parseEther("1.5"));

      await expect(realEstate.connect(buyer).removeFromSale(1))
        .to.emit(realEstate, "PropertyDelisted")
        .withArgs(1);

      const property = await realEstate.getProperty(1);
      expect(property.isForSale).to.be.false;
    });

    it("Should fail to remove from sale if not owner", async function () {
      await realEstate.connect(buyer).setForSale(1, ethers.parseEther("1.5"));

      await expect(
        realEstate.connect(addr2).removeFromSale(1)
      ).to.be.revertedWith("Non sei il proprietario");
    });
  });

  describe("Querying Properties", function () {
    beforeEach(async function () {
      // Lista 3 proprietà
      await realEstate.listProperty(
        "Property 1",
        "Desc 1",
        "Location 1",
        ethers.parseEther("1.0"),
        100,
        "url1"
      );

      await realEstate.listProperty(
        "Property 2",
        "Desc 2",
        "Location 2",
        ethers.parseEther("2.0"),
        200,
        "url2"
      );

      await realEstate
        .connect(buyer)
        .listProperty(
          "Property 3",
          "Desc 3",
          "Location 3",
          ethers.parseEther("3.0"),
          300,
          "url3"
        );
    });

    it("Should get all properties for sale", async function () {
      const properties = await realEstate.getPropertiesForSale();
      expect(properties.length).to.equal(3);
    });

    it("Should get my properties correctly", async function () {
      const ownerProperties = await realEstate.getMyProperties(owner.address);
      expect(ownerProperties.length).to.equal(2);

      const buyerProperties = await realEstate.getMyProperties(buyer.address);
      expect(buyerProperties.length).to.equal(1);
      expect(buyerProperties[0].name).to.equal("Property 3");
    });

    it("Should return correct total properties", async function () {
      expect(await realEstate.getTotalProperties()).to.equal(3);
    });

    it("Should not include sold properties in for sale list", async function () {
      await realEstate
        .connect(buyer)
        .buyProperty(1, { value: ethers.parseEther("1.0") });

      const properties = await realEstate.getPropertiesForSale();
      expect(properties.length).to.equal(2);
    });
  });
});
