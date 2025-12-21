import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TicketFormState } from '@/types/betting';
import { AnalyzedTicketData } from '@/types/analysis';

let mockCounter = 0;

export function useTicketAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateImageHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const checkDuplicate = async (hash: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('tickets')
      .select('id')
      .eq('image_hash', hash)
      .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Error checking duplicate:', error);
        return false; 
    }
    return !!data;
  };

  const analyzeImage = async (file: File): Promise<AnalyzedTicketData | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Hash Calculation
      const hash = await calculateImageHash(file);

      // 2. Duplicate Check
      // const isDuplicate = await checkDuplicate(hash);
      // if (isDuplicate) {
      //   throw new Error('この画像は既に登録されています。');
      // }

      // 3. Send to API
      const formData = new FormData();
      formData.append('file', file);

      // Mocking the API response for development
      // In production, uncomment the fetch call
      /*
      const response = await fetch('/api/analyze/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('画像の解析に失敗しました。');
      }

      const data = await response.json();
      return data as AnalyzedTicketData;
      */
     
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock response rotation
      const mocks: AnalyzedTicketData[] = [
        // Ticket A: 1 item, OK
        {
          isComplete: true,
          missingFields: [],
          date: '2025-12-21',
          place: '06', // Nakayama
          raceNumber: 11,
          betType: 'WIN',
          method: 'NORMAL',
          selections: [['01']], // 1 point
          axis: [],
          partners: [],
          positions: [],
          amount: 100,
          multi: false
        },
        // Ticket B: 2 items, Date missing
        {
          isComplete: false,
          missingFields: ['date'],
          date: null, // Missing
          place: '06', // Nakayama
          raceNumber: 12,
          betType: 'WIN',
          method: 'NORMAL',
          selections: [['01', '02']], // 2 points
          axis: [],
          partners: [],
          positions: [],
          amount: 500,
          multi: false
        },
        // Ticket C: 1 item, OK
        {
          isComplete: true,
          missingFields: [],
          date: '2025-12-22',
          place: '09', // Hanshin
          raceNumber: 10,
          betType: 'QUINELLA',
          method: 'BOX',
          selections: [['01', '02']], // 1 point (1-2)
          axis: [],
          partners: [],
          positions: [],
          amount: 200,
          multi: false
        }
      ];

      const result = mocks[mockCounter % mocks.length];
      mockCounter++;
      
      return result;

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました。');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeImage, isAnalyzing, error };
}

