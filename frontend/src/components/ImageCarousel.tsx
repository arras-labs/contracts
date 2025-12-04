import { useState } from "react";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  showControls?: boolean;
}

export const ImageCarousel = ({
  images,
  alt,
  showControls = false,
}: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Se non ci sono immagini, mostra placeholder
  if (images.length === 0) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <svg
          className="w-16 h-16 text-gray-400"
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
      </div>
    );
  }

  // Se c'è solo un'immagine, mostra senza controlli
  if (images.length === 1) {
    return (
      <img src={images[0]} alt={alt} className="w-full h-full object-cover" />
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full h-full group">
      {/* Immagine corrente */}
      <img
        src={images[currentIndex]}
        alt={`${alt} - ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Controlli di navigazione - visibili solo su hover su desktop, sempre visibili su mobile */}
      {(showControls || images.length > 1) && (
        <>
          {/* Freccia sinistra */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 sm:opacity-100 z-10"
            aria-label="Immagine precedente"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Freccia destra */}
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 sm:opacity-100 z-10"
            aria-label="Immagine successiva"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Indicatori (dots) - max 10 per non sovraccaricare l'UI */}
          {images.length <= 10 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? "bg-white w-8"
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Vai all'immagine ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Contatore immagini per carousel con più di 10 immagini */}
          {images.length > 10 && (
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </>
      )}
    </div>
  );
};
