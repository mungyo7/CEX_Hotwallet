export interface WalletData {
  id?: number;
  symbol: string;
  chain: string;
  contract_address: string;
  wallet_address: string;
  wallet_name: string;
  amount?: number;
  usd_value?: number;
  error?: string;
  created_at?: string;
}

export interface CoinData {
  symbol: string;
  wallets: WalletData[];
  total?: {
    amount: number;
    usd_value: number;
  };
} 