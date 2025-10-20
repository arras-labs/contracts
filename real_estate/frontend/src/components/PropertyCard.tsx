import { formatEther } from "ethers";
import type { Property } from "../types";

interface PropertyCardProps {
  property: Property;
  onBuy?: (property: Property) => void;
  onSetForSale?: (property: Property) => void;
  onRemoveFromSale?: (property: Property) => void;
  isOwner?: boolean;
}

export const PropertyCard = ({
  property,
  onBuy,
  onSetForSale,
  onRemoveFromSale,
  isOwner = false,
}: PropertyCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 animate-fade-in">
      <div className="relative h-64 overflow-hidden">
        <img
          src={property.imageUrl}
          alt={property.name}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
        />
        {property.isForSale && (
          <span className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            In Vendita
          </span>
        )}
        {isOwner && (
          <span className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Tua Proprietà
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

        <div className="flex items-center justify-between mb-4">
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
            <p className="text-sm text-gray-500">Prezzo</p>
            <p className="text-2xl font-bold text-primary-600">
              {formatEther(property.price)} ETH
            </p>
          </div>
        </div>

        {/* Pulsanti azione */}
        <div className="space-y-2">
          {!isOwner && property.isForSale && onBuy && (
            <button
              onClick={() => onBuy(property)}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Acquista Ora
            </button>
          )}

          {isOwner && !property.isForSale && onSetForSale && (
            <button
              onClick={() => onSetForSale(property)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Metti in Vendita
            </button>
          )}

          {isOwner && property.isForSale && onRemoveFromSale && (
            <button
              onClick={() => onRemoveFromSale(property)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Rimuovi dalla Vendita
            </button>
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
