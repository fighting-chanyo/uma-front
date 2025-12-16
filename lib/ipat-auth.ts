import 'server-only';
import { cookies } from 'next/headers';
import { encrypt, decrypt } from '@/lib/crypto';

const COOKIE_NAME = process.env.NODE_ENV === 'production' 
  ? '__Secure-ipat-session' 
  : 'ipat-session';

export interface IpatAuthData {
  inet_id: string;
  subscriber_number: string;
  pars_number: string;
  password: string;
}

export async function setIpatSession(authData: IpatAuthData) {
  const cookieStore = await cookies();
  const encryptedData = encrypt(JSON.stringify(authData));

  // 現在時刻(JST)を取得
  const nowJST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  
  // 今日の終わり(JST 23:59:59)を設定
  const endOfTodayJST = new Date(nowJST);
  endOfTodayJST.setHours(23, 59, 59, 999);
  
  // 有効期限までの秒数を計算
  const maxAge = Math.floor((endOfTodayJST.getTime() - nowJST.getTime()) / 1000);

  cookieStore.set(COOKIE_NAME, encryptedData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: maxAge > 0 ? maxAge : 0,
    path: '/',
  });
}

export async function getIpatSession(): Promise<IpatAuthData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;

  try {
    const json = decrypt(cookie.value);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export async function clearIpatSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function hasIpatSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(COOKIE_NAME);
}
