import { createClient } from '@supabase/supabase-js';

// 연결 문제 디버깅을 위한 코드 추가
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 환경 변수가 제대로 로드되었는지 확인 (개발용)
console.log('Supabase URL exists:', !!supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log(supabaseUrl, supabaseAnonKey);
export default supabase; 