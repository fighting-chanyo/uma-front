/**
 * 買い目データの正規化フォーマット (tickets.content)
 */
export type TicketContent = {
  /** 式別コード (例: 'TRIFECTA', 'WIN') */
  type: string
  /** 投票方式 ('NORMAL', 'BOX', 'FORMATION' 'NAGASHI') */
  method: "NORMAL" | "BOX" | "FORMATION" | "NAGASHI"
  /** マルチフラグ (true/false) */
  multi?: boolean
  /** 軸馬配列 (例: ["01"]) - ながし/フォーメーション用 */
  axis?: string[]
  /** 相手馬配列 (例: ["02","03","04"]) - ながし用 */
  partners?: string[]
  /** 選択馬の二次元配列 (例: [["01","02"], ["01","03"], ["02","03","04"]]) - フォーメーション用 */
  selections: string[][]
  /** 着順指定の配列 (例: [1, 2]) - ながし(軸馬の着順)用 */
  positions?: number[]
}

/**
 * DBから取得したチケット情報と、関連情報をJOINしたUI用の型
 */
export interface Ticket {
  // ticketsテーブルの基本カラム
  id: string // uuid
  user_id: string // uuid
  race_id: string
  content: TicketContent
  amount_per_point: number
  total_points: number
  total_cost: number
  status: "PENDING" | "WIN" | "LOSE"
  payout: number
  source: "IPAT_SYNC" | "IMAGE_OCR" | "MANUAL"
  mode: "REAL" | "AIR"
  created_at: string // timestamptz
  receipt_unique_id?: string

  // JOINしたprofilesテーブルの情報
  user_name?: string
  user_avatar?: string

  // JOINしたracesテーブルの情報
  race_name?: string
  race_date?: string // `races.date` から取得
  venue?: string // `races.venue` から取得
  race_number?: number // `races.round` から取得
}

export interface Race {
  raceId: string
  raceDate: string // この行を追加
  venue: string
  raceNumber: number
  raceName: string
  raceTime: string
  totalBet: number
  totalReturn: number
  status: "PENDING" | "WIN" | "LOSE"
  tickets: (Ticket & { owner: "me" | "friend" })[]
}

export interface RaceSchedule {
  venue: string
  raceNumber: number
  raceTime: string
  raceName?: string
  grade?: string
}

export interface Friend {
  id: string
  name: string
  avatar: string
}

export interface FilterState {
  displayMode: "REAL" | "AIR" | "BOTH"
  selectedFriendIds: string[]
  dateRange: {
    from?: Date | null
    to?: Date | null
  }
  venues: string[]
}

export const VENUES = ["東京", "中山", "阪神", "京都", "中京", "新潟", "福島", "小倉", "札幌", "函館"] as const
