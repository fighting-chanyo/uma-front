'use server';

import { createClient } from '@/lib/supabase/server';
import { setIpatSession, getIpatSession, hasIpatSession, IpatAuthData } from '@/lib/ipat-auth';

function resolveIpatSyncApiUrl(): string {
  const explicit = process.env.IPAT_SYNC_API_URL;
  if (explicit && explicit.trim().length > 0) {
    return explicit;
  }

  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base && base.trim().length > 0) {
    return new URL('/api/sync/ipat', base).toString();
  }

  throw new Error('Missing env: set IPAT_SYNC_API_URL or NEXT_PUBLIC_API_URL');
}

export async function saveIpatAuth(data: IpatAuthData) {
  await setIpatSession(data);
  return { success: true };
}

export async function checkIpatAuth() {
  return await hasIpatSession();
}

export async function syncIpat(mode: 'today' | 'past') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const ipatAuth = await getIpatSession();
  if (!ipatAuth) {
    return { success: false, error: 'No IPAT authentication data found' };
  }

  let logId: string | null = null;

  try {
    const apiUrl = resolveIpatSyncApiUrl();
    const backendMode = mode === 'today' ? 'recent' : 'past';

    // 1. sync_logs にレコード作成
    const { data: log, error: logError } = await supabase
      .from('sync_logs')
      .insert({
        user_id: user.id,
        status: 'PROCESSING',
        mode: mode,
        message: `Requested mode: ${mode}`,
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create sync log:', logError);
      return { success: false, error: 'Failed to create sync log' };
    }
    
    logId = log.id;

    // 2. Cloud Run API 呼び出し
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        log_id: log.id,
        user_id: user.id,
        ipat_auth: ipatAuth,
        // NOTE: バックエンド側が「recent/past」名を期待する場合に備え、today→recentへ変換
        mode: backendMode,
        // デバッグ/後方互換用（バックエンドが today/past を期待している場合はこれを参照できる）
        client_mode: mode,
      }),
    });

    if (!response.ok) {
      // API呼び出し失敗時はログを更新
      await supabase
        .from('sync_logs')
        .update({ status: 'ERROR', message: `API Error: ${response.status} ${response.statusText} (${apiUrl})` })
        .eq('id', log.id);
      
      return { success: false, error: `API request failed: ${response.statusText}` };
    }

    return { success: true, logId: log.id };

  } catch (error) {
    console.error('Sync error:', error);
    
    // システムエラー時もログを更新
    if (logId) {
      await supabase
        .from('sync_logs')
        .update({ 
          status: 'ERROR', 
          message: `System Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
        })
        .eq('id', logId);
    }

    return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
  }
}
