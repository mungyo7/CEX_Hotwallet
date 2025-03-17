import supabase from '../utils/supabase';
import { WalletData, CoinData } from '../types';
import axios from 'axios';

// 코인 심볼로 hotwallet 테이블에서 데이터 검색
export async function getWalletsByCoin(symbol: string): Promise<WalletData[]> {
  console.log('검색하는 심볼:', symbol.toUpperCase());
  
  try {
    const { data, error } = await supabase
      .from('hotwallet')
      .select('*')
      .eq('symbol', symbol.toUpperCase());
    
    console.log('쿼리 응답:', { data, error });
    
    if (error) {
      console.error('Supabase 쿼리 오류:', error);
      throw new Error(`지갑 데이터를 가져오는 데 문제가 발생했습니다: ${error.message}`);
    }
    
    return data || [];
  } catch (err) {
    console.error('Wallet 서비스 예외:', err);
    throw err;
  }
}

// 새 지갑 주소 추가
export async function addWalletAddress(walletData: {
  symbol: string;
  chain: string;
  contract_address: string;
  wallet_address: string;
  wallet_name?: string;
}): Promise<WalletData> {
  try {
    const dataToInsert = {
      ...walletData,
      wallet_name: walletData.wallet_name?.trim() || '-'
    };
    
    const response = await axios.post('/api/add-wallet', dataToInsert);
    return response.data.wallet;
  } catch (err) {
    console.error('지갑 추가 서비스 예외:', err);
    if (axios.isAxiosError(err) && err.response) {
      throw new Error(err.response.data.error || '지갑 추가 실패');
    }
    throw err;
  }
}

// 실제 블록체인에서 지갑 잔액 정보 가져오기
export async function fetchWalletBalances(wallets: WalletData[]): Promise<WalletData[]> {
  if (!wallets || wallets.length === 0) return [];
  
  try {
    const response = await axios.post('/api/wallet-balance', { wallets });
    return response.data.wallets;
  } catch (error) {
    console.error('블록체인 잔액 조회 오류:', error);
    // 오류 발생 시에도 기존 지갑 정보 반환 (잔액 필드에 오류 표시)
    return wallets.map(wallet => ({
      ...wallet,
      amount: 0,
      usd_value: 0,
      error: '잔액 조회 실패'
    }));
  }
}

// 코인의 총 정보 가져오기 (잔액 + 금액 합계)
export async function getCoinSummary(symbol: string): Promise<CoinData | null> {
  try {
    // 1. Supabase에서 지갑 목록 가져오기
    const wallets = await getWalletsByCoin(symbol);
    
    if (wallets.length === 0) {
      return null;
    }
    
    // 2. 블록체인에서 실제 잔액 조회
    const walletsWithBalances = await fetchWalletBalances(wallets);
    
    // 3. 총합 계산
    const totalAmount = walletsWithBalances.reduce((sum, wallet) => sum + (wallet.amount || 0), 0);
    const totalUsdValue = walletsWithBalances.reduce((sum, wallet) => sum + (wallet.usd_value || 0), 0);
    
    return {
      symbol: symbol.toUpperCase(),
      wallets: walletsWithBalances,
      total: {
        amount: totalAmount,
        usd_value: totalUsdValue
      }
    };
  } catch (error) {
    console.error('코인 요약 정보 조회 오류:', error);
    throw error;
  }
} 