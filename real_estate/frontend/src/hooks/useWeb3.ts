import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID } from "../utils/constants";
import type { Property, WalletState } from "../types";
import toast from "react-hot-toast";

declare global {
  interface Window {
    ethereum?: any;
  }
}

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

  // Ottieni tutte le proprietà in vendita
  const getPropertiesForSale = async (): Promise<Property[]> => {
    if (!contract) {
      toast.error("Contratto non inizializzato");
      return [];
    }

    try {
      const properties = await contract.getPropertiesForSale();
      return properties.map((prop: any) => ({
        id: prop.id,
        name: prop.name,
        description: prop.description,
        location: prop.location,
        price: prop.price,
        area: prop.area,
        owner: prop.owner,
        isForSale: prop.isForSale,
        imageUrl: prop.imageUrl,
        listedTimestamp: prop.listedTimestamp,
      }));
    } catch (error) {
      console.error("❌ Errore nel recupero delle proprietà:", error);
      toast.error("Errore nel caricamento delle proprietà");
      return [];
    }
  };

  // Ottieni le proprietà dell'utente
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
        price: prop.price,
        area: prop.area,
        owner: prop.owner,
        isForSale: prop.isForSale,
        imageUrl: prop.imageUrl,
        listedTimestamp: prop.listedTimestamp,
      }));
    } catch (error) {
      console.error("Errore nel recupero delle tue proprietà:", error);
      toast.error("Errore nel caricamento delle tue proprietà");
      return [];
    }
  };

  // Acquista una proprietà
  const buyProperty = async (propertyId: bigint, price: bigint) => {
    if (!contract) {
      toast.error("Contratto non inizializzato");
      return false;
    }

    setLoading(true);
    try {
      const tx = await contract.buyProperty(propertyId, { value: price });
      toast.loading("Transazione in corso...", { id: "buy-tx" });
      await tx.wait();
      toast.success("Proprietà acquistata con successo!", { id: "buy-tx" });
      return true;
    } catch (error: any) {
      console.error("Errore nell'acquisto:", error);
      toast.error(error.reason || "Errore durante l'acquisto", {
        id: "buy-tx",
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
    price: string,
    area: string,
    imageUrl: string
  ) => {
    if (!contract) {
      toast.error("Contratto non inizializzato");
      return false;
    }

    setLoading(true);
    try {
      const priceInWei = parseEther(price);
      const tx = await contract.listProperty(
        name,
        description,
        location,
        priceInWei,
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

  // Metti in vendita una proprietà
  const setForSale = async (propertyId: bigint, newPrice: string) => {
    if (!contract) {
      toast.error("Contratto non inizializzato");
      return false;
    }

    setLoading(true);
    try {
      const priceInWei = parseEther(newPrice);
      const tx = await contract.setForSale(propertyId, priceInWei);
      toast.loading("Aggiornamento in corso...", { id: "sale-tx" });
      await tx.wait();
      toast.success("Proprietà messa in vendita!", { id: "sale-tx" });
      return true;
    } catch (error: any) {
      console.error("Errore nell'aggiornamento:", error);
      toast.error(error.reason || "Errore durante l'aggiornamento", {
        id: "sale-tx",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Rimuovi dalla vendita
  const removeFromSale = async (propertyId: bigint) => {
    if (!contract) {
      toast.error("Contratto non inizializzato");
      return false;
    }

    setLoading(true);
    try {
      const tx = await contract.removeFromSale(propertyId);
      toast.loading("Rimozione in corso...", { id: "remove-tx" });
      await tx.wait();
      toast.success("Proprietà rimossa dalla vendita!", { id: "remove-tx" });
      return true;
    } catch (error: any) {
      console.error("Errore nella rimozione:", error);
      toast.error(error.reason || "Errore durante la rimozione", {
        id: "remove-tx",
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
    getPropertiesForSale,
    getMyProperties,
    buyProperty,
    listProperty,
    setForSale,
    removeFromSale,
  };
};
