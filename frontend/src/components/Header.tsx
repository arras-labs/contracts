import type { WalletState } from "../types";
import { NETWORK_NAME } from "../utils/constants";

interface HeaderProps {
  walletState: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const Header = ({
  walletState,
  onConnect,
  onDisconnect,
}: HeaderProps) => {
  return (
    <header className="bg-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Real Estate DApp
              </h1>
              <p className="text-sm text-gray-600">Powered by Polygon</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {walletState.isConnected ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Rete</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {NETWORK_NAME}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Saldo</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {walletState.balance
                      ? parseFloat(walletState.balance).toFixed(4)
                      : "0"}{" "}
                    ETH
                  </p>
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <p className="text-sm text-gray-600">Account</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">
                    {walletState.account?.slice(0, 6)}...
                    {walletState.account?.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={onDisconnect}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
                >
                  Disconnetti
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Connetti Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
