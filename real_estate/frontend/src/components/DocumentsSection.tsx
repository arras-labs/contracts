import { useState } from "react";
import type { PropertyDocument } from "../types";

interface DocumentsSectionProps {
  propertyId: bigint;
  documents: PropertyDocument[];
  isOwner: boolean;
  onUploadDocument: (
    propertyId: bigint,
    name: string,
    docType: string,
    ipfsHash: string
  ) => Promise<void>;
  loading: boolean;
}

export const DocumentsSection = ({
  propertyId,
  documents,
  isOwner,
  onUploadDocument,
  loading,
}: DocumentsSectionProps) => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    documentType: "Contratto",
    ipfsHash: "",
  });

  const documentTypes = [
    "Contratto",
    "Perizia",
    "Planimetria",
    "Certificato Energetico",
    "Atto di Proprietà",
    "Visura Catastale",
    "Regolamento Condominiale",
    "Altro",
  ];

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "Contratto":
        return "📄";
      case "Perizia":
        return "📊";
      case "Planimetria":
        return "📐";
      case "Certificato Energetico":
        return "⚡";
      case "Atto di Proprietà":
        return "🏛️";
      case "Visura Catastale":
        return "🗺️";
      case "Regolamento Condominiale":
        return "📋";
      default:
        return "📎";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUploadDocument(
      propertyId,
      formData.name,
      formData.documentType,
      formData.ipfsHash
    );
    setFormData({ name: "", documentType: "Contratto", ipfsHash: "" });
    setShowUploadForm(false);
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getIpfsUrl = (hash: string) => {
    return `https://ipfs.io/ipfs/${hash}`;
  };

  return (
    <div className="space-y-6">
      {/* Header con pulsante upload */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            📁 Documenti Proprietà
          </h3>
          <p className="text-gray-600 mt-1">
            Tutti i documenti relativi a questa proprietà sono archiviati in
            modo sicuro su IPFS
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Carica Documento
          </button>
        )}
      </div>

      {/* Form upload documento */}
      {showUploadForm && isOwner && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
          <h4 className="text-lg font-bold text-gray-900 mb-4">
            Carica Nuovo Documento
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Documento *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="es. Contratto di Vendita 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Documento *
              </label>
              <select
                value={formData.documentType}
                onChange={(e) =>
                  setFormData({ ...formData, documentType: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {getDocumentIcon(type)} {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IPFS Hash *
              </label>
              <input
                type="text"
                value={formData.ipfsHash}
                onChange={(e) =>
                  setFormData({ ...formData, ipfsHash: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Carica il file su IPFS (es. Pinata, Web3.Storage) e inserisci
                l'hash
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? "Caricamento..." : "Carica"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista documenti */}
      {documents.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-600 text-lg">Nessun documento disponibile</p>
          {isOwner && (
            <p className="text-gray-500 text-sm mt-2">
              Carica i documenti della proprietà per renderli disponibili agli
              investitori
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id.toString()}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl">
                  {getDocumentIcon(doc.documentType)}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {doc.documentType}
                </span>
              </div>

              <h4 className="font-bold text-gray-900 mb-2 line-clamp-2">
                {doc.name}
              </h4>

              <div className="space-y-2 text-xs text-gray-600 mb-4">
                <div className="flex items-center gap-2">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {formatDate(doc.uploadDate)}
                </div>
                <div className="flex items-center gap-2">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {doc.uploadedBy.slice(0, 6)}...{doc.uploadedBy.slice(-4)}
                </div>
              </div>

              <a
                href={getIpfsUrl(doc.ipfsHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Visualizza su IPFS
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Info IPFS */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>IPFS (InterPlanetary File System):</strong> I documenti
              sono archiviati in modo decentralizzato e permanente. Una volta
              caricati, non possono essere modificati o eliminati, garantendo
              l'immutabilità e la trasparenza dei documenti.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
