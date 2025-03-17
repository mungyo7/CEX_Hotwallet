'use client';

import { useState, useEffect } from 'react';
import { WalletData, CoinData } from '@/app/types';
import { getCoinSummary, addWalletAddress } from '@/app/services/walletService';

// 지원되는 체인 목록
const SUPPORTED_CHAINS = [
  'ETH', 'BASE', 'ARB', 'BSC'
];

export default function CoinMonitor() {
  const [coinSymbol, setCoinSymbol] = useState('');
  const [coinData, setCoinData] = useState<CoinData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 새 지갑 추가를 위한 상태
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [selectedChain, setSelectedChain] = useState('');
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  
  // 새 코인 관련 상태
  const [newCoinMode, setNewCoinMode] = useState(false);
  const [contractAddress, setContractAddress] = useState('');
  
  // 모바일 감지
  const [isMobile, setIsMobile] = useState(false);
  
  // 화면 크기에 따라 모바일 상태 설정
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // 주소 표시 형식 설정
  const formatAddress = (address: string) => {
    if (!address) return '';
    if (isMobile) {
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
    return address;
  };

  // 코인 검색 함수
  const searchCoin = async () => {
    if (!coinSymbol.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setNewCoinMode(false);
    
    try {
      const cleanSymbol = coinSymbol.trim();
      
      // 코인 데이터 가져오기
      const data = await getCoinSummary(cleanSymbol);
      
      if (!data) {
        // 코인이 없는 경우 새 코인 모드 활성화
        setNewCoinMode(true);
        setCoinData({
          symbol: cleanSymbol.toUpperCase(),
          wallets: []
        });
        return;
      }
      
      setCoinData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setCoinData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 새 지갑 주소 추가 함수
  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coinData) return;
    
    // 입력값 검증
    if (!newWalletAddress.trim() || !selectedChain) {
      setError('지갑 주소와 체인 선택은 필수입니다.');
      return;
    }
    
    if (newCoinMode && !contractAddress.trim()) {
      setError('새 코인의 컨트랙트 주소는 필수입니다.');
      return;
    }
    
    setIsAddingWallet(true);
    setError(null);
    
    try {
      // 체인별 주소 형식 검증
      if (['ETH', 'BASE', 'ARB', 'OP', 'LINEA', 'MANTLE'].includes(selectedChain)) {
        if (!newWalletAddress.startsWith('0x')) {
          throw new Error(`${selectedChain} 체인의 주소는 0x로 시작해야 합니다.`);
        }
        
        if (newCoinMode && !contractAddress.startsWith('0x')) {
          throw new Error(`${selectedChain} 체인의 컨트랙트 주소는 0x로 시작해야 합니다.`);
        }
      }
      
      // 컨트랙트 주소 결정
      let contract_address = '';
      if (newCoinMode) {
        contract_address = contractAddress.trim();
      } else if (coinData.wallets.length > 0) {
        contract_address = coinData.wallets.find(w => w.chain === selectedChain)?.contract_address || 
                          coinData.wallets[0].contract_address;
      }
      
      // 새 지갑 주소 추가
      const newWallet = await addWalletAddress({
        symbol: coinData.symbol,
        chain: selectedChain,
        contract_address: contract_address,
        wallet_address: newWalletAddress.trim(),
        wallet_name: newWalletName.trim() || '-'
      });
      
      // 성공 메시지 표시 후 입력 필드 초기화
      alert('새 지갑 주소가 추가되었습니다.');
      setNewWalletAddress('');
      setNewWalletName('');
      setSelectedChain('');
      setContractAddress('');
      setNewCoinMode(false);
      
      // 목록 새로고침
      const updatedData = await getCoinSummary(coinData.symbol);
      if (updatedData) {
        setCoinData(updatedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '지갑 주소 추가 중 오류가 발생했습니다.');
    } finally {
      setIsAddingWallet(false);
    }
  };
  
  // 주소 복사 기능
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('주소가 클립보드에 복사되었습니다.'))
      .catch(err => console.error('복사 실패:', err));
  };
  
  return (
    <div className="flex flex-col gap-6 px-2 md:px-0">
      {/* 오류 메시지 표시 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded">
          {error}
        </div>
      )}
      
      {/* 코인 검색 부분 */}
      <div className="bg-white dark:bg-[#1a1a1a] p-4 md:p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-3">코인 검색</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={coinSymbol}
            onChange={(e) => setCoinSymbol(e.target.value)}
            placeholder="코인 이름 또는 심볼 입력"
            className="flex-1 p-2 border rounded dark:bg-[#2a2a2a] dark:border-[#444]"
            disabled={isLoading}
          />
          <button 
            onClick={searchCoin}
            className="bg-foreground text-background px-4 py-2 rounded hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50"
            disabled={isLoading || !coinSymbol}
          >
            {isLoading ? '검색중...' : '검색'}
          </button>
        </div>
      </div>
      
      {/* 새 코인 알림 */}
      {newCoinMode && coinData && (
        <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-200 px-4 py-3 rounded">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">
              <strong>{coinData.symbol}</strong> 코인이 아직 등록되어 있지 않습니다. 아래에서 첫 지갑 주소를 등록해주세요.
            </p>
          </div>
        </div>
      )}
      
      {/* 검색 결과 표시 - 모바일 최적화 */}
      {coinData && !newCoinMode && coinData.wallets.length > 0 && (
        <div className="bg-white dark:bg-[#1a1a1a] p-4 md:p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
            <h2 className="text-xl font-semibold">{coinData.symbol} 핫월렛 정보</h2>
            
            {coinData.total && (
              <div className="text-left md:text-right">
                <p className="text-base">총 보유량: <span className="font-bold">{coinData.total.amount.toLocaleString()} {coinData.symbol}</span></p>
                <p className="text-lg text-green-600 dark:text-green-400">
                  총 USD 가치: <span className="font-bold">${Math.floor(coinData.total.usd_value).toLocaleString()}</span>
                </p>
              </div>
            )}
          </div>
          
          {/* 데스크톱 테이블 뷰 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-[#222]">
                  <th className="p-3 text-left">지갑 이름</th>
                  <th className="p-3 text-left">체인</th>
                  <th className="p-3 text-left">컨트랙트 주소</th>
                  <th className="p-3 text-left">지갑 주소</th>
                  <th className="p-3 text-right">보유량</th>
                  <th className="p-3 text-right">USD 가치</th>
                </tr>
              </thead>
              <tbody>
                {coinData.wallets.map((wallet, index) => (
                  <tr key={index} className="border-b dark:border-[#333]">
                    <td className="p-3 font-medium">
                      {wallet.wallet_name === '-' ? 
                        <span className="text-gray-400">-</span> : 
                        wallet.wallet_name}
                    </td>
                    <td className="p-3">{wallet.chain}</td>
                    <td className="p-3 font-mono text-xs">
                      <button 
                        onClick={() => copyToClipboard(wallet.contract_address)} 
                        className="hover:underline truncate max-w-[120px] inline-block align-bottom"
                        title={wallet.contract_address}
                      >
                        {formatAddress(wallet.contract_address)}
                      </button>
                    </td>
                    <td className="p-3 font-mono text-xs">
                      <button 
                        onClick={() => copyToClipboard(wallet.wallet_address)} 
                        className="hover:underline truncate max-w-[120px] inline-block align-bottom"
                        title={wallet.wallet_address}
                      >
                        {formatAddress(wallet.wallet_address)}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      {wallet.error ? (
                        <span className="text-red-500">오류</span>
                      ) : (
                        `${wallet.amount?.toLocaleString() || '로딩중'}`
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {wallet.error ? (
                        <span className="text-red-500">오류</span>
                      ) : (
                        `$${wallet.usd_value ? Math.floor(wallet.usd_value).toLocaleString() : '로딩중'}`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 모바일 카드 뷰 */}
          <div className="md:hidden space-y-4">
            {coinData.wallets.map((wallet, index) => (
              <div key={index} className="border dark:border-[#333] rounded-lg p-3 bg-gray-50 dark:bg-[#222]">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">
                    {wallet.wallet_name === '-' ? 
                      <span className="text-gray-400">이름 없음</span> : 
                      wallet.wallet_name}
                  </div>
                  <div className="text-sm font-bold bg-gray-200 dark:bg-[#333] px-2 py-1 rounded">
                    {wallet.chain}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">컨트랙트:</div>
                    <button 
                      onClick={() => copyToClipboard(wallet.contract_address)} 
                      className="font-mono text-xs truncate hover:underline"
                      title="탭하여 복사"
                    >
                      {formatAddress(wallet.contract_address)}
                    </button>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">지갑 주소:</div>
                    <button 
                      onClick={() => copyToClipboard(wallet.wallet_address)} 
                      className="font-mono text-xs truncate hover:underline"
                      title="탭하여 복사"
                    >
                      {formatAddress(wallet.wallet_address)}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between border-t dark:border-[#444] pt-2">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">보유량</div>
                    <div className="font-semibold">
                      {wallet.error ? (
                        <span className="text-red-500">오류</span>
                      ) : (
                        `${wallet.amount?.toLocaleString() || '로딩중'}`
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">USD 가치</div>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      {wallet.error ? (
                        <span className="text-red-500">오류</span>
                      ) : (
                        `$${wallet.usd_value ? Math.floor(wallet.usd_value).toLocaleString() : '로딩중'}`
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 새 핫월렛 주소 추가 폼 - 모바일 최적화 */}
      {coinData && (
        <div className="bg-white dark:bg-[#1a1a1a] p-4 md:p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {newCoinMode ? `새 코인 ${coinData.symbol}의 첫 핫월렛 추가` : '새 핫월렛 주소 추가'}
          </h2>
          <form onSubmit={handleAddWallet} className="flex flex-col gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">지갑 주소 *</label>
                <input
                  type="text"
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  placeholder="새 지갑 주소 입력"
                  className="w-full p-2 border rounded dark:bg-[#2a2a2a] dark:border-[#444]"
                  disabled={isAddingWallet}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">지갑 이름 (선택사항)</label>
                <input
                  type="text"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder="예: Binance 14"
                  className="w-full p-2 border rounded dark:bg-[#2a2a2a] dark:border-[#444]"
                  disabled={isAddingWallet}
                />
              </div>
            </div>
            
            {/* 새 코인 모드일 때만 컨트랙트 주소 입력 필드 표시 */}
            {newCoinMode && (
              <div>
                <label className="block text-sm font-medium mb-1">컨트랙트 주소 *</label>
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="코인의 컨트랙트 주소 입력"
                  className="w-full p-2 border rounded dark:bg-[#2a2a2a] dark:border-[#444]"
                  disabled={isAddingWallet}
                  required
                />
              </div>
            )}
            
            {/* 체인 선택 부분 */}
            <div>
              <label className="block text-sm font-medium mb-2">체인 선택 *</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-2 gap-y-2">
                {SUPPORTED_CHAINS.map((chain) => (
                  <label key={chain} className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name="chain"
                      value={chain}
                      checked={selectedChain === chain}
                      onChange={() => setSelectedChain(chain)}
                      className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      disabled={isAddingWallet}
                    />
                    <span className="text-xs sm:text-sm">{chain}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button 
                type="submit"
                className="bg-foreground text-background px-4 py-2 rounded hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50"
                disabled={isAddingWallet || !newWalletAddress || !selectedChain || (newCoinMode && !contractAddress)}
              >
                {isAddingWallet ? '추가 중...' : newCoinMode ? '새 코인 등록' : '주소 추가'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 