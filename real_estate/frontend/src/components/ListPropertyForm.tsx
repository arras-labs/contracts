import { useState } from "react";

interface ListPropertyFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    location: string;
    totalValueUSD: string;
    area: string;
    imageUrl: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  tokenPriceUSD: number;
  usdToEthRate: number;
}

export const ListPropertyForm = ({
  onSubmit,
  onCancel,
  loading,
  tokenPriceUSD,
  usdToEthRate,
}: ListPropertyFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    totalValueUSD: "",
    area: "",
    imageUrl: "",
  });

  const calculateTokensAndETH = () => {
    const valueUSD = parseFloat(formData.totalValueUSD) || 0;
    const tokens = Math.floor(valueUSD / tokenPriceUSD);
    const valueETH = valueUSD / usdToEthRate;
    return { tokens, valueETH: valueETH.toFixed(4) };
  };

  const { tokens, valueETH } = calculateTokensAndETH();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Lista Nuova Proprietà
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Proprietà *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="es. Villa Moderna con Piscina"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Descrivi la proprietà in dettaglio..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posizione *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="es. Milano, Lombardia"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valore Totale (USD) *
                </label>
                <input
                  type="number"
                  name="totalValueUSD"
                  value={formData.totalValueUSD}
                  onChange={handleChange}
                  required
                  step="1"
                  min="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="100000"
                />
                {formData.totalValueUSD && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600">≈ {valueETH} ETH</p>
                    <p className="text-xs text-green-600 font-semibold">
                      {tokens} token disponibili (${tokenPriceUSD}/token)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area (m²) *
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="120"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Immagine *
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="flex gap-4 pt-4">
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
                disabled={loading}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? "Pubblicazione..." : "Pubblica Proprietà"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
