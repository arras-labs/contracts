import { useState } from "react";
import type { Property } from "../types";

interface TokenPurchaseModalProps {
  property: Property;
  onPurchase: (propertyId: bigint, tokenAmount: number) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  tokenPriceUSD: number;
  tokenPriceETH: string;
  availableTokens: number;
}

export const TokenPurchaseModal = ({
  property,
  onPurchase,
  onCancel,
  loading,
  tokenPriceUSD,
  tokenPriceETH,
  availableTokens,
}: TokenPurchaseModalProps) => {
  const [tokenAmount, setTokenAmount] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onPurchase(property.id, tokenAmount);
  };

  const calculateTotalCost = () => {
    const totalETH = parseFloat(tokenPriceETH) * tokenAmount;
    const totalUSD = tokenPriceUSD * tokenAmount;
    return { totalETH: totalETH.toFixed(6), totalUSD };
  };

  const { totalETH, totalUSD } = calculateTotalCost();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-slide-up">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acquista Token
          </h2>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">
              {property.name}
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>📍 {property.location}</p>
              <p>
                💰 Prezzo per token: ${tokenPriceUSD} (≈ {tokenPriceETH} ETH)
              </p>
              <p>🎯 Token disponibili: {availableTokens}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numero di Token *
              </label>
              <input
                type="number"
                value={tokenAmount}
                onChange={(e) =>
                  setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))
                }
                required
                min="1"
                max={availableTokens}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimo: 1 | Massimo: {availableTokens}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Token:</span>
                  <span className="font-semibold">{tokenAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Costo totale (USD):</span>
                  <span className="font-semibold text-green-600">
                    ${totalUSD.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Costo totale (ETH):</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {totalETH} ETH
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                ⚠️ Una volta acquistati, i token rappresentano una quota
                dell'immobile e non possono essere rimborsati.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={
                  loading || tokenAmount < 1 || tokenAmount > availableTokens
                }
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? "Acquisto..." : "Conferma Acquisto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
