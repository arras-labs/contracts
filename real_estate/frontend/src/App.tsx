import { useState, useEffect } from "react";
import type { Property } from "./types";
import { useWeb3 } from "./hooks/useWeb3";
import { Header } from "./components/Header";
import { PropertyCard } from "./components/PropertyCard";
import { ListPropertyForm } from "./components/ListPropertyForm";
import { TokenPurchaseModal } from "./components/TokenPurchaseModal";

function App() {
  const {
    walletState,
    loading,
    contractReady,
    connectWallet,
    disconnectWallet,
    getActiveProperties,
    getMyProperties,
    getMyInvestments,
    buyTokens,
    listProperty,
    deactivatePool,
    reactivatePool,
    calculateTokenPriceETH,
    TOKEN_PRICE_USD,
    USD_TO_ETH_RATE,
  } = useWeb3();

  const [showListForm, setShowListForm] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"all" | "my" | "investments">(
    "all"
  );
  const [properties, setProperties] = useState<Property[]>([]);
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [myInvestments, setMyInvestments] = useState<Property[]>([]);

  // Carica le proprietà
  const loadProperties = async () => {
    const allProps = await getActiveProperties();
    const myProps = await getMyProperties();
    const investments = await getMyInvestments();
    setProperties(allProps);
    setMyProperties(myProps);
    setMyInvestments(investments.map((inv) => inv.property));
  };

  useEffect(() => {
    if (walletState.isConnected && contractReady) {
      loadProperties();
    }
  }, [walletState.isConnected, contractReady]);

  const handleBuyTokens = (property: Property) => {
    setSelectedProperty(property);
    setShowTokenModal(true);
  };

  const handleConfirmTokenPurchase = async (
    propertyId: bigint,
    tokenAmount: number
  ) => {
    const success = await buyTokens(propertyId, tokenAmount);
    if (success) {
      setShowTokenModal(false);
      setSelectedProperty(null);
      await loadProperties();
    }
  };

  const handleListProperty = async (data: {
    name: string;
    description: string;
    location: string;
    totalValueUSD: string;
    area: string;
    imageUrl: string;
  }) => {
    const success = await listProperty(
      data.name,
      data.description,
      data.location,
      data.totalValueUSD,
      data.area,
      data.imageUrl
    );
    if (success) {
      setShowListForm(false);
      await loadProperties();
    }
  };

  const handleDeactivatePool = async (property: Property) => {
    const success = await deactivatePool(property.id);
    if (success) {
      await loadProperties();
    }
  };

  const handleReactivatePool = async (property: Property) => {
    const success = await reactivatePool(property.id);
    if (success) {
      await loadProperties();
    }
  };

  let displayProperties: Property[] = [];
  if (activeTab === "all") {
    displayProperties = properties;
  } else if (activeTab === "my") {
    displayProperties = myProperties;
  } else {
    displayProperties = myInvestments;
  }

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
                  Tutte le Pool ({properties.length})
                </button>
                <button
                  onClick={() => setActiveTab("my")}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === "my"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Le Mie Proprietà ({myProperties.length})
                </button>
                <button
                  onClick={() => setActiveTab("investments")}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === "investments"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  I Miei Investimenti ({myInvestments.length})
                </button>
              </div>
              <button
                onClick={() => setShowListForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                + Crea Nuova Pool
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
                      ? "Nessuna pool disponibile"
                      : activeTab === "my"
                      ? "Non hai ancora creato nessuna pool"
                      : "Non hai ancora investito in nessuna pool"}
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
                    tokenPriceUSD={TOKEN_PRICE_USD}
                    onBuyTokens={handleBuyTokens}
                    onDeactivatePool={handleDeactivatePool}
                    onReactivatePool={handleReactivatePool}
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
          tokenPriceUSD={TOKEN_PRICE_USD}
          usdToEthRate={USD_TO_ETH_RATE}
        />
      )}

      {showTokenModal && selectedProperty && (
        <TokenPurchaseModal
          property={selectedProperty}
          onPurchase={handleConfirmTokenPurchase}
          onCancel={() => {
            setShowTokenModal(false);
            setSelectedProperty(null);
          }}
          loading={loading}
          tokenPriceUSD={TOKEN_PRICE_USD}
          tokenPriceETH={calculateTokenPriceETH()}
          availableTokens={Number(
            selectedProperty.totalTokens - selectedProperty.tokensSold
          )}
        />
      )}
    </div>
  );
}

export default App;
