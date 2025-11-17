import { useEffect, useState } from "react";
import {
  geocodingService,
  type Coordinates,
  type PointOfInterest,
} from "../services/geocoding";

interface PropertyMapProps {
  address: string;
  propertyName: string;
}

export const PropertyMap = ({ address, propertyName }: PropertyMapProps) => {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadLocationData();
  }, [address]);

  const loadLocationData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Geocode the address
      const location = await geocodingService.geocodeAddress(address);

      if (!location) {
        setError("Could not find location for this address");
        setLoading(false);
        return;
      }

      setCoordinates({ lat: location.lat, lon: location.lon });

      // Find nearby POIs (within 1km)
      const nearbyPOIs = await geocodingService.findNearbyPOIs(
        { lat: location.lat, lon: location.lon },
        1000
      );

      setPois(nearbyPOIs);
    } catch (err) {
      console.error("Error loading location data:", err);
      setError("Failed to load location data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📍 Location & Nearby Amenities</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !coordinates) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📍 Location & Nearby Amenities</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || "Location not available"}</p>
        </div>
      </div>
    );
  }

  const categorizedPOIs = geocodingService.categorizePOIs(pois);
  const filteredPOIs =
    selectedCategory === "all" ? pois : categorizedPOIs[selectedCategory] || [];

  // Icon mapping for POI types
  const getIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      station: "🚇",
      stop_position: "🚌",
      platform: "🚏",
      restaurant: "🍽️",
      cafe: "☕",
      bar: "🍺",
      bank: "🏦",
      atm: "💳",
      pharmacy: "💊",
      hospital: "🏥",
      school: "🏫",
      university: "🎓",
      supermarket: "🛒",
      convenience: "🏪",
      mall: "🏬",
      parking: "🅿️",
      park: "🌳",
      playground: "🎪",
      fitness_centre: "💪",
      sports_centre: "⚽",
    };

    return iconMap[type.toLowerCase()] || "📍";
  };

  const getCategoryIcon = (category: string): string => {
    const categoryIcons: Record<string, string> = {
      transit: "🚇",
      shopping: "🛒",
      dining: "🍽️",
      healthcare: "🏥",
      education: "🎓",
      leisure: "🌳",
      other: "📍",
    };

    return categoryIcons[category] || "📍";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          📍 Location & Nearby Amenities
        </h3>
        <p className="text-gray-600 text-sm">{address}</p>
      </div>

      {/* OpenStreetMap Embed */}
      <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lon - 0.01},${coordinates.lat - 0.01},${coordinates.lon + 0.01},${coordinates.lat + 0.01}&layer=mapnik&marker=${coordinates.lat},${coordinates.lon}`}
          style={{ border: 0 }}
        ></iframe>
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2">
          <a
            href={`https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lon}#map=15/${coordinates.lat}/${coordinates.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            View Larger Map
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
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Filter by Category</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({pois.length})
          </button>
          {Object.entries(categorizedPOIs).map(([category, categoryPOIs]) => {
            if (categoryPOIs.length === 0) return null;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)} (
                {categoryPOIs.length})
              </button>
            );
          })}
        </div>
      </div>

      {/* Points of Interest List */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">
          Nearby Locations ({filteredPOIs.length})
        </h4>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredPOIs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No {selectedCategory !== "all" ? selectedCategory : ""} locations found nearby</p>
            </div>
          ) : (
            filteredPOIs.slice(0, 20).map((poi, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{getIcon(poi.type)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{poi.name}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {poi.type.replace(/_/g, " ")}
                      </p>
                      {poi.tags.operator && (
                        <p className="text-xs text-gray-500">
                          Operator: {poi.tags.operator}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">
                      {geocodingService.formatDistance(poi.distance)}
                    </p>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${poi.coordinates.lat}&mlon=${poi.coordinates.lon}#map=18/${poi.coordinates.lat}/${poi.coordinates.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-blue-600"
                    >
                      View
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        {Object.entries(categorizedPOIs).map(([category, categoryPOIs]) => {
          if (categoryPOIs.length === 0 || category === "other") return null;
          const nearest = categoryPOIs[0];
          return (
            <div key={category} className="text-center">
              <div className="text-2xl mb-1">{getCategoryIcon(category)}</div>
              <div className="text-sm font-medium text-gray-900 capitalize">
                {category}
              </div>
              <div className="text-xs text-gray-600">
                Nearest: {nearest ? geocodingService.formatDistance(nearest.distance) : "N/A"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
