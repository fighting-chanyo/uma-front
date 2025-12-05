export interface Ticket {
  id: string
  raceName: string
  raceDate: string
  venue: string
  raceNumber: number
  raceTime?: string // 発走時刻を追加
  betType: string
  buyType: "BOX" | "NAGASHI" | "FORMATION"
  content: {
    "1st"?: string[]
    "2nd"?: string[]
    "3rd"?: string[]
    horses?: string[]
    axis?: string[]
    partners?: string[]
    multi?: boolean
  }
  amount: number
  status: "PENDING" | "WIN" | "LOSE"
  mode: "REAL" | "AIR"
  payout?: number
  userName?: string
  userAvatar?: string
  userId?: string
}

export interface Race {
  raceId: string
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
  dateRange: { from?: Date; to?: Date }
  venues: string[]
}

export const VENUES = ["東京", "中山", "阪神", "京都", "中京", "新潟", "福島", "小倉", "札幌", "函館"] as const
