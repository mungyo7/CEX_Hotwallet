
# 암호화폐 지갑 모니터 프로젝트

이 프로젝트는 여러 블록체인 네트워크에서 암호화폐 지갑의 잔액을 모니터링하는 웹 애플리케이션입니다.

## 주요 기능

- 다양한 블록체인 네트워크에서 ERC20 토큰 잔액 조회
- 여러 지갑 주소 통합 관리
- 토큰 가격 조회 및 USD 가치 계산
- 새로운 지갑 주소 추가 기능
- 모바일 친화적인 반응형 디자인

## 지원하는 블록체인 네트워크

- Ethereum (ETH)
- Base (BASE)
- Arbitrum (ARB)
- BNB Smart Chain (BSC)

## 기술 스택

- **프론트엔드**: Next.js, React, TypeScript
- **백엔드**: Next.js API Routes
- **데이터베이스**: Supabase
- **블록체인 상호작용**: ethers.js
- **스타일링**: CSS/Tailwind CSS
```
## 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```
# Supabase 
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\n
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Infura 또는 다른 RPC 제공자 URL (블록체인 네트워크 접근용)
INFURA_URL_ETH=https://mainnet.infura.io/v3/your-infura-key
INFURA_URL_BASE=https://base-mainnet.infura.io/v3/your-infura-key
INFURA_URL_ARB=https://arbitrum-mainnet.infura.io/v3/your-infura-key
INFURA_URL_BSC=https://bsc-mainnet.infura.io/v3/your-infura-key

```

