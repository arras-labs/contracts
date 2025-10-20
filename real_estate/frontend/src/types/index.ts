export interface Property {
  id: bigint;
  name: string;
  description: string;
  location: string;
  price: bigint;
  area: bigint;
  owner: string;
  isForSale: boolean;
  imageUrl: string;
  listedTimestamp: bigint;
}

export interface WalletState {
  account: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
}
