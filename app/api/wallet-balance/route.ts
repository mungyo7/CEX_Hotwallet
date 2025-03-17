import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import axios from 'axios';

// ERC20 토큰 ABI (balanceOf, decimals, symbol 함수 포함)
const ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  }
];

// RPC URL 설정
const RPC_URLS: { [key: string]: string } = {
  ETH: process.env.INFURA_URL_ETH || 'https://mainnet.infura.io/v3/your-infura-key',
  BASE: process.env.INFURA_URL_BASE || 'https://mainnet.base.org',
  ARB: process.env.INFURA_URL_ARB || 'https://arbitrum-mainnet.infura.io/v3/your-infura-key',
  OP: process.env.INFURA_URL_OP || 'https://optimism-mainnet.infura.io/v3/your-infura-key',
  POL: process.env.INFURA_URL_POL || 'https://polygon-mainnet.infura.io/v3/your-infura-key',
  AVAX: process.env.INFURA_URL_AVAX || 'https://avalanche-mainnet.infura.io/v3/your-infura-key',
  BSC: process.env.INFURA_URL_BSC || 'https://bsc-mainnet.infura.io/v3/your-infura-key',
  STARK: process.env.INFURA_URL_STARK || 'https://starknet-mainnet.infura.io/v3/your-infura-key',
  MANTLE: process.env.INFURA_URL_MANTLE || 'https://mantle-mainnet.infura.io/v3/your-infura-key',
  LINEA: process.env.INFURA_URL_LINEA || 'https://linea-mainnet.infura.io/v3/your-infura-key',
};
console.log(RPC_URLS);
// 체인별 프로바이더 가져오기
function getProvider(chain: string) {
  const url = RPC_URLS[chain.toUpperCase()];
  if (!url) {
    throw new Error(`지원하지 않는 체인입니다: ${chain}`);
  }
  return new ethers.JsonRpcProvider(url);
}

// 토큰 가격 조회
async function getTokenPrice(symbol: string): Promise<number | null> {
  try {
    const response = await axios.get('https://api.mexc.com/api/v3/ticker/price', {
      params: { symbol: `${symbol}USDT` }
    });
    
    if (response.data && response.data.price) {
      return parseFloat(response.data.price);
    }
    
    // MEXC에 없는 경우 다른 API 시도
    const coinGeckoResponse = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (coinGeckoResponse.data && coinGeckoResponse.data[symbol.toLowerCase()]) {
      return coinGeckoResponse.data[symbol.toLowerCase()].usd;
    }
    
    return null;
  } catch (error) {
    console.error('가격 조회 오류:', error);
    return null;
  }
}

// 토큰 잔액 조회
async function getTokenBalance(walletAddress: string, tokenAddress: string, chain: string) {
  try {
    const provider = getProvider(chain);
    const tokenContract = new ethers.Contract(tokenAddress, ABI, provider);
    
    const symbol = await tokenContract.symbol();
    const decimals = await tokenContract.decimals();
    const balance = await tokenContract.balanceOf(walletAddress);
    
    const actualBalance = parseFloat(ethers.formatUnits(balance, decimals));
    
    return {
      symbol,
      balance: actualBalance,
      decimals: Number(decimals)
    };
  } catch (error) {
    console.error('잔액 조회 오류:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallets } = body;
    
    if (!wallets || !Array.isArray(wallets)) {
      return NextResponse.json({ error: '올바른 지갑 데이터가 필요합니다' }, { status: 400 });
    }
    
    const results = [];
    let totalBalance = 0;
    let tokenPrice = null;
    let firstSymbol = '';
    
    for (const wallet of wallets) {
      try {
        const { wallet_address, contract_address, chain, symbol } = wallet;
        
        // 첫 번째 토큰의 가격만 조회 (모든 지갑이 같은 토큰을 가지고 있다고 가정)
        if (tokenPrice === null) {
          firstSymbol = symbol;
          tokenPrice = await getTokenPrice(symbol);
        }
        
        const balanceInfo = await getTokenBalance(wallet_address, contract_address, chain);
        const balance = balanceInfo.balance;
        totalBalance += balance;
        
        const usdValue = tokenPrice ? balance * tokenPrice : null;
        
        results.push({
          ...wallet,
          amount: balance,
          usd_value: usdValue
        });
      } catch (error) {
        console.error(`지갑 ${wallet.wallet_address} 처리 중 오류:`, error);
        results.push({
          ...wallet,
          amount: 0,
          usd_value: 0,
          error: '잔액 조회 실패'
        });
      }
    }
    
    return NextResponse.json({
      wallets: results,
      total: {
        symbol: firstSymbol,
        balance: totalBalance,
        price: tokenPrice,
        usd_value: tokenPrice ? totalBalance * tokenPrice : null
      }
    });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
} 