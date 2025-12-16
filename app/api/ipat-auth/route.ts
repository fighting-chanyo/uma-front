import { getIpatSession } from '@/lib/ipat-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const ipatAuth = await getIpatSession();
    if (!ipatAuth) {
        // 認証情報が見つからない場合も正常なレスポンスとして扱う
        return NextResponse.json({ ipatAuth: null });
    }
    return NextResponse.json({ ipatAuth });
  } catch (error) {
    console.error('API Error fetching IPAT auth:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}