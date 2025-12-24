export type BetType = 
  | 'WIN' | 'PLACE' | 'BRACKET_QUINELLA' | 'QUINELLA' 
  | 'QUINELLA_PLACE' | 'EXACTA' | 'TRIO' | 'TRIFECTA';

export type BetMethod = 'NORMAL' | 'BOX' | 'FORMATION' | 'NAGASHI';

export interface TicketContent {
  type: BetType;
  method: BetMethod;
  multi: boolean;
  selections: string[][]; // NORMAL/BOX/FORMATION用
  axis: string[];         // NAGASHI用 軸
  partners: string[];     // NAGASHI用 相手
  positions: number[];    // NAGASHI用 着順指定
}

export interface TicketFormState extends TicketContent {
  id?: string;          // 編集用ID
  race_date: string;    // YYYY-MM-DD
  place_code: string;   // 01-10
  race_number: number;  // 1-12
  amount: number;       // 1点あたり金額
  total_points: number; // 自動計算される点数
  total_cost: number;   // 自動計算される合計金額
  image_hash?: string;  // 画像登録時の重複チェック用
  image_url?: string;   // アップロード画像のプレビュー用URL
}
