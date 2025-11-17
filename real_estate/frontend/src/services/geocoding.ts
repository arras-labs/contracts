/**
 * Geocoding Service - Convert addresses to coordinates and find nearby amenities
 * Uses Nominatim (OpenStreetMap) - Free and open-source
 */

const NOMINATIM_API = "https://nominatim.openstreetmap.org";
const OVERPASS_API = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "ArrasLabs-RealEstate/2.0";

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeocodedLocation extends Coordinates {
  display_name: string;
  address: {
    city?: string;
    country?: string;
    state?: string;
    postcode?: string;
    road?: string;
  };
  boundingbox: [string, string, string, string]; // [south, north, west, east]
}

export interface PointOfInterest {
  type: string;
  name: string;
  distance: number; // in meters
  coordinates: Coordinates;
  tags: Record<string, string>;
}

class GeocodingService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodedLocation | null> {
    const cacheKey = `geocode_${address}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const url = `${NOMINATIM_API}/search?format=json&q=${encodeURIComponent(
        address
      )}&addressdetails=1&limit=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.length === 0) {
        console.warn(`No results found for address: ${address}`);
        return null;
      }

      const result: GeocodedLocation = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name,
        address: data[0].address || {},
        boundingbox: data[0].boundingbox,
      };

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error("Error geocoding address:", error);
      return null;
    }
  }

  /**
   * Find nearby points of interest
   */
  async findNearbyPOIs(
    coordinates: Coordinates,
    radiusMeters: number = 1000
  ): Promise<PointOfInterest[]> {
    const cacheKey = `poi_${coordinates.lat}_${coordinates.lon}_${radiusMeters}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Overpass QL query for nearby amenities
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"~"^(restaurant|cafe|bar|bank|atm|pharmacy|hospital|school|university|supermarket|parking)$"](around:${radiusMeters},${coordinates.lat},${coordinates.lon});
          node["public_transport"~"^(station|stop_position|platform)$"](around:${radiusMeters},${coordinates.lat},${coordinates.lon});
          node["shop"~"^(supermarket|convenience|mall)$"](around:${radiusMeters},${coordinates.lat},${coordinates.lon});
          node["leisure"~"^(park|playground|fitness_centre|sports_centre)$"](around:${radiusMeters},${coordinates.lat},${coordinates.lon});
        );
        out body;
      `;

      const response = await fetch(OVERPASS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();

      const pois: PointOfInterest[] = data.elements.map((element: any) => {
        const distance = this.calculateDistance(
          coordinates.lat,
          coordinates.lon,
          element.lat,
          element.lon
        );

        return {
          type: element.tags.amenity || element.tags.public_transport || element.tags.shop || element.tags.leisure,
          name: element.tags.name || "Unnamed",
          distance: Math.round(distance),
          coordinates: { lat: element.lat, lon: element.lon },
          tags: element.tags,
        };
      });

      // Sort by distance
      pois.sort((a, b) => a.distance - b.distance);

      this.cache.set(cacheKey, { data: pois, timestamp: Date.now() });

      return pois;
    } catch (error) {
      console.error("Error finding nearby POIs:", error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get nearby transit stations specifically
   */
  async getNearbyTransit(
    coordinates: Coordinates,
    radiusMeters: number = 1000
  ): Promise<PointOfInterest[]> {
    const pois = await this.findNearbyPOIs(coordinates, radiusMeters);
    return pois.filter((poi) =>
      ["station", "stop_position", "platform"].includes(poi.type)
    );
  }

  /**
   * Categorize POIs by type
   */
  categorizePOIs(pois: PointOfInterest[]): Record<string, PointOfInterest[]> {
    const categories: Record<string, PointOfInterest[]> = {
      transit: [],
      shopping: [],
      dining: [],
      healthcare: [],
      education: [],
      leisure: [],
      other: [],
    };

    pois.forEach((poi) => {
      const type = poi.type.toLowerCase();

      if (["station", "stop_position", "platform"].includes(type)) {
        categories.transit.push(poi);
      } else if (["supermarket", "convenience", "mall", "shop"].includes(type)) {
        categories.shopping.push(poi);
      } else if (["restaurant", "cafe", "bar"].includes(type)) {
        categories.dining.push(poi);
      } else if (["pharmacy", "hospital"].includes(type)) {
        categories.healthcare.push(poi);
      } else if (["school", "university"].includes(type)) {
        categories.education.push(poi);
      } else if (["park", "playground", "fitness_centre", "sports_centre"].includes(type)) {
        categories.leisure.push(poi);
      } else {
        categories.other.push(poi);
      }
    });

    return categories;
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${meters}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();
