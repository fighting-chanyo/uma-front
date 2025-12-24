import { useState } from 'react';
import { uploadTicketImage, analyzeTicketQueue } from '@/app/actions/ticket-analysis';
import { useToast } from '@/hooks/use-toast';

export function useTicketAnalysis() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadAndAnalyze = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // 1. Upload & Create Queue
      const queueItem = await uploadTicketImage(formData);
      
      // 2. Trigger Analysis (Fire and forget-ish)
      // We don't await the result to unblock UI, but we catch errors
      analyzeTicketQueue(queueItem.id).catch(err => {
        console.error('Background analysis failed:', err);
        // Optionally update queue status to error via another action if needed,
        // but analyzeTicketQueue already handles error status update.
      });

      toast({
        title: "アップロード完了",
        description: "解析を開始しました。結果はリストに表示されます。",
      });

      return queueItem;
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({
        title: "アップロード失敗",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAndAnalyze, isUploading };
}

