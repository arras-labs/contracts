import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID } from "../utils/constants";
import type { Property, WalletState, PoolInfo, Investment } from "../types";
import toast from "react-hot-toast";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Tasso di cambio USD/ETH (in un'applicazione reale, questo dovrebbe venire da un oracle)
// Per ora usiamo un valore approssimativo: 1 ETH = 2000 USD
const USD_TO_ETH_RATE = 2000;
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

  // Inizializza il contratto
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
      console.error("❌ Errore inizializzazione contratto:", error);
      toast.error("Errore durante l'inizializzazione del contratto");
      setContractReady(false);
    }
  }, [walletState.account]);

  // Connetti wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error(
        "MetaMask non è installato! Installa MetaMask per continuare."
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
        toast.error(`Cambia rete a Chain ID: ${CHAIN_ID}`);
      }

      setWalletState({
        account: accounts[0],
        balance: formatEther(balance),
        chainId: Number(network.chainId),
        isConnected: true,
      });

      toast.success("Wallet connesso con successo!");
    } catch (error: any) {
      console.error("Errore connessione wallet:", error);
      toast.error("Errore durante la connessione del wallet");
    } finally {
      setLoading(false);
    }
  };

  // Disconnetti wallet
  const disconnectWallet = () => {
    setWalletState({
      account: null,
      balance: null,
      chainId: null,
      isConnected: false,
    });
    setContract(null);
    toast.success("Wallet disconnesso");
  };

  // Ottieni tutte le proprietà attive
  const getActiveProperties = async (): Promise<Property[]> => {
    if (!contract) {
      toast.error("Contratto non inizializzato");
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
      }));
    } catch (error) {
      console.error("❌ Errore nel recupero delle proprietà:", error);
      toast.error("Errore nel caricamento delle proprietà");
      return [];
    }
  };

  // Ottieni le proprietà dell'utente (dove è owner dell'NFT)
  const getMyProperties = async (): Promise<Property[]> => {
    if (!contract || !walletState.account) {
      toast.error("Contratto non inizializzato o wallet non connesso");
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
      }));
    } catch (error) {
      console.error("Errore nel recupero delle tue proprietà:", error);
      toast.error("Errore nel caricamento delle tue proprietà");
      return [];
    }
  };

  // Ottieni gli investimenti dell'utente (dove ha comprato token)
  const getMyInvestments = async (): Promise<Investment[]> => {
    if (!contract || !walletState.account) {
      toast.error("Contratto non inizializzato o wallet non connesso");
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
        },
        tokensOwned: tokenAmounts[index],
      }));
    } catch (error) {
      console.error("Errore nel recupero dei tuoi investimenti:", error);
      toast.error("Errore nel caricamento dei tuoi investimenti");
      return [];
    }
  };

  // Ottieni informazioni sulla pool di una proprietà
  const getPoolInfo = async (propertyId: bigint): Promise<PoolInfo | null> => {
    if (!contract) {
      toast.error("Contratto non inizializzato");
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
      console.error("Errore nel recupero info pool:", error);
      toast.error("Errore nel caricamento delle informazioni della pool");
      return null;
    }
  };

  // Calcola il prezzo di un token in ETH basato sul tasso USD/ETH
  const calculateTokenPriceETH = (): string => {
    const priceInETH = TOKEN_PRICE_USD / USD_TO_ETH_RATE;
    return priceInETH.toFixed(6);
  };

  // Acquista token di una proprietà
  const buyTokens = async (
    propertyId: bigint,
    tokenAmount: number
  ): Promise<boolean> => {
    if (!contract) {
      toast.error("Contratto non inizializzato");
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
      toast.loading("Acquisto in corso...", { id: "buy-tokens-tx" });
      await tx.wait();
      toast.success(`${tokenAmount} token acquistati con successo!`, {
        id: "buy-tokens-tx",
      });
      return true;
    } catch (error: any) {
      console.error("Errore nell'acquisto token:", error);
      toast.error(error.reason || "Errore durante l'acquisto", {
        id: "buy-tokens-tx",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Lista una nuova proprietà
  const listProperty = async (
    name: string,
    description: string,
    location: string,
    totalValueUSD: string,
    area: string,
    imageUrl: string
  ) => {
    if (!contract) {
      toast.error("Contratto non inizializzato");
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
        imageUrl
      );
      toast.loading("Pubblicazione in corso...", { id: "list-tx" });
      await tx.wait();
      toast.success("Proprietà pubblicata con successo!", { id: "list-tx" });
      return true;
    } catch (error: any) {
      console.error("Errore nella pubblicazione:", error);
      toast.error(error.reason || "Errore durante la pubblicazione", {
        id: "list-tx",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Disattiva pool
  const deactivatePool = async (propertyId: bigint) => {
    if (!contract) {
      toast.error("Contratto non inizializzato");
      return false;
    }

    setLoading(true);
    try {
      const tx = await contract.deactivatePool(propertyId);
      toast.loading("Disattivazione in corso...", { id: "deactivate-tx" });
      await tx.wait();
      toast.success("Pool disattivata!", { id: "deactivate-tx" });
      return true;
    } catch (error: any) {
      console.error("Errore nella disattivazione:", error);
      toast.error(error.reason || "Errore durante la disattivazione", {
        id: "deactivate-tx",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Riattiva pool
  const reactivatePool = async (propertyId: bigint) => {
    if (!contract) {
      toast.error("Contratto non inizializzato");
      return false;
    }

    setLoading(true);
    try {
      const tx = await contract.reactivatePool(propertyId);
      toast.loading("Riattivazione in corso...", { id: "reactivate-tx" });
      await tx.wait();
      toast.success("Pool riattivata!", { id: "reactivate-tx" });
      return true;
    } catch (error: any) {
      console.error("Errore nella riattivazione:", error);
      toast.error(error.reason || "Errore durante la riattivazione", {
        id: "reactivate-tx",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Effetti
  useEffect(() => {
    if (walletState.account) {
      initContract();
    }
  }, [walletState.account, initContract]);

  // Listener per cambio account
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

  return {
    walletState,
    loading,
    contractReady,
    connectWallet,
    disconnectWallet,
    getActiveProperties,
    getMyProperties,
    getMyInvestments,
    getPoolInfo,
    buyTokens,
    listProperty,
    deactivatePool,
    reactivatePool,
    calculateTokenPriceETH,
    TOKEN_PRICE_USD,
    USD_TO_ETH_RATE,
  };
};
