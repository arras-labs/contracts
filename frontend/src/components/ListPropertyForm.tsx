import { useState } from "react";
import {
  uploadImagesToDropbox,
  isDropboxConfigured,
} from "../services/dropbox";
import toast from "react-hot-toast";

interface ListPropertyFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    location: string;
    totalValueUSD: string;
    area: string;
    imageUrl: string;
    allImageUrls: string[];
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

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const calculateTokensAndETH = () => {
    const valueUSD = parseFloat(formData.totalValueUSD) || 0;
    const tokens = Math.floor(valueUSD / tokenPriceUSD);
    const valueETH = valueUSD / usdToEthRate;
    return { tokens, valueETH: valueETH.toFixed(4) };
  };

  const { tokens, valueETH } = calculateTokensAndETH();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verifica che ci siano immagini
    if (selectedImages.length === 0) {
      toast.error("Carica almeno un'immagine");
      return;
    }

    // Verifica configurazione Dropbox
    if (!isDropboxConfigured()) {
      toast.error(
        "Dropbox non configurato. Controlla la variabile VITE_DROPBOX_ACCESS_TOKEN"
      );
      return;
    }

    setUploadingImages(true);

    try {
      // Upload immagini su Dropbox con progresso dettagliato
      toast.loading(`Caricamento 0/${selectedImages.length} immagini...`, {
        id: "upload-images",
      });

      const uploadedImages = await uploadImagesToDropbox(
        formData.name,
        selectedImages,
        (current, total) => {
          // Callback progresso
          toast.loading(`Caricamento ${current}/${total} immagini...`, {
            id: "upload-images",
          });
        }
      );

      toast.success(
        `✅ ${uploadedImages.length} immagini caricate su Dropbox!`,
        {
          id: "upload-images",
          duration: 3000,
        }
      );

      // Usa la prima immagine come immagine principale
      const mainImageUrl = uploadedImages[0].url;
      // Prendi tutte le URL
      const allImageUrls = uploadedImages.map((img) => img.url);

      // Invia il form con tutte le URL
      await onSubmit({
        ...formData,
        imageUrl: mainImageUrl,
        allImageUrls: allImageUrls,
      });

      // Reset delle immagini
      setSelectedImages([]);
      setImagePreviews([]);
    } catch (error: any) {
      console.error("Errore upload immagini:", error);

      // Messaggio di errore più specifico
      let errorMessage = "Errore durante l'upload delle immagini";

      if (error.message.includes("Timeout")) {
        errorMessage = "⏱️ Timeout: immagine troppo grande o connessione lenta";
      } else if (error.message.includes("Lettura file")) {
        errorMessage =
          "❌ Impossibile leggere il file. Prova con un'altra immagine";
      } else if (error.message.includes("Invalid access token")) {
        errorMessage = "🔑 Token Dropbox non valido. Controlla il file .env";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        id: "upload-images",
        duration: 5000,
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Verifica numero massimo
    if (files.length > 5) {
      toast.error("Massimo 5 immagini consentite");
      return;
    }

    // Verifica tipo file
    const invalidFiles = files.filter((f) => !f.type.startsWith("image/"));
    if (invalidFiles.length > 0) {
      toast.error("Sono accettate solo immagini");
      return;
    }

    // Verifica dimensione (10MB max per file)
    const oversizedFiles = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("Alcune immagini superano il limite di 10MB");
      return;
    }

    setSelectedImages(files);

    // Crea preview
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoca URL per evitare memory leak
    URL.revokeObjectURL(imagePreviews[index]);

    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
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

            {/* Upload Immagini */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Immagini Proprietà * (max 5)
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                  disabled={uploadingImages || loading}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg
                    className="w-12 h-12 text-gray-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm text-gray-600 mb-1">
                    {selectedImages.length === 0
                      ? "Clicca per selezionare immagini"
                      : `${selectedImages.length} immagini selezionate`}
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG, WEBP fino a 10MB ciascuna
                  </span>
                </label>
              </div>

              {/* Preview immagini */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={uploadingImages || loading}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {index === 0 ? "Principale" : `#${index + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-2 text-xs text-gray-500">
                💡 Le immagini verranno caricate automaticamente su Dropbox in
                una cartella dedicata
              </p>
            </div>

            {/* Avviso Dropbox */}
            {!isDropboxConfigured() && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      ⚠️ Dropbox non configurato! Aggiungi{" "}
                      <code className="bg-yellow-100 px-1 rounded">
                        VITE_DROPBOX_ACCESS_TOKEN
                      </code>{" "}
                      nel file{" "}
                      <code className="bg-yellow-100 px-1 rounded">.env</code>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading || uploadingImages}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={
                  loading || uploadingImages || selectedImages.length === 0
                }
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImages
                  ? "Caricamento immagini..."
                  : loading
                  ? "Pubblicazione..."
                  : "Pubblica Proprietà"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
