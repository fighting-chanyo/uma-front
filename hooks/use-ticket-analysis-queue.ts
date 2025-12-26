import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AnalysisQueueItem } from '@/types/analysis';
import { analyzeTicketQueue } from '@/app/actions/ticket-analysis';

export interface AnalysisQueueItemWithUrl extends AnalysisQueueItem {
  publicUrl: string;
}

export function useTicketAnalysisQueue() {
  const [queueItems, setQueueItems] = useState<AnalysisQueueItemWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getPublicUrl = (path: string, status: string) => {
    if (path.startsWith('http')) {
      return path;
    }
    if (status === 'completed') {
      return `https://storage.googleapis.com/jra-ipat-scraper-images/archive/${path}`;
    }
    return supabase.storage.from('ticket-images').getPublicUrl(path).data.publicUrl;
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let disposed = false;

    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user?.id ?? null;
    };

    const fetchQueue = async (userId: string) => {
      const { data, error } = await supabase
        .from('analysis_queue')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching queue:', error);
        return;
      }

      const itemsWithUrl = (data as AnalysisQueueItem[]).map((item) => ({
        ...item,
        publicUrl: getPublicUrl(item.image_path, item.status),
      }));
      setQueueItems(itemsWithUrl);

      // 自動Kick: pending状態のものがあれば再実行
      itemsWithUrl.forEach((item) => {
        if (item.status === 'pending') {
          console.log(`[AutoKick] Restarting pending job: ${item.id}`);
          analyzeTicketQueue(item.id).catch((e) => console.error(`[AutoKick] Failed to restart job ${item.id}:`, e));
        }
      });
    };

    const init = async () => {
      try {
        const userId = await getUserId();
        if (!userId) {
          setIsLoading(false);
          return;
        }

        await fetchQueue(userId);
        if (disposed) return;

        channel = supabase
          .channel(`analysis_queue_changes:${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'analysis_queue',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                const newItem = payload.new as AnalysisQueueItem;
                setQueueItems((prev) => [{ ...newItem, publicUrl: getPublicUrl(newItem.image_path, newItem.status) }, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                const updatedItem = payload.new as AnalysisQueueItem;
                setQueueItems((prev) =>
                  prev.map((item) =>
                    item.id === updatedItem.id
                      ? { ...updatedItem, publicUrl: getPublicUrl(updatedItem.image_path, updatedItem.status) }
                      : item
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                const deletedId = (payload.old as any)?.id as string | undefined;
                if (!deletedId) return;
                setQueueItems((prev) => prev.filter((item) => item.id !== deletedId));
              }
            }
          )
          .subscribe();
      } finally {
        setIsLoading(false);
      }
    };

    init();

    const refreshOnResume = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      const userId = await getUserId();
      if (!userId) return;
      await fetchQueue(userId);
    };

    document.addEventListener('visibilitychange', refreshOnResume);
    window.addEventListener('focus', refreshOnResume);
    window.addEventListener('online', refreshOnResume);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', refreshOnResume);
      window.removeEventListener('focus', refreshOnResume);
      window.removeEventListener('online', refreshOnResume);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return { queueItems, isLoading };
}
