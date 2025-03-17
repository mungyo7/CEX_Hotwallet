import { NextResponse } from 'next/server';
import supabase from '@/app/utils/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, chain, contract_address, wallet_address, wallet_name } = body;
    
    // 입력값 검증
    if (!symbol || !chain || !wallet_address) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 });
    }
    
    // 서버 측에서 RLS 우회하여 데이터 추가
    const { data, error } = await supabase
      .from('hotwallet')
      .insert([{ 
        symbol, 
        chain, 
        contract_address, 
        wallet_address,
        wallet_name: wallet_name || '-' // 이름 없으면 기본값 설정
      }])
      .select()
      .single();
    
    if (error) {
      console.error('지갑 추가 오류:', error);
      return NextResponse.json({ error: `지갑 추가 실패: ${error.message}` }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, wallet: data });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
} 