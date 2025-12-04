import { Dropbox } from "dropbox";

// Configurazione Dropbox
// IMPORTANTE: Questa chiave dovrebbe essere in .env, non hardcoded
const DROPBOX_ACCESS_TOKEN = import.meta.env.VITE_DROPBOX_ACCESS_TOKEN || "";

let dbx: Dropbox | null = null;

const getDropboxClient = () => {
  if (!dbx && DROPBOX_ACCESS_TOKEN) {
    dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN });
  }
  return dbx;
};

export interface UploadedImage {
  name: string;
  path: string;
  url: string;
}

/**
 * Carica immagini su Dropbox in una cartella specifica per la proprietà
 * @param propertyName Nome della proprietà per creare la cartella
 * @param files Array di file immagine da caricare
 * @param onProgress Callback opzionale per il progresso (current, total)
 * @returns Array di oggetti con info sulle immagini caricate
 */
export const uploadImagesToDropbox = async (
  propertyName: string,
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<UploadedImage[]> => {
  const client = getDropboxClient();

  if (!client) {
    throw new Error(
      "Dropbox non configurato. Aggiungi VITE_DROPBOX_ACCESS_TOKEN in .env"
    );
  }

  if (files.length === 0) {
    throw new Error("Nessun file da caricare");
  }

  if (files.length > 5) {
    throw new Error("Massimo 5 immagini consentite");
  }

  // Sanitizza il nome della proprietà per il path
  const folderName = propertyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);

  const timestamp = Date.now();
  const folderPath = `/real-estate-properties/${folderName}-${timestamp}`;

  const uploadedImages: UploadedImage[] = [];

  // Carica ogni immagine
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Notifica progresso
    if (onProgress) {
      onProgress(i, files.length);
    }

    // Valida il file
    if (!file.type.startsWith("image/")) {
      throw new Error(`${file.name} non è un'immagine valida`);
    }

    // Limite dimensione: 10MB
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`${file.name} supera il limite di 10MB`);
    }

    const fileName = `image-${i + 1}-${file.name}`;
    const filePath = `${folderPath}/${fileName}`;

    try {
      // Leggi il file usando FileReader (più affidabile di arrayBuffer())
      const fileContent = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(reader.result);
          } else {
            reject(new Error("Formato file non valido"));
          }
        };

        reader.onerror = () => {
          reject(new Error(reader.error?.message || "Errore lettura file"));
        };

        reader.onabort = () => {
          reject(new Error("Lettura file interrotta"));
        };

        reader.readAsArrayBuffer(file);
      });

      // Upload su Dropbox con timeout
      const uploadPromise = client.filesUpload({
        path: filePath,
        contents: fileContent,
        mode: { ".tag": "add" },
        autorename: true,
        mute: false,
      });

      // Timeout di 60 secondi per l'upload
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout upload (60s)")), 60000)
      );

      const response = (await Promise.race([
        uploadPromise,
        timeoutPromise,
      ])) as any;

      // Crea link condiviso
      let sharedLink: string;
      try {
        const linkResponse = await client.sharingCreateSharedLinkWithSettings({
          path: response.result.path_lower || filePath,
          settings: {
            requested_visibility: { ".tag": "public" },
          },
        });
        // Converti il link in URL diretto
        sharedLink = linkResponse.result.url
          .replace("www.dropbox.com", "dl.dropboxusercontent.com")
          .replace("?dl=0", "");
      } catch (linkError: any) {
        // Se il link esiste già, prova a recuperarlo
        if (linkError.error?.error?.[".tag"] === "shared_link_already_exists") {
          const existingLinks = await client.sharingListSharedLinks({
            path: response.result.path_lower || filePath,
          });
          sharedLink =
            existingLinks.result.links[0]?.url
              .replace("www.dropbox.com", "dl.dropboxusercontent.com")
              .replace("?dl=0", "") || "";
        } else {
          throw linkError;
        }
      }

      uploadedImages.push({
        name: fileName,
        path: response.result.path_display || filePath,
        url: sharedLink,
      });

      // Notifica progresso dopo upload completato
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error: any) {
      console.error(`Errore caricamento ${file.name}:`, error);

      // Dettagli errore più specifici
      let errorMsg = error.message || "Errore sconosciuto";

      if (error.name === "DOMException") {
        errorMsg =
          "Operazione interrotta. Prova con un'immagine più piccola o riprova.";
      }

      throw new Error(`Errore caricamento ${file.name}: ${errorMsg}`);
    }
  }

  return uploadedImages;
};

/**
 * Elimina una cartella da Dropbox
 * @param folderPath Path della cartella da eliminare
 */
export const deleteDropboxFolder = async (
  folderPath: string
): Promise<void> => {
  const client = getDropboxClient();

  if (!client) {
    throw new Error("Dropbox non configurato");
  }

  try {
    await client.filesDeleteV2({ path: folderPath });
  } catch (error: any) {
    console.error("Errore eliminazione cartella:", error);
    throw new Error(`Errore eliminazione cartella: ${error.message}`);
  }
};

/**
 * Verifica se Dropbox è configurato correttamente
 */
export const isDropboxConfigured = (): boolean => {
  return !!DROPBOX_ACCESS_TOKEN;
};

export interface DropboxDocument {
  name: string;
  path: string;
  url: string;
  size: number;
  modified: string;
  thumbnail?: string;
}

/**
 * Crea la cartella documenti per una proprietà su Dropbox
 * @param propertyName Nome della proprietà
 * @returns Path della cartella creata
 */
export const createPropertyDocumentsFolder = async (
  propertyName: string
): Promise<string> => {
  const client = getDropboxClient();

  if (!client) {
    throw new Error("Dropbox non configurato");
  }

  const sanitizedName = propertyName
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "_")
    .substring(0, 100);

  const folderPath = `/documents/${sanitizedName}`;

  try {
    // Prova a creare la cartella
    await client.filesCreateFolderV2({ path: folderPath });
    return folderPath;
  } catch (error: any) {
    // Se la cartella esiste già, va bene
    if (
      error.error?.error?.[".tag"] === "path" &&
      error.error?.error?.path?.[".tag"] === "conflict"
    ) {
      return folderPath;
    }
    throw error;
  }
};

/**
 * Ottiene il link diretto alla cartella documenti su Dropbox
 * @param propertyName Nome della proprietà
 * @returns URL per aprire Dropbox nella cartella specifica
 */
export const getDropboxFolderLink = async (
  propertyName: string
): Promise<string> => {
  const client = getDropboxClient();

  if (!client) {
    throw new Error("Dropbox non configurato");
  }

  const sanitizedName = propertyName
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "_")
    .substring(0, 100);

  const folderPath = `/documents/${sanitizedName}`;

  try {
    // Assicurati che la cartella esista
    await createPropertyDocumentsFolder(propertyName);

    // Crea un link condiviso alla cartella
    const response = await client.sharingCreateSharedLinkWithSettings({
      path: folderPath,
      settings: {
        requested_visibility: { ".tag": "public" },
        audience: { ".tag": "public" },
        access: { ".tag": "viewer" },
      },
    });

    return response.result.url;
  } catch (error: any) {
    // Se il link esiste già, recuperalo
    if (error.error?.error?.[".tag"] === "shared_link_already_exists") {
      const linksResponse = await client.sharingListSharedLinks({
        path: folderPath,
      });

      if (linksResponse.result.links.length > 0) {
        return linksResponse.result.links[0].url;
      }
    }

    throw new Error(`Errore creazione link: ${error.message}`);
  }
};

/**
 * Elenca tutti i documenti nella cartella di una proprietà
 * @param propertyName Nome della proprietà
 * @returns Array di documenti
 */
export const listPropertyDocuments = async (
  propertyName: string
): Promise<DropboxDocument[]> => {
  const client = getDropboxClient();

  if (!client) {
    throw new Error("Dropbox non configurato");
  }

  const sanitizedName = propertyName
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "_")
    .substring(0, 100);

  const folderPath = `/documents/${sanitizedName}`;

  try {
    const response = await client.filesListFolder({ path: folderPath });

    const documents: DropboxDocument[] = [];

    for (const entry of response.result.entries) {
      if (entry[".tag"] === "file") {
        // Ottieni link condiviso per il file
        let fileUrl = "";
        try {
          const linkResponse = await client.sharingCreateSharedLinkWithSettings(
            {
              path: entry.path_display || "",
              settings: {
                requested_visibility: { ".tag": "public" },
                audience: { ".tag": "public" },
                access: { ".tag": "viewer" },
              },
            }
          );
          fileUrl = linkResponse.result.url.replace("?dl=0", "?dl=1");
        } catch (linkError: any) {
          // Link già esistente
          if (
            linkError.error?.error?.[".tag"] === "shared_link_already_exists"
          ) {
            const existingLinks = await client.sharingListSharedLinks({
              path: entry.path_display || "",
            });
            if (existingLinks.result.links.length > 0) {
              fileUrl = existingLinks.result.links[0].url.replace(
                "?dl=0",
                "?dl=1"
              );
            }
          }
        }

        // Ottieni thumbnail se è un'immagine o PDF
        let thumbnail: string | undefined;
        const ext = entry.name.toLowerCase().split(".").pop();
        if (
          ext &&
          ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"].includes(ext)
        ) {
          try {
            const thumbResponse = await client.filesGetThumbnailV2({
              resource: {
                ".tag": "path",
                path: entry.path_display || "",
              },
              format: { ".tag": "jpeg" },
              size: { ".tag": "w256h256" },
            });

            // Converti il blob in data URL
            const blob = (thumbResponse.result as any).fileBlob;
            if (blob) {
              const reader = new FileReader();
              thumbnail = await new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            }
          } catch (thumbError) {
            // Thumbnail non disponibile
            console.log("Thumbnail non disponibile per", entry.name);
          }
        }

        documents.push({
          name: entry.name,
          path: entry.path_display || "",
          url: fileUrl,
          size: (entry as any).size || 0,
          modified: (entry as any).client_modified || "",
          thumbnail,
        });
      }
    }

    return documents;
  } catch (error: any) {
    // Se la cartella non esiste, ritorna array vuoto
    if (error.error?.error?.[".tag"] === "path") {
      return [];
    }
    throw new Error(`Errore lettura documenti: ${error.message}`);
  }
};
