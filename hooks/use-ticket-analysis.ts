import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TicketFormState } from '@/types/betting';

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

  const analyzeImage = async (file: File): Promise<Partial<TicketFormState> | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Hash Calculation
      const hash = await calculateImageHash(file);

      // 2. Duplicate Check
      const isDuplicate = await checkDuplicate(hash);
      if (isDuplicate) {
        throw new Error('この画像は既に登録されています。');
      }

      // 3. Send to API
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || '画像の解析に失敗しました。');
      }

      const result = await response.json();
      
      // Convert numbers to strings for compatibility
      const convertToStrings = (data: any) => {
        if (data.selections) {
          data.selections = data.selections.map((row: any[]) => 
            row.map((n: any) => String(n).padStart(2, '0'))
          );
        }
        if (data.axis) {
          data.axis = data.axis.map((n: any) => String(n).padStart(2, '0'));
        }
        if (data.partners) {
          data.partners = data.partners.map((n: any) => String(n).padStart(2, '0'));
        }
        return data;
      };

      const convertedResult = convertToStrings(result);

      // Add hash to result
      return { ...convertedResult, image_hash: hash };

    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeImage, isAnalyzing, error };
}
