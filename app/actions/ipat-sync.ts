'use server';

import { createClient } from '@/lib/supabase/server';
import { setIpatSession, getIpatSession, hasIpatSession, IpatAuthData } from '@/lib/ipat-auth';

// Cloud Run APIのエンドポイント（環境変数から取得推奨）
const API_URL = process.env.IPAT_SYNC_API_URL || 'http://localhost:8000/api/sync/ipat';

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
    // 1. sync_logs にレコード作成
    const { data: log, error: logError } = await supabase
      .from('sync_logs')
      .insert({
        user_id: user.id,
        status: 'PROCESSING',
        mode: mode,
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create sync log:', logError);
      return { success: false, error: 'Failed to create sync log' };
    }
    
    logId = log.id;

    // 2. Cloud Run API 呼び出し
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        log_id: log.id,
        user_id: user.id,
        ipat_auth: ipatAuth,
        mode: mode, // API側で対応が必要な場合に使用
      }),
    });

    if (!response.ok) {
      // API呼び出し失敗時はログを更新
      await supabase
        .from('sync_logs')
        .update({ status: 'ERROR', message: `API Error: ${response.statusText}` })
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

    return { success: false, error: 'Internal server error' };
  }
}
