"use client"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/header"
import { RaceList } from "@/components/race-list"
import { MobileNav } from "@/components/mobile-nav"
import { FriendRequestModal } from "@/components/friend-request-modal"
import { FilterSummary } from "@/components/filter-summary"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Ticket, Friend, FilterState, Race } from "@/types/ticket"
import { VENUES } from "@/types/ticket"
import { supabase } from "@/lib/supabase"

// FilterStateのdateRangeの型定義を修正
export interface UpdatedFilterState extends Omit<FilterState, 'dateRange'> {
  dateRange: {
    from: Date | null
    to: Date | null
  }
}

// 開発用モックユーザーID
const MOCK_USER_ID = "03e8d27e-6011-4f5b-bbfd-53c094e4e25f"

// 会場コード変換マップ
const PLACE_CODE_MAP: Record<string, string> = {
  "01": "札幌", "02": "函館", "03": "福島", "04": "新潟",
  "05": "東京", "06": "中山", "07": "中京", "08": "京都",
  "09": "阪神", "10": "小倉"
}
const getVenueName = (code: string) => PLACE_CODE_MAP[code] || code

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
  
  // State for data
  const [friends, setFriends] = useState<Friend[]>([])
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [friendTickets, setFriendTickets] = useState<Ticket[]>([])

  const [filterState, setFilterState] = useState<FilterState>({
    displayMode: "BOTH",
    selectedFriendIds: [], // 初期値は空、データ取得後に更新
    dateRange: { from: null, to: null },
    venues: [...VENUES],
  })

  // データ取得
  useEffect(() => {
    async function fetchData() {
      try {
        // 1. フレンド一覧の取得
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', MOCK_USER_ID)
          .eq('status', 'ACCEPTED')
        
        if (friendsError) throw friendsError
        
        const friendIds = friendsData?.map(f => f.friend_id) || []
        
        if (friendIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', friendIds)
          
          if (profilesError) throw profilesError

          const mappedFriends: Friend[] = (profilesData || []).map(p => ({
            id: p.id,
            name: p.display_name || 'Unknown',
            avatar: p.avatar_url || '/placeholder-avatar.jpg' // デフォルトアバター
          }))
          setFriends(mappedFriends)
          
          // フレンドが読み込まれたらフィルタの選択状態を更新（全員選択）
          setFilterState(prev => ({ ...prev, selectedFriendIds: mappedFriends.map(f => f.id) }))
        }

        // 2. 自分のチケット取得
        const { data: myTicketsData, error: myTicketsError } = await supabase
          .from('tickets')
          .select(`
            *,
            races (
              name, date, place_code, race_number, result_1st
            )
          `)
          .eq('user_id', MOCK_USER_ID)
        
        if (myTicketsError) throw myTicketsError

        console.log("Debug: myTicketsData raw", myTicketsData); // 追加

        const mappedMyTickets: Ticket[] = (myTicketsData || []).map((t: any) => ({
          id: t.id,
          raceName: t.races?.name || '',
          raceDate: t.races?.date || '',
          venue: getVenueName(t.races?.place_code || ''),
          raceNumber: t.races?.race_number || 0,
          raceTime: "00:00", // DBに時刻がない場合は仮置き
          betType: t.bet_type,
          buyType: t.buy_type,
          content: t.content,
          amount: t.total_cost, // total_costを使用
          status: t.status,
          mode: t.mode,
          payout: t.payout || 0,
        }))
        setMyTickets(mappedMyTickets)

        // 3. フレンドのチケット取得
        if (friendIds.length > 0) {
          const { data: friendTicketsData, error: friendTicketsError } = await supabase
            .from('tickets')
            .select(`
              *,
              races (
                name, date, place_code, race_number
              ),
              profiles:user_id (
                id, display_name, avatar_url
              )
            `)
            .in('user_id', friendIds)
          
          if (friendTicketsError) throw friendTicketsError

          const mappedFriendTickets: Ticket[] = (friendTicketsData || []).map((t: any) => ({
            id: t.id,
            raceName: t.races?.name || '',
            raceDate: t.races?.date || '',
            venue: getVenueName(t.races?.place_code || ''),
            raceNumber: t.races?.race_number || 0,
            raceTime: "00:00",
            betType: t.bet_type,
            buyType: t.buy_type,
            content: t.content,
            amount: t.total_cost,
            status: t.status,
            mode: t.mode,
            payout: t.payout || 0,
            userName: t.profiles?.display_name || 'Unknown',
            userId: t.user_id,
            userAvatar: t.profiles?.avatar_url
          }))
          setFriendTickets(mappedFriendTickets)
        }

      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  // 日付フィルタの初期化ロジック
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

      // 初回のみ設定したいが、ticketsがロードされるタイミングで実行する必要がある
      // ユーザーが手動で変更した後も上書きしないようにチェックが必要だが、
      // ここでは簡易的に「dateRangeがnullの場合」のみ設定する
      setFilterState(prevState => {
        if (prevState.dateRange.from === null && prevState.dateRange.to === null) {
          return {
            ...prevState,
            dateRange: {
              from: lastSaturday,
              to: lastSunday,
            }
          }
        }
        return prevState
      });
    }
  }, [myTickets, friendTickets]);

  const hasActiveFilters = useMemo(() => {
    return (
      filterState.displayMode !== "BOTH" ||
      filterState.selectedFriendIds.length !== friends.length ||
      filterState.venues.length !== VENUES.length || // 全選択状態かをVENUESと比較
      filterState.dateRange.from != null ||
      filterState.dateRange.to != null
    )
  }, [filterState, friends.length]) // friends.lengthを依存配列に追加

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

  const filteredMyTickets = useMemo(() => applyFilters(myTickets), [filterState, myTickets])
  const filteredFriendTickets = useMemo(() => {
    const byFriend = friendTickets.filter((t) => t.userId && filterState.selectedFriendIds.includes(t.userId))
    return applyFilters(byFriend)
  }, [filterState, friendTickets])

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
  }, [filterState.selectedFriendIds, friends]);

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
