import { useNavigate } from "react-router-dom";
import type { Property } from "../types";

interface PropertyCardProps {
  property: Property;
  onBuyTokens?: (property: Property) => void;
  onDeactivatePool?: (property: Property) => void;
  onReactivatePool?: (property: Property) => void;
  isOwner?: boolean;
  tokenPriceUSD: number;
}

export const PropertyCard = ({
  property,
  onBuyTokens,
  onDeactivatePool,
  onReactivatePool,
  isOwner = false,
  tokenPriceUSD,
}: PropertyCardProps) => {
  const navigate = useNavigate();
  // Calcola la percentuale di completamento
  const percentageComplete =
    property.totalTokens > 0
      ? Number((property.tokensSold * BigInt(100)) / property.totalTokens)
      : 0;

  const tokensAvailable = Number(property.totalTokens - property.tokensSold);
  const currentValueUSD = Number(property.tokensSold) * tokenPriceUSD;
  const totalValueUSD = Number(property.totalValueUSD);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 animate-fade-in">
      <div className="relative h-64 overflow-hidden">
        <img
          src={property.imageUrl}
          alt={property.name}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
        />
        {property.isActive && (
          <span className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Pool Attiva
          </span>
        )}
        {!property.isActive && (
          <span className="absolute top-4 right-4 bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Pool Chiusa
          </span>
        )}
        {isOwner && (
          <span className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Tua Proprietà
          </span>
        )}
        {percentageComplete === 100 && (
          <span className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            🎉 Pool Completata!
          </span>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {property.name}
        </h3>

        <div className="flex items-center text-gray-600 mb-3">
          <svg
            className="w-5 h-5 mr-2"
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
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">
          {property.description}
        </p>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progresso Pool</span>
            <span className="font-semibold text-blue-600">
              {percentageComplete}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                percentageComplete === 100
                  ? "bg-green-500"
                  : "bg-gradient-to-r from-blue-500 to-blue-600"
              }`}
              style={{ width: `${percentageComplete}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{Number(property.tokensSold)} venduti</span>
            <span>{tokensAvailable} disponibili</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center text-gray-700">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            <span className="font-semibold">{property.area.toString()} m²</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Valore Raccolto</p>
            <p className="text-lg font-bold text-green-600">
              ${currentValueUSD.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Valore Totale:</span>
            <span className="text-xl font-bold text-gray-900">
              ${totalValueUSD.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Token totali:</span>
            <span className="font-semibold text-gray-700">
              {Number(property.totalTokens)} × ${tokenPriceUSD}
            </span>
          </div>
        </div>

        {/* Pulsanti azione */}
        <div className="space-y-2">
          {/* Bottone Dettagli - sempre visibile */}
          <button
            onClick={() => navigate(`/property/${property.id}`)}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            📊 Visualizza Dettagli
          </button>

          {!isOwner &&
            property.isActive &&
            tokensAvailable > 0 &&
            onBuyTokens && (
              <button
                onClick={() => onBuyTokens(property)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                💰 Acquista Token
              </button>
            )}

          {isOwner && property.isActive && onDeactivatePool && (
            <button
              onClick={() => onDeactivatePool(property)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              ⏸️ Disattiva Pool
            </button>
          )}

          {isOwner &&
            !property.isActive &&
            tokensAvailable > 0 &&
            onReactivatePool && (
              <button
                onClick={() => onReactivatePool(property)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                ▶️ Riattiva Pool
              </button>
            )}

          {tokensAvailable === 0 && (
            <div className="w-full bg-gray-100 text-gray-600 font-bold py-3 px-4 rounded-lg text-center">
              ✅ Tutti i token sono stati venduti
            </div>
          )}
        </div>

        {/* Info proprietario */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Proprietario: {property.owner.slice(0, 6)}...
            {property.owner.slice(-4)}
          </p>
        </div>
      </div>
    </div>
  );
};
