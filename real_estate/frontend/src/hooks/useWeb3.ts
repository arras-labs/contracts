import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID } from "../utils/constants";
import { priceOracle } from "../services/priceOracle";
import type {
  Property,
  WalletState,
  PoolInfo,
  Investment,
  PropertyDocument,
} from "../types";
import toast from "react-hot-toast";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const TOKEN_PRICE_USD = 50;

export const useWeb3 = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    account: null,
    balance: null,
    chainId: null,
    isConnected: false,
  });
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractReady, setContractReady] = useState(false);
  const [ethPrice, setEthPrice] = useState<number>(2000); // Fallback price
  const [priceLoading, setPriceLoading] = useState(false);

  // Fetch ETH price periodically
  useEffect(() => {
    const updatePrice = async () => {
      try {
        setPriceLoading(true);
        const priceData = await priceOracle.getETHPrice();
        setEthPrice(priceData.usd);
      } catch (error) {
        console.error("Error fetching ETH price:", error);
      } finally {
        setPriceLoading(false);
      }
    };

    // Initial fetch
    updatePrice();

    // Update every minute
    const interval = setInterval(updatePrice, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize contract
  const initContract = useCallback(async () => {
    if (!window.ethereum || !walletState.account) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      setContract(contractInstance);
      setContractReady(true);
    } catch (error) {
      console.error("❌ Error initializing contract:", error);
      toast.error("Error initializing contract");
      setContractReady(false);
    }
  }, [walletState.account]);

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error(
        "MetaMask is not installed! Please install MetaMask to continue."
      );
      return;
    }

    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(accounts[0]);

      if (Number(network.chainId) !== CHAIN_ID) {
        toast.error(`Please switch to Chain ID: ${CHAIN_ID}`);
      }

      setWalletState({
        account: accounts[0],
        balance: formatEther(balance),
        chainId: Number(network.chainId),
        isConnected: true,
      });

      toast.success("Wallet connected successfully!");
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast.error("Error connecting wallet");
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletState({
      account: null,
      balance: null,
      chainId: null,
      isConnected: false,
    });
    setContract(null);
    toast.success("Wallet disconnected");
  };

  // Get all active properties
  const getActiveProperties = async (): Promise<Property[]> => {
    if (!contract) {
      toast.error("Contract not initialized");
      return [];
    }

    try {
      const properties = await contract.getActiveProperties();
      return properties.map((prop: any) => ({
        id: prop.id,
        name: prop.name,
        description: prop.description,
        location: prop.location,
        totalValueUSD: prop.totalValueUSD,
        area: prop.area,
        owner: prop.owner,
        imageUrl: prop.imageUrl,
        listedTimestamp: prop.listedTimestamp,
        totalTokens: prop.totalTokens,
        tokensSold: prop.tokensSold,
        isActive: prop.isActive,
        estimatedAnnualYield: prop.estimatedAnnualYield || 0,
      }));
    } catch (error) {
      console.error("❌ Error fetching properties:", error);
      toast.error("Error loading properties");
      return [];
    }
  };

  // Get user's properties (where they own the NFT)
  const getMyProperties = async (): Promise<Property[]> => {
    if (!contract || !walletState.account) {
      toast.error("Contract not initialized or wallet not connected");
      return [];
    }

    try {
      const properties = await contract.getMyProperties(walletState.account);
      return properties.map((prop: any) => ({
        id: prop.id,
        name: prop.name,
        description: prop.description,
        location: prop.location,
        totalValueUSD: prop.totalValueUSD,
        area: prop.area,
        owner: prop.owner,
        imageUrl: prop.imageUrl,
        listedTimestamp: prop.listedTimestamp,
        totalTokens: prop.totalTokens,
        tokensSold: prop.tokensSold,
        isActive: prop.isActive,
        estimatedAnnualYield: prop.estimatedAnnualYield || 0,
      }));
    } catch (error) {
      console.error("Error fetching your properties:", error);
      toast.error("Error loading your properties");
      return [];
    }
  };

  // Get user's investments (where they bought tokens)
  const getMyInvestments = async (): Promise<Investment[]> => {
    if (!contract || !walletState.account) {
      toast.error("Contract not initialized or wallet not connected");
      return [];
    }

    try {
      const [properties, tokenAmounts] = await contract.getMyInvestments(
        walletState.account
      );
      return properties.map((prop: any, index: number) => ({
        property: {
          id: prop.id,
          name: prop.name,
          description: prop.description,
          location: prop.location,
          totalValueUSD: prop.totalValueUSD,
          area: prop.area,
          owner: prop.owner,
          imageUrl: prop.imageUrl,
          listedTimestamp: prop.listedTimestamp,
          totalTokens: prop.totalTokens,
          tokensSold: prop.tokensSold,
          isActive: prop.isActive,
          estimatedAnnualYield: prop.estimatedAnnualYield || 0,
        },
        tokensOwned: tokenAmounts[index],
      }));
    } catch (error) {
      console.error("Error fetching your investments:", error);
      toast.error("Error loading your investments");
      return [];
    }
  };

  // Get pool information for a property
  const getPoolInfo = async (propertyId: bigint): Promise<PoolInfo | null> => {
    if (!contract) {
      toast.error("Contract not initialized");
      return null;
    }

    try {
      const poolInfo = await contract.getPoolInfo(propertyId);
      return {
        totalTokens: poolInfo[0],
        tokensSold: poolInfo[1],
        tokensAvailable: poolInfo[2],
        totalValueUSD: poolInfo[3],
        currentValueUSD: poolInfo[4],
        percentageComplete: poolInfo[5],
        isActive: poolInfo[6],
        investors: poolInfo[7],
      };
    } catch (error) {
      console.error("Error fetching pool info:", error);
      toast.error("Error loading pool information");
      return null;
    }
  };

  // Calculate token price in ETH based on current USD/ETH rate
  const calculateTokenPriceETH = (): string => {
    const priceInETH = TOKEN_PRICE_USD / ethPrice;
    return priceInETH.toFixed(6);
  };

  // Buy property tokens
  const buyTokens = async (
    propertyId: bigint,
    tokenAmount: number
  ): Promise<boolean> => {
    if (!contract) {
      toast.error("Contract not initialized");
      return false;
    }

    setLoading(true);
    try {
      const tokenPriceETH = parseEther(calculateTokenPriceETH());
      const totalCost = tokenPriceETH * BigInt(tokenAmount);

      const tx = await contract.buyTokens(
        propertyId,
        tokenAmount,
        tokenPriceETH,
        {
          value: totalCost,
        }
      );
      toast.loading("Purchase in progress...", { id: "buy-tokens-tx" });
      await tx.wait();
      toast.success(`${tokenAmount} tokens purchased successfully!`, {
        id: "buy-tokens-tx",
      });
      return true;
    } catch (error: any) {
      console.error("Error purchasing tokens:", error);
      toast.error(error.reason || "Error during purchase", {
        id: "buy-tokens-tx",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // List a new property
  const listProperty = async (
    name: string,
    description: string,
    location: string,
    totalValueUSD: string,
    area: string,
    imageUrl: string,
    estimatedYield: string = "500" // Default 5.00%
  ) => {
    if (!contract) {
      toast.error("Contract not initialized");
      return false;
    }

    setLoading(true);
    try {
      const tx = await contract.listProperty(
        name,
        description,
        location,
        BigInt(totalValueUSD),
        BigInt(area),
        imageUrl,
        BigInt(estimatedYield)
      );
      toast.loading("Publishing in progress...", { id: "list-tx" });
      await tx.wait();
      toast.success("Property published successfully!", { id: "list-tx" });
      return true;
    } catch (error: any) {
      console.error("Error publishing property:", error);
      toast.error(error.reason || "Error during publishing", {
        id: "list-tx",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Deactivate pool
  const deactivatePool = async (propertyId: bigint) => {
    if (!contract) {
      toast.error("Contract not initialized");
      return false;
    }

    setLoading(true);
    try {
      const tx = await contract.deactivatePool(propertyId);
      toast.loading("Deactivating pool...", { id: "deactivate-tx" });
      await tx.wait();
      toast.success("Pool deactivated!", { id: "deactivate-tx" });
      return true;
    } catch (error: any) {
      console.error("Error deactivating pool:", error);
      toast.error(error.reason || "Error during deactivation", {
        id: "deactivate-tx",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reactivate pool
  const reactivatePool = async (propertyId: bigint) => {
    if (!contract) {
      toast.error("Contract not initialized");
      return false;
    }

    setLoading(true);
    try {
      const tx = await contract.reactivatePool(propertyId);
      toast.loading("Reactivating pool...", { id: "reactivate-tx" });
      await tx.wait();
      toast.success("Pool reactivated!", { id: "reactivate-tx" });
      return true;
    } catch (error: any) {
      console.error("Error reactivating pool:", error);
      toast.error(error.reason || "Error during reactivation", {
        id: "reactivate-tx",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (walletState.account) {
      initContract();
    }
  }, [walletState.account, initContract]);

  // Listener for account change
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setWalletState((prev) => ({ ...prev, account: accounts[0] }));
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  // Get a single property by ID
  const getProperty = async (propertyId: bigint): Promise<Property | null> => {
    if (!contractReady || !contract) throw new Error("Contract not ready");

    try {
      const prop = await contract.getProperty(propertyId);
      return {
        id: prop.id,
        name: prop.name,
        description: prop.description,
        location: prop.location,
        totalValueUSD: prop.totalValueUSD,
        area: prop.area,
        owner: prop.owner,
        imageUrl: prop.imageUrl,
        listedTimestamp: prop.listedTimestamp,
        totalTokens: prop.totalTokens,
        tokensSold: prop.tokensSold,
        isActive: prop.isActive,
        estimatedAnnualYield: prop.estimatedAnnualYield || 0,
      };
    } catch (error: any) {
      console.error("Error fetching property:", error);
      return null;
    }
  };

  // Get property documents
  const getPropertyDocuments = async (
    propertyId: bigint
  ): Promise<PropertyDocument[]> => {
    if (!contractReady || !contract) throw new Error("Contract not ready");

    try {
      const documents = await contract.getPropertyDocuments(propertyId);
      return documents.map((doc: any) => ({
        id: doc.id,
        propertyId: doc.propertyId,
        name: doc.name,
        documentType: doc.documentType,
        ipfsHash: doc.ipfsHash,
        uploadDate: doc.uploadDate,
        uploadedBy: doc.uploadedBy,
      }));
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      throw new Error(error.message || "Error fetching documents");
    }
  };

  // Upload property document
  const uploadDocument = async (
    propertyId: bigint,
    name: string,
    docType: string,
    ipfsHash: string
  ): Promise<boolean> => {
    if (!contractReady || !contract) throw new Error("Contract not ready");
    if (!walletState.account) throw new Error("Wallet not connected");

    try {
      const tx = await contract.uploadDocument(
        propertyId,
        name,
        docType,
        ipfsHash
      );
      toast.loading("Uploading document...");
      await tx.wait();
      toast.dismiss();
      toast.success("Document uploaded successfully!");
      return true;
    } catch (error: any) {
      toast.dismiss();
      console.error("Error uploading document:", error);
      toast.error(error.message || "Error uploading document");
      return false;
    }
  };

  // Get tokens owned by an investor for a specific property
  const getInvestorTokens = async (
    propertyId: bigint,
    investor: string
  ): Promise<number> => {
    if (!contractReady || !contract) throw new Error("Contract not ready");

    try {
      const tokens = await contract.getInvestorTokens(propertyId, investor);
      return Number(tokens);
    } catch (error: any) {
      console.error("Error fetching investor tokens:", error);
      throw new Error(error.message || "Error fetching tokens");
    }
  };

  return {
    walletState,
    loading,
    contractReady,
    connectWallet,
    disconnectWallet,
    getActiveProperties,
    getMyProperties,
    getMyInvestments,
    getProperty,
    getPoolInfo,
    buyTokens,
    listProperty,
    deactivatePool,
    reactivatePool,
    calculateTokenPriceETH,
    getPropertyDocuments,
    uploadDocument,
    getInvestorTokens,
    TOKEN_PRICE_USD,
    ethPrice,
    priceLoading,
  };
};
