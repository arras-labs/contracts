import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Property, PropertyDocument, PoolInfo } from "../types";
import { YieldSection } from "./YieldSection";
import { DocumentsSection } from "./DocumentsSection";
import { TokenPurchaseModal } from "./TokenPurchaseModal";

interface PropertyDetailsProps {
  walletState: { account: string | null; isConnected: boolean };
  getProperty: (id: bigint) => Promise<Property | null>;
  getPoolInfo: (id: bigint) => Promise<PoolInfo | null>;
  getPropertyDocuments: (id: bigint) => Promise<PropertyDocument[]>;
  getInvestorTokens: (propertyId: bigint, investor: string) => Promise<number>;
  buyTokens: (propertyId: bigint, tokenAmount: number) => Promise<boolean>;
  uploadDocument: (
    propertyId: bigint,
    name: string,
    docType: string,
    ipfsHash: string
  ) => Promise<boolean>;
  loading: boolean;
  tokenPriceUSD: number;
  calculateTokenPriceETH: () => string;
}

export const PropertyDetails = ({
  walletState,
  getProperty,
  getPoolInfo,
  getPropertyDocuments,
  getInvestorTokens,
  buyTokens,
  uploadDocument,
  loading,
  tokenPriceUSD,
  calculateTokenPriceETH,
}: PropertyDetailsProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [userTokens, setUserTokens] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "overview" | "yield" | "documents"
  >("overview");
  const [showTokenModal, setShowTokenModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadPropertyData();
    }
  }, [id, walletState.account]);

  const loadPropertyData = async () => {
    if (!id) return;

    const propertyId = BigInt(id);
    const propData = await getProperty(propertyId);
    const poolData = await getPoolInfo(propertyId);
    const docs = await getPropertyDocuments(propertyId);

    setProperty(propData);
    setPoolInfo(poolData);
    setDocuments(docs);

    if (walletState.account) {
      const tokens = await getInvestorTokens(propertyId, walletState.account);
      setUserTokens(tokens);
    }
  };

  const handleBuyTokens = async (propertyId: bigint, tokenAmount: number) => {
    const success = await buyTokens(propertyId, tokenAmount);
    if (success) {
      setShowTokenModal(false);
      await loadPropertyData();
    }
  };

  const handleUploadDocument = async (
    propertyId: bigint,
    name: string,
    docType: string,
    ipfsHash: string
  ) => {
    const success = await uploadDocument(propertyId, name, docType, ipfsHash);
    if (success) {
      await loadPropertyData();
    }
  };

  if (!property || !poolInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isOwner =
    property.owner.toLowerCase() === walletState.account?.toLowerCase();
  const percentageComplete = Number(poolInfo.percentageComplete);
  const tokensAvailable = Number(poolInfo.tokensAvailable);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header con immagine */}
      <div className="relative h-96 bg-gray-900">
        <img
          src={property.imageUrl}
          alt={property.name}
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

        {/* Pulsante indietro */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-lg"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Indietro
        </button>

        {/* Info principale sovra impressa */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="container mx-auto">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">{property.name}</h1>
                <div className="flex items-center gap-4 text-lg">
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {property.location}
                  </span>
                  <span>•</span>
                  <span>{property.area.toString()} m²</span>
                </div>
              </div>

              {property.isActive && tokensAvailable > 0 && !isOwner && (
                <button
                  onClick={() => setShowTokenModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors duration-200 shadow-lg"
                >
                  💰 Investi Ora
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistiche principali */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Valore Totale</div>
            <div className="text-2xl font-bold text-gray-900">
              ${Number(property.totalValueUSD).toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Progresso Pool</div>
            <div className="text-2xl font-bold text-green-600">
              {percentageComplete}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${percentageComplete}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Token Disponibili</div>
            <div className="text-2xl font-bold text-blue-600">
              {tokensAvailable.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              su {Number(poolInfo.totalTokens).toLocaleString()} totali
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">I Tuoi Token</div>
            <div className="text-2xl font-bold text-purple-600">
              {userTokens}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ≈ ${(userTokens * tokenPriceUSD).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === "overview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📋 Panoramica
              </button>
              <button
                onClick={() => setActiveTab("yield")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === "yield"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📈 Rendimento
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === "documents"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📁 Documenti ({documents.length})
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Descrizione
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {property.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Dettagli Proprietà
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Superficie:</span>
                        <span className="font-medium">
                          {property.area.toString()} m²
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Posizione:</span>
                        <span className="font-medium">{property.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data Listing:</span>
                        <span className="font-medium">
                          {new Date(
                            Number(property.listedTimestamp) * 1000
                          ).toLocaleDateString("it-IT")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Info Pool
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prezzo Token:</span>
                        <span className="font-medium">${tokenPriceUSD}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Totale Investitori:
                        </span>
                        <span className="font-medium">
                          {poolInfo.investors.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stato:</span>
                        <span
                          className={`font-medium ${
                            property.isActive
                              ? "text-green-600"
                              : "text-gray-600"
                          }`}
                        >
                          {property.isActive ? "Attiva" : "Chiusa"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {poolInfo.investors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Investitori ({poolInfo.investors.length})
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {poolInfo.investors.map((investor, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="font-mono text-gray-600">
                              {investor.slice(0, 6)}...{investor.slice(-4)}
                            </span>
                            {investor.toLowerCase() ===
                              walletState.account?.toLowerCase() && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                Tu
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "yield" && (
              <YieldSection property={property} userTokens={userTokens} />
            )}

            {activeTab === "documents" && (
              <DocumentsSection
                propertyId={property.id}
                documents={documents}
                isOwner={isOwner}
                onUploadDocument={handleUploadDocument}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal acquisto token */}
      {showTokenModal && (
        <TokenPurchaseModal
          property={property}
          onPurchase={handleBuyTokens}
          onCancel={() => setShowTokenModal(false)}
          loading={loading}
          tokenPriceUSD={tokenPriceUSD}
          tokenPriceETH={calculateTokenPriceETH()}
          availableTokens={tokensAvailable}
        />
      )}
    </div>
  );
};
