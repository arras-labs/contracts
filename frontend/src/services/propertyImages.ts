/**
 * Service per gestire le immagini delle proprietà in localStorage
 * Questo è un workaround temporaneo finché non viene aggiunto un campo immagini
 * multipli nel contratto o salvate su IPFS
 */

const STORAGE_KEY = "property_images";

export interface PropertyImages {
  propertyId: string;
  images: string[];
  mainImage: string;
  timestamp: number;
}

/**
 * Salva le immagini di una proprietà
 */
export const savePropertyImages = (
  propertyId: string,
  images: string[]
): void => {
  if (images.length === 0) return;

  const storage = getPropertyImagesStorage();
  storage[propertyId] = {
    propertyId,
    images,
    mainImage: images[0],
    timestamp: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
};

/**
 * Recupera le immagini di una proprietà
 */
export const getPropertyImages = (propertyId: string): string[] => {
  const storage = getPropertyImagesStorage();
  const propertyData = storage[propertyId];

  if (!propertyData) {
    // Se non ci sono immagini salvate, ritorna array vuoto
    return [];
  }

  return propertyData.images;
};

/**
 * Recupera l'immagine principale di una proprietà
 */
export const getPropertyMainImage = (propertyId: string): string | null => {
  const storage = getPropertyImagesStorage();
  const propertyData = storage[propertyId];

  return propertyData?.mainImage || null;
};

/**
 * Ottiene tutto lo storage delle immagini
 */
const getPropertyImagesStorage = (): Record<string, PropertyImages> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Errore lettura localStorage:", error);
    return {};
  }
};

/**
 * Elimina le immagini di una proprietà
 */
export const deletePropertyImages = (propertyId: string): void => {
  const storage = getPropertyImagesStorage();
  delete storage[propertyId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
};

/**
 * Pulisci immagini vecchie (più di 30 giorni)
 */
export const cleanOldPropertyImages = (): void => {
  const storage = getPropertyImagesStorage();
  const now = Date.now();
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

  Object.keys(storage).forEach((propertyId) => {
    const propertyData = storage[propertyId];
    if (now - propertyData.timestamp > thirtyDaysInMs) {
      delete storage[propertyId];
    }
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
};

/**
 * Esporta tutte le immagini (per debug)
 */
export const exportAllPropertyImages = (): Record<string, PropertyImages> => {
  return getPropertyImagesStorage();
};
