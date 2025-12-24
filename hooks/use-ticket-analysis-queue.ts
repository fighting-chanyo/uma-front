import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AnalysisQueueItem } from '@/types/analysis';

export interface AnalysisQueueItemWithUrl extends AnalysisQueueItem {
  publicUrl: string;
}

export function useTicketAnalysisQueue() {
  const [queueItems, setQueueItems] = useState<AnalysisQueueItemWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getPublicUrl = (path: string) => {
    return supabase.storage.from('ticket-images').getPublicUrl(path).data.publicUrl;
  };

  useEffect(() => {
    const fetchQueue = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('analysis_queue')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching queue:', error);
      } else {
        const itemsWithUrl = (data as AnalysisQueueItem[]).map(item => ({
          ...item,
          publicUrl: getPublicUrl(item.image_path)
        }));
        setQueueItems(itemsWithUrl);
      }
      setIsLoading(false);
    };

    fetchQueue();

    // Realtime subscription
    const channel = supabase
      .channel('analysis_queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_queue',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as AnalysisQueueItem;
            setQueueItems((prev) => [{ ...newItem, publicUrl: getPublicUrl(newItem.image_path) }, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as AnalysisQueueItem;
            setQueueItems((prev) =>
              prev.map((item) =>
                item.id === updatedItem.id ? { ...updatedItem, publicUrl: getPublicUrl(updatedItem.image_path) } : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setQueueItems((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { queueItems, isLoading };
}
