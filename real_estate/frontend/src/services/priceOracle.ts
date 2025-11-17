/**
 * Price Oracle Service - Real-time cryptocurrency price fetching
 * Uses CoinGecko API (free tier) for ETH/USD conversion
 */

const COINGECKO_API = "https://api.coingecko.com/api/v3";
const CACHE_DURATION = 60 * 1000; // 1 minute cache

interface PriceData {
  usd: number;
  usd_24h_change: number;
  last_updated: number;
}

class PriceOracle {
  private cache: Map<string, { data: PriceData; timestamp: number }> =
    new Map();

  /**
   * Fetch current ETH/USD price from CoinGecko
   */
  async getETHPrice(): Promise<PriceData> {
    const cacheKey = "eth_usd";
    const cached = this.cache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      const priceData: PriceData = {
        usd: data.ethereum.usd,
        usd_24h_change: data.ethereum.usd_24h_change || 0,
        last_updated: data.ethereum.last_updated_at || Date.now() / 1000,
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: priceData,
        timestamp: Date.now(),
      });

      return priceData;
    } catch (error) {
      console.error("Error fetching ETH price:", error);

      // Return fallback price if API fails
      const fallbackPrice: PriceData = {
        usd: 2000, // Fallback to conservative estimate
        usd_24h_change: 0,
        last_updated: Date.now() / 1000,
      };

      return fallbackPrice;
    }
  }

  /**
   * Convert USD amount to ETH
   */
  async convertUSDToETH(usdAmount: number): Promise<number> {
    const priceData = await this.getETHPrice();
    return usdAmount / priceData.usd;
  }

  /**
   * Convert ETH amount to USD
   */
  async convertETHToUSD(ethAmount: number): Promise<number> {
    const priceData = await this.getETHPrice();
    return ethAmount * priceData.usd;
  }

  /**
   * Get formatted price string
   */
  async getFormattedPrice(): Promise<string> {
    const priceData = await this.getETHPrice();
    return `$${priceData.usd.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Calculate token price in ETH based on USD price
   */
  async calculateTokenPriceETH(tokenPriceUSD: number): Promise<string> {
    const ethAmount = await this.convertUSDToETH(tokenPriceUSD);
    return ethAmount.toFixed(6); // Return as string with 6 decimals
  }

  /**
   * Get 24h price change percentage
   */
  async getPriceChange(): Promise<number> {
    const priceData = await this.getETHPrice();
    return priceData.usd_24h_change;
  }
}

// Export singleton instance
export const priceOracle = new PriceOracle();

// Export type for external use
export type { PriceData };
