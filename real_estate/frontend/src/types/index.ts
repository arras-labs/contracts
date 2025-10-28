export interface Property {
  id: bigint;
  name: string;
  description: string;
  location: string;
  totalValueUSD: bigint; // Valore totale in USD
  area: bigint;
  owner: string;
  imageUrl: string;
  listedTimestamp: bigint;
  totalTokens: bigint; // Totale token disponibili
  tokensSold: bigint; // Token già venduti
  isActive: boolean; // Pool attiva o no
  estimatedAnnualYield: bigint; // Rendimento stimato in centesimi % (500 = 5%)
}

export interface PropertyDocument {
  id: bigint;
  propertyId: bigint;
  name: string;
  documentType: string;
  ipfsHash: string;
  uploadDate: bigint;
  uploadedBy: string;
}

export interface PoolInfo {
  totalTokens: bigint;
  tokensSold: bigint;
  tokensAvailable: bigint;
  totalValueUSD: bigint;
  currentValueUSD: bigint;
  percentageComplete: bigint;
  isActive: boolean;
  investors: string[];
}

export interface Investment {
  property: Property;
  tokensOwned: bigint;
}

export interface YieldProjection {
  year: number;
  estimatedReturn: number;
  cumulativeReturn: number;
}

export interface WalletState {
  account: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
}
