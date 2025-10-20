import { useState, useEffect } from "react";
import type { Property } from "./types";
import { useWeb3 } from "./hooks/useWeb3";
import { Header } from "./components/Header";
import { PropertyCard } from "./components/PropertyCard";
import { ListPropertyForm } from "./components/ListPropertyForm";

function App() {
  const {
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
  } = useWeb3();

  const [showListForm, setShowListForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [properties, setProperties] = useState<Property[]>([]);
  const [myProperties, setMyProperties] = useState<Property[]>([]);

  // Carica le proprietà
  const loadProperties = async () => {
    const allProps = await getPropertiesForSale();
    const myProps = await getMyProperties();
    setProperties(allProps);
    setMyProperties(myProps);
  };

  useEffect(() => {
    if (walletState.isConnected && contractReady) {
      loadProperties();
    }
  }, [walletState.isConnected, contractReady]);

  const handleBuyProperty = async (property: Property) => {
    const success = await buyProperty(property.id, property.price);
    if (success) {
      await loadProperties();
    }
  };

  const handleListProperty = async (data: {
    name: string;
    description: string;
    location: string;
    price: string;
    area: string;
    imageUrl: string;
  }) => {
    const success = await listProperty(
      data.name,
      data.description,
      data.location,
      data.price,
      data.area,
      data.imageUrl
    );
    if (success) {
      setShowListForm(false);
      await loadProperties();
    }
  };

  const handleSetForSale = async (property: Property) => {
    // Chiedi il nuovo prezzo all'utente
    const newPriceStr = prompt("Inserisci il nuovo prezzo in ETH:", "1.0");
    if (!newPriceStr) return;

    const success = await setForSale(property.id, newPriceStr);
    if (success) {
      await loadProperties();
    }
  };

  const handleRemoveFromSale = async (property: Property) => {
    const success = await removeFromSale(property.id);
    if (success) {
      await loadProperties();
    }
  };

  const displayProperties = activeTab === "all" ? properties : myProperties;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header
        walletState={walletState}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
      />

      <main className="container mx-auto px-4 py-8">
        {!walletState.isConnected ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-lg shadow-xl p-12 max-w-md mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Benvenuto su Real Estate DApp
              </h2>
              <p className="text-gray-600 mb-8">
                Connetti il tuo wallet per iniziare a comprare e vendere
                proprieta immobiliari sulla blockchain.
              </p>
              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Connetti Wallet
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === "all"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Tutte le Proprieta ({properties.length})
                </button>
                <button
                  onClick={() => setActiveTab("my")}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === "my"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Le Mie Proprieta ({myProperties.length})
                </button>
              </div>
              <button
                onClick={() => setShowListForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                + Aggiungi Proprieta
              </button>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Caricamento...</p>
              </div>
            ) : displayProperties.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white rounded-lg shadow-xl p-12 max-w-md mx-auto">
                  <p className="text-gray-600 text-lg">
                    {activeTab === "all"
                      ? "Nessuna proprieta disponibile"
                      : "Non possiedi ancora nessuna proprieta"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayProperties.map((property: Property) => (
                  <PropertyCard
                    key={property.id.toString()}
                    property={property}
                    isOwner={
                      property.owner.toLowerCase() ===
                      walletState.account?.toLowerCase()
                    }
                    onBuy={handleBuyProperty}
                    onSetForSale={handleSetForSale}
                    onRemoveFromSale={handleRemoveFromSale}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showListForm && (
        <ListPropertyForm
          onSubmit={handleListProperty}
          onCancel={() => setShowListForm(false)}
          loading={loading}
        />
      )}
    </div>
  );
}

export default App;
