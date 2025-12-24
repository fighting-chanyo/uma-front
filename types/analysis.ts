import { BetType, BetMethod } from './betting';

export interface AnalyzedTicketData {
  // 信頼度判定用フラグ
  isComplete: boolean; // 全ての必須項目が揃っているか
  missingFields: string[]; // 欠落しているフィールド名

  // 解析データ (nullの場合は未解析)
  date: string | null;       // YYYY-MM-DD
  place: string | null;      // 競馬場コード
  raceNumber: number | null; // 1-12
  
  betType: BetType | null;     // WIN, TRIFECTA, etc.
  method: BetMethod | null;    // NORMAL, FORMATION, etc.
  
  // 買い目 (正規化済み)
  selections: string[][] | null; 
  // ながし用
  axis?: string[];
  partners?: string[];
  positions?: number[];
  multi?: boolean;
  
  amount: number | null;     // 金額
}

export interface ImageAnalysisRequest {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'analyzing' | 'complete' | 'complete_auto' | 'complete_manual' | 'error' | 'correction_needed';
  result?: AnalyzedTicketData;
  error?: string;
}

export interface AnalysisQueueItem {
  id: string;
  user_id: string;
  image_path: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result_json: { results: AnalyzedTicketData[] } | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
