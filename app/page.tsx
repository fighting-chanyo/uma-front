"use client"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/header"
import { RaceList } from "@/components/race-list"
import { MobileNav } from "@/components/mobile-nav"
import { FriendRequestModal } from "@/components/friend-request-modal"
import { FilterSummary } from "@/components/filter-summary" // Import the new component
import { useIsMobile } from "@/hooks/use-mobile"
import type { Ticket, Friend, FilterState, Race } from "@/types/ticket"
import { VENUES } from "@/types/ticket" // VENUES定数をインポート

// FilterStateのdateRangeの型定義を修正
export interface UpdatedFilterState extends Omit<FilterState, 'dateRange'> {
  dateRange: {
    from: Date | null
    to: Date | null
  }
}

const friends: Friend[] = [
  { id: "u1", name: "TurfMaster", avatar: "/male-avatar-blue.jpg" },
  { id: "u2", name: "HorseWhisperer", avatar: "/female-avatar-purple.jpg" },
  { id: "u3", name: "NightRider", avatar: "/male-avatar-red-cyber.jpg" },
  { id: "u4", name: "LuckyStrike", avatar: "/female-avatar-green.jpg" },
]

// チケットデータ
const myTickets: Ticket[] = [
  {
    id: "1",
    raceName: "日本ダービー",
    raceDate: "2024/05/26",
    venue: "東京",
    raceNumber: 11,
    raceTime: "15:40",
    betType: "3連単",
    buyType: "NAGASHI",
    content: { axis: ["01", "05"], partners: ["02", "03", "04", "06", "07"], multi: true },
    amount: 6000,
    status: "WIN",
    mode: "REAL",
    payout: 125400,
  },
  {
    id: "2",
    raceName: "日本ダービー",
    raceDate: "2024/05/26",
    venue: "東京",
    raceNumber: 11,
    raceTime: "15:40",
    betType: "馬連",
    buyType: "BOX",
    content: { horses: ["01", "02", "03", "04", "05"] },
    amount: 1000,
    status: "WIN",
    mode: "REAL",
    payout: 3200,
  },
  {
    id: "3",
    raceName: "宝塚記念",
    raceDate: "2024/06/23",
    venue: "阪神",
    raceNumber: 11,
    raceTime: "15:50",
    betType: "単勝",
    buyType: "BOX",
    content: { horses: ["08"] },
    amount: 5000,
    status: "PENDING",
    mode: "AIR",
  },
  {
    id: "4",
    raceName: "安田記念",
    raceDate: "2024/06/02",
    venue: "東京",
    raceNumber: 11,
    raceTime: "15:40",
    betType: "3連複",
    buyType: "BOX",
    content: { horses: ["02", "05", "09", "11"] },
    amount: 400,
    status: "WIN",
    mode: "REAL",
    payout: 8900,
  },
  {
    id: "5",
    raceName: "天皇賞（春）",
    raceDate: "2024/04/28",
    venue: "京都",
    raceNumber: 11,
    raceTime: "15:40",
    betType: "3連単",
    buyType: "NAGASHI",
    content: { axis: ["03", "07"], partners: ["01", "05", "08", "12", "15"], multi: true },
    amount: 3000,
    status: "LOSE",
    mode: "REAL",
  },
  {
    id: "6",
    raceName: "安田記念",
    raceDate: "2024/06/02",
    venue: "東京",
    raceNumber: 11,
    raceTime: "15:40",
    betType: "馬連",
    buyType: "BOX",
    content: { horses: ["01", "05", "09"] },
    amount: 300,
    status: "WIN",
    mode: "AIR",
    payout: 1200,
  },
]

const friendTickets: Ticket[] = [
  {
    id: "f1",
    raceName: "日本ダービー",
    raceDate: "2024/05/26",
    venue: "東京",
    raceNumber: 11,
    raceTime: "15:40",
    betType: "馬単",
    buyType: "NAGASHI",
    content: { axis: ["14"], partners: ["01", "02", "05"] },
    amount: 300,
    status: "LOSE",
    mode: "REAL",
    userName: "TurfMaster",
    userId: "u1",
  },
  {
    id: "f2",
    raceName: "日本ダービー",
    raceDate: "2024/05/26",
    venue: "東京",
    raceNumber: 11,
    raceTime: "15:40",
    betType: "3連複",
    buyType: "BOX",
    content: { horses: ["01", "05", "14"] },
    amount: 500,
    status: "WIN",
    mode: "REAL",
    payout: 8200,
    userName: "TurfMaster",
    userId: "u1",
  },
  {
    id: "f3",
    raceName: "宝塚記念",
    raceDate: "2024/06/23",
    venue: "阪神",
    raceNumber: 11,
    raceTime: "15:50",
    betType: "3連単",
    buyType: "FORMATION",
    content: { "1st": ["03", "08"], "2nd": ["03", "08", "11"], "3rd": ["03", "05", "08", "11"] },
    amount: 1200,
    status: "PENDING",
    mode: "REAL",
    userName: "NightRider",
    userId: "u3",
  },
  {
    id: "f4",
    raceName: "宝塚記念",
    raceDate: "2024/06/23",
    venue: "阪神",
    raceNumber: 11,
    raceTime: "15:50",
    betType: "単勝",
    buyType: "BOX",
    content: { horses: ["08"] },
    amount: 1000,
    status: "PENDING",
    mode: "AIR",
    userName: "NightRider",
    userId: "u3",
  },
  {
    id: "f5",
    raceName: "天皇賞（春）",
    raceDate: "2024/04/28",
    venue: "京都",
    raceNumber: 11,
    raceTime: "15:40",
    betType: "3連複",
    buyType: "BOX",
    content: { horses: ["03", "05", "07", "12"] },
    amount: 600,
    status: "WIN",
    mode: "REAL",
    payout: 34500,
    userName: "TurfMaster",
    userId: "u1",
  },
  {
    id: "f6",
    raceName: "安田記念",
    raceDate: "2024/06/02",
    venue: "東京",
    raceNumber: 11,
    raceTime: "15:40",
    betType: "単勝",
    buyType: "BOX",
    content: { horses: ["05"] },
    amount: 10000,
    status: "LOSE",
    mode: "REAL",
    userName: "LuckyStrike",
    userId: "u4",
  },
  {
    id: "f7",
    raceName: "安田記念",
    raceDate: "2024/06/02",
    venue: "東京",
    raceNumber: 11,
    raceTime: "15:40",
    betType: "馬連",
    buyType: "BOX",
    content: { horses: ["02", "05", "09"] },
    amount: 300,
    status: "WIN",
    mode: "AIR",
    payout: 1500,
    userName: "HorseWhisperer",
    userId: "u2",
  },
]

// チケットをレース単位にグルーピング
function groupTicketsByRace(myTickets: Ticket[], friendTickets: Ticket[]): Race[] {
  const raceMap = new Map<string, Race>()

  const processTicket = (ticket: Ticket, owner: "me" | "friend") => {
    const raceId = `${ticket.raceDate}-${ticket.venue}-${ticket.raceNumber}`

    if (!raceMap.has(raceId)) {
      raceMap.set(raceId, {
        raceId,
        venue: ticket.venue,
        raceNumber: ticket.raceNumber,
        raceName: ticket.raceName,
        raceTime: ticket.raceTime || "00:00",
        totalBet: 0,
        totalReturn: 0,
        status: "PENDING",
        tickets: [],
      })
    }

    const race = raceMap.get(raceId)!
    race.tickets.push({ ...ticket, owner })
    race.totalBet += ticket.amount
    race.totalReturn += ticket.payout || 0

    if (ticket.status === "WIN") race.status = "WIN"
    else if (ticket.status === "PENDING" && race.status !== "WIN") race.status = "PENDING"
    else if (race.status !== "WIN" && race.status !== "PENDING") race.status = "LOSE"
  }

  myTickets.forEach((t) => processTicket(t, "me"))
  friendTickets.forEach((t) => processTicket(t, "friend"))

  return Array.from(raceMap.values()).sort((a, b) => {
    const dateA = a.raceId.split("-")[0]
    const dateB = b.raceId.split("-")[0]
    if (dateA !== dateB) return dateB.localeCompare(dateA)
    return b.raceNumber - a.raceNumber
  })
}

export default function DashboardPage() {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<"my" | "friend" | "analysis">("my")
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false)

  const [filterState, setFilterState] = useState<FilterState>({
    displayMode: "BOTH",
    selectedFriendIds: friends.map((f) => f.id),
    dateRange: { from: null, to: null },
    venues: [...VENUES], // スプレッド構文で新しい配列を作成
  })

  useEffect(() => {
    const allTickets = [...myTickets, ...friendTickets];
    if (allTickets.length > 0) {
      const latestDate = allTickets.reduce((latest, ticket) => {
        const ticketDate = new Date(ticket.raceDate);
        return ticketDate > latest ? ticketDate : latest;
      }, new Date(0));

      const dayOfWeek = latestDate.getDay(); // 0 (Sun) - 6 (Sat)
      
      // 直近の土曜日を探す
      const lastSaturday = new Date(latestDate);
      lastSaturday.setDate(latestDate.getDate() - (dayOfWeek + 1) % 7);
      
      // 直近の日曜日を探す
      const lastSunday = new Date(lastSaturday);
      lastSunday.setDate(lastSaturday.getDate() + 1);

      setFilterState(prevState => ({
        ...prevState,
        dateRange: {
          from: lastSaturday,
          to: lastSunday,
        }
      }));
    }
  }, []); // 空の依存配列で初回レンダリング時のみ実行

  const hasActiveFilters = useMemo(() => {
    return (
      filterState.displayMode !== "BOTH" ||
      filterState.selectedFriendIds.length !== friends.length ||
      filterState.venues.length !== VENUES.length || // 全選択状態かをVENUESと比較
      filterState.dateRange.from != null ||
      filterState.dateRange.to != null
    )
  }, [filterState])

  const applyFilters = (tickets: Ticket[]) => {
    return tickets.filter((ticket) => {
      if (filterState.displayMode !== "BOTH" && ticket.mode !== filterState.displayMode) return false
      if (filterState.venues.length > 0 && !filterState.venues.includes(ticket.venue)) return false
      const ticketDate = new Date(ticket.raceDate)
      if (filterState.dateRange.from && ticketDate < filterState.dateRange.from) return false
      if (filterState.dateRange.to && ticketDate > filterState.dateRange.to) return false
      return true
    })
  }

  const filteredMyTickets = useMemo(() => applyFilters(myTickets), [filterState])
  const filteredFriendTickets = useMemo(() => {
    const byFriend = friendTickets.filter((t) => t.userId && filterState.selectedFriendIds.includes(t.userId))
    return applyFilters(byFriend)
  }, [filterState])

  const myRaces = useMemo(() => groupTicketsByRace(filteredMyTickets, []), [filteredMyTickets])
  const friendRaces = useMemo(() => groupTicketsByRace([], filteredFriendTickets), [filteredFriendTickets])

  const friendRaceTitle = useMemo(() => {
    if (filterState.selectedFriendIds.length === 1) {
      const selectedFriend = friends.find(f => f.id === filterState.selectedFriendIds[0]);
      if (selectedFriend) {
        return `${selectedFriend.name.toUpperCase()}'S RACES`;
      }
    }
    return "FRIENDS' RACES";
  }, [filterState.selectedFriendIds]);

  const nextRaceInfo = { venue: "東京", raceNumber: 11, time: "15:35" }

  return (
    <div className="min-h-screen bg-[#050505] relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-5">
        <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent animate-[scan-line_8s_linear_infinite]" />
      </div>
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <Header
        friends={friends}
        filterState={filterState}
        onApplyFilters={setFilterState}
        hasActiveFilters={hasActiveFilters}
        onOpenFriendModal={() => setIsFriendModalOpen(true)}
        nextRaceInfo={nextRaceInfo}
      />

      {hasActiveFilters && !isMobile && (
        <FilterSummary filterState={filterState} friends={friends} className="max-w-[1800px] mx-auto" />
      )}

      {isMobile ? (
        <>
          <div className="px-3 py-2 border-b border-white/10 bg-black/50 flex items-center justify-center gap-2">
            <span className="text-[10px] text-[#00f3ff] font-mono">NEXT:</span>
            <span className="text-sm font-bold">
              {nextRaceInfo.venue} {nextRaceInfo.raceNumber}R
            </span>
            <span className="text-sm font-mono text-[#00f3ff]">{nextRaceInfo.time}</span>
          </div>

          {hasActiveFilters && <FilterSummary filterState={filterState} friends={friends} />}

          <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

          <main className="pt-2 pb-6 px-3">
            {activeTab === "my" && <RaceList races={myRaces} title="MY RACES" variant="my" />}
            {activeTab === "friend" && <RaceList races={friendRaces} title={friendRaceTitle} variant="friend" />}
            {activeTab === "analysis" && (
              <div className="glass-panel p-6 text-center">
                <p className="text-muted-foreground">分析機能は準備中です</p>
              </div>
            )}
          </main>
        </>
      ) : (
        <main className="pt-4 pb-6 px-6 max-w-[1800px] mx-auto">
          {/* Race Lists - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <RaceList races={myRaces} title="MY RACES" variant="my" />
            <RaceList races={friendRaces} title={friendRaceTitle} variant="friend" />
          </div>
        </main>
      )}

      <FriendRequestModal isOpen={isFriendModalOpen} onClose={() => setIsFriendModalOpen(false)} />
    </div>
  )
}
