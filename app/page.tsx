"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { RaceList } from "@/components/race-list"
import { MobileNav } from "@/components/mobile-nav"
import { FriendRequestModal } from "@/components/friend-request-modal"
import { FilterSummary } from "@/components/filter-summary"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Ticket, Friend, FilterState, Race } from "@/types/ticket"
import { VENUES } from "@/types/ticket"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { getFriendRequests } from "@/app/actions/friend"
import { getDailyRaces, RaceData } from "@/app/actions/race"
import { format } from "date-fns"
import { getNow } from "@/lib/time-utils"
import { PLACE_CODE_TO_NAME } from "@/lib/betting-utils"
import { useTicketAnalysisQueue, AnalysisQueueItemWithUrl } from "@/hooks/use-ticket-analysis-queue"
import { AnalysisQueueList } from "@/components/betting/analysis-queue-list"
import { deleteAnalysisQueue } from "@/app/actions/ticket-analysis"
import { BettingWizard } from "@/components/betting/betting-wizard"

// FilterStateのdateRangeの型定義を修正
export interface UpdatedFilterState extends Omit<FilterState, 'dateRange'> {
  dateRange: {
    from: Date | null
    to: Date | null
  }
}

// 開発用モックユーザーID
const MOCK_USER_ID = "03e8d27e-6011-4f5b-bbfd-53c094e4e25f"

const getVenueName = (code: string) => PLACE_CODE_TO_NAME[code] || code

// チケットをレース単位にグルーピング
function groupTicketsByRace(myTickets: Ticket[], friendTickets: Ticket[]): Race[] {
  const raceMap = new Map<string, Race>()

  const processTicket = (ticket: Ticket, owner: "me" | "friend") => {
    // race_date が存在しない場合は race_id から年を抽出してフォールバック
    const raceDate = ticket.race_date || ticket.race_id.substring(0, 4)
    const raceId = ticket.race_id

    if (!raceMap.has(raceId)) {
      raceMap.set(raceId, {
        raceId: raceId,
        raceDate: raceDate, // raceDateプロパティを追加
        venue: ticket.venue || "不明",
        raceNumber: ticket.race_number || 0,
        raceName: ticket.race_name || "レース情報なし",
        raceTime: "00:00", // 仮
        totalBet: 0,
        totalReturn: 0,
        status: "PENDING", // 初期ステータス（後で再計算）
        tickets: [],
      })
    }

    const race = raceMap.get(raceId)!
    race.tickets.push({ ...ticket, owner })

    // レース全体のベット額とリターンを計算
    race.totalBet += ticket.total_cost || 0
    race.totalReturn += ticket.payout || 0

    // ここでのステータス更新は行わない
  }

  myTickets.forEach((t) => processTicket(t, "me"))
  friendTickets.forEach((t) => processTicket(t, "friend"))

  // 全てのチケットをグルーピングした後、各レースの最終的なステータスを決定する
  raceMap.forEach((race) => {
    const hasPending = race.tickets.some((t) => t.status === "PENDING")
    const hasWin = race.tickets.some((t) => t.status === "WIN")

    if (hasPending) {
      race.status = "PENDING"
    } else if (hasWin) {
      race.status = "WIN"
    } else {
      // PENDINGもWINもなければLOSE
      race.status = "LOSE"
    }
  })

  // 日付とレース番号でソート
  return Array.from(raceMap.values()).sort((a, b) => {
    if (a.raceDate !== b.raceDate) return b.raceDate.localeCompare(a.raceDate)
    return b.raceNumber - a.raceNumber
  })
}

export default function DashboardPage() {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const { queueItems } = useTicketAnalysisQueue()
  const [editingQueueItem, setEditingQueueItem] = useState<AnalysisQueueItemWithUrl | null>(null)
  const [isBettingWizardOpen, setIsBettingWizardOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"my" | "friend" | "analysis">("my")
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<{ name: string; avatarUrl: string } | null>(null)
  
  // State for data
  const [friends, setFriends] = useState<Friend[]>([])
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [friendTickets, setFriendTickets] = useState<Ticket[]>([])
  const [pendingRequestCount, setPendingRequestCount] = useState(0)
  const [dailyRaces, setDailyRaces] = useState<RaceData[]>([])

  // Pagination state
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  // Friend Pagination state
  const [friendOffset, setFriendOffset] = useState(0)
  const [friendHasMore, setFriendHasMore] = useState(true)
  const [isFriendLoading, setIsFriendLoading] = useState(false)

  const LIMIT = 20

  const [filterState, setFilterState] = useState<FilterState>({
    displayMode: "BOTH",
    selectedFriendIds: [], // 初期値は空、データ取得後に更新
    dateRange: { from: null, to: null },
    venues: [...VENUES],
  })

  // チケットデータマッピング関数を外に出すか、useCallbackで定義
  const mapTicketData = (t: any): Ticket => ({
    id: t.id,
    user_id: t.user_id,
    race_id: t.race_id,
    content: t.content,
    amount_per_point: t.amount_per_point,
    total_points: t.total_points,
    total_cost: t.total_cost,
    status: t.status,
    payout: t.payout,
    source: t.source,
    mode: t.mode,
    created_at: t.created_at,
    receipt_unique_id: t.receipt_unique_id,
    image_url: t.image_url,
    race_name: t.races?.name || '',
    race_date: t.races?.date || '',
    venue: getVenueName(t.races?.place_code || ''),
    race_number: t.races?.race_number || 0,
    user_name: t.profiles?.display_name || undefined,
    user_avatar: t.profiles?.avatar_url || undefined,
  })

  // 自分のチケットを再取得する関数
  const fetchMyTickets = async (isLoadMore = false) => {
    // ローディング中で、かつ追加読み込みの場合は重複リクエストを防ぐ
    // 初期ロード(isLoadMore=false)の場合は、強制的にリロードさせるためにチェックしない（または必要に応じて制御）
    if (isLoadMore && isLoading) return

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentOffset = isLoadMore ? offset : 0

      const { data: myTicketsData, error: myTicketsError } = await supabase
        .from('tickets')
        .select(`
          *,
          races (
            name, date, place_code, race_number, result_1st
          )
        `)
        .eq('user_id', user.id)
        .order('race_id', { ascending: false })
        .range(currentOffset, currentOffset + LIMIT - 1)
      
      if (myTicketsError) throw myTicketsError

      const mappedMyTickets: Ticket[] = (myTicketsData || []).map(mapTicketData)
      
      if (isLoadMore) {
        setMyTickets(prev => {
          // 重複を防ぐために既存のIDを確認してフィルタリング
          const existingIds = new Set(prev.map(t => t.id))
          const uniqueNewTickets = mappedMyTickets.filter(t => !existingIds.has(t.id))
          return [...prev, ...uniqueNewTickets]
        })
        setOffset(prev => prev + LIMIT)
      } else {
        setMyTickets(mappedMyTickets)
        setOffset(LIMIT)
      }
      
      // 取得件数がLIMIT未満なら、もうデータはない
      setHasMore(mappedMyTickets.length === LIMIT)
    } catch (error) {
      console.error('Error refreshing tickets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreMyTickets = () => {
    if (!isLoading && hasMore) {
      fetchMyTickets(true)
    }
  }

  // 友達のチケットを取得する関数
  const fetchFriendTickets = async (isLoadMore = false, specificFriendIds?: string[]) => {
    if (isLoadMore && isFriendLoading) return

    const targetFriendIds = specificFriendIds || filterState.selectedFriendIds
    if (targetFriendIds.length === 0) {
        if (!isLoadMore) {
            setFriendTickets([])
            setFriendHasMore(false)
        }
        return
    }

    setIsFriendLoading(true)
    try {
      const currentOffset = isLoadMore ? friendOffset : 0

      const { data: ticketsData, error } = await supabase
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
        .in('user_id', targetFriendIds)
        .order('race_id', { ascending: false })
        .range(currentOffset, currentOffset + LIMIT - 1)
      
      if (error) throw error

      const mappedTickets = (ticketsData || []).map(mapTicketData)

      if (isLoadMore) {
        setFriendTickets(prev => {
          const existingIds = new Set(prev.map(t => t.id))
          const uniqueNewTickets = mappedTickets.filter(t => !existingIds.has(t.id))
          return [...prev, ...uniqueNewTickets]
        })
        setFriendOffset(prev => prev + LIMIT)
      } else {
        setFriendTickets(mappedTickets)
        setFriendOffset(LIMIT)
      }
      
      setFriendHasMore(mappedTickets.length === LIMIT)

    } catch (error) {
      console.error('Error fetching friend tickets:', error)
    } finally {
      setIsFriendLoading(false)
    }
  }

  const loadMoreFriendTickets = () => {
    if (!isFriendLoading && friendHasMore) {
      fetchFriendTickets(true)
    }
  }

  // 友達リクエスト数を更新する関数
  const refreshFriendRequests = useCallback(async () => {
    try {
      const requests = await getFriendRequests()
      setPendingRequestCount(requests.length)
    } catch (error) {
      console.error('Error fetching friend requests:', error)
    }
  }, [])

  // Summary state
  const [summary, setSummary] = useState({
    totalBet: 0,
    totalReturn: 0,
    winCount: 0,
    raceCount: 0
  })

  const [friendSummary, setFriendSummary] = useState({
    totalBet: 0,
    totalReturn: 0,
    winCount: 0,
    raceCount: 0
  })

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // My Summary
      let query = supabase
        .from('tickets')
        .select(`
          total_cost,
          payout,
          status,
          race_id,
          mode,
          races!inner (
            date,
            place_code
          )
        `)
        .eq('user_id', user.id)

      // displayMode
      if (filterState.displayMode !== "BOTH") {
        query = query.eq('mode', filterState.displayMode)
      }

      // dateRange
      if (filterState.dateRange.from) {
        query = query.gte('races.date', format(filterState.dateRange.from, 'yyyy-MM-dd'))
      }
      if (filterState.dateRange.to) {
        query = query.lte('races.date', format(filterState.dateRange.to, 'yyyy-MM-dd'))
      }

      // venues
      if (filterState.venues.length > 0 && filterState.venues.length < VENUES.length) {
        const targetCodes = Object.entries(PLACE_CODE_TO_NAME)
          .filter(([_, name]) => filterState.venues.includes(name))
          .map(([code, _]) => code)
        
        if (targetCodes.length > 0) {
            query = query.in('races.place_code', targetCodes)
        }
      }

      const { data, error } = await query

      if (error) throw error

      let totalBet = 0
      let totalReturn = 0
      const winningRaceIds = new Set<string>()
      const raceIds = new Set<string>()

      if (data) {
        data.forEach((ticket: any) => {
          totalBet += ticket.total_cost || 0
          totalReturn += ticket.payout || 0
          raceIds.add(ticket.race_id)
          if (ticket.status === 'WIN') {
            winningRaceIds.add(ticket.race_id)
          }
        })
      }

      setSummary({
        totalBet,
        totalReturn,
        winCount: winningRaceIds.size,
        raceCount: raceIds.size
      })

    } catch (error: any) {
      console.error('Error fetching summary:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        error
      })
    }
  }, [filterState])

  const fetchFriendSummary = useCallback(async () => {
    try {
      const targetFriendIds = filterState.selectedFriendIds
      if (targetFriendIds.length === 0) {
          setFriendSummary({ totalBet: 0, totalReturn: 0, winCount: 0, raceCount: 0 })
          return
      }

      let query = supabase
        .from('tickets')
        .select(`
          total_cost,
          payout,
          status,
          race_id,
          mode,
          races!inner (
            date,
            place_code
          )
        `)
        .in('user_id', targetFriendIds)

      // displayMode
      if (filterState.displayMode !== "BOTH") {
        query = query.eq('mode', filterState.displayMode)
      }

      // dateRange
      if (filterState.dateRange.from) {
        query = query.gte('races.date', format(filterState.dateRange.from, 'yyyy-MM-dd'))
      }
      if (filterState.dateRange.to) {
        query = query.lte('races.date', format(filterState.dateRange.to, 'yyyy-MM-dd'))
      }

      // venues
      if (filterState.venues.length > 0 && filterState.venues.length < VENUES.length) {
        const targetCodes = Object.entries(PLACE_CODE_TO_NAME)
          .filter(([_, name]) => filterState.venues.includes(name))
          .map(([code, _]) => code)
        
        if (targetCodes.length > 0) {
            query = query.in('races.place_code', targetCodes)
        }
      }

      const { data, error } = await query

      if (error) throw error

      let totalBet = 0
      let totalReturn = 0
      const winningRaceIds = new Set<string>()
      const raceIds = new Set<string>()

      if (data) {
        data.forEach((ticket: any) => {
          totalBet += ticket.total_cost || 0
          totalReturn += ticket.payout || 0
          raceIds.add(ticket.race_id)
          if (ticket.status === 'WIN') {
            winningRaceIds.add(ticket.race_id)
          }
        })
      }

      setFriendSummary({
        totalBet,
        totalReturn,
        winCount: winningRaceIds.size,
        raceCount: raceIds.size
      })

    } catch (error: any) {
      console.error('Error fetching friend summary:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        error
      })
    }
  }, [filterState])

  useEffect(() => {
    fetchSummary()
    fetchFriendSummary()
  }, [fetchSummary, fetchFriendSummary])

  useEffect(() => {
    async function fetchRaces() {
      const today = format(getNow(), "yyyy-MM-dd")
      const races = await getDailyRaces(today)
      setDailyRaces(races)
    }
    fetchRaces()
  }, [])

  // データ取得
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function fetchData() {
      try {
        // 0. ログインユーザーの取得
        const { data: { user } } = await supabase.auth.getUser()
        const currentUserId = user?.id || MOCK_USER_ID

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', user.id)
            .single()
          
          if (profile) {
            setUserProfile({
              name: profile.display_name || "No Name",
              avatarUrl: profile.avatar_url
            })
          }

          // 友達リクエスト数を取得
          await refreshFriendRequests()
        }

        // 1. フレンド一覧の取得
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', currentUserId)
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
            avatar: p.avatar_url || '' // デフォルトアバターを削除
          }))
          setFriends(mappedFriends)
          
          // フレンドが読み込まれたらフィルタの選択状態を更新（全員選択）
          setFilterState(prev => ({ ...prev, selectedFriendIds: mappedFriends.map(f => f.id) }))
        }

        // 2. 自分のチケット取得 (初期ロード)
        await fetchMyTickets()

        // リアルタイム更新の購読 (INSERT と UPDATE を監視)
        channel = supabase
          .channel('tickets_realtime')
          .on(
            'postgres_changes',
            {
              event: '*', // INSERTだけでなく全イベントを監視（または 'INSERT', 'UPDATE'）
              schema: 'public',
              table: 'tickets',
              filter: `user_id=eq.${currentUserId}`,
            },
            async (payload) => {
              // DELETEの場合はリストから削除
              if (payload.eventType === 'DELETE') {
                 setMyTickets(prev => prev.filter(t => t.id !== payload.old.id))
                 return
              }

              // INSERT / UPDATE の場合
              const { data: newTicketData, error } = await supabase
                .from('tickets')
                .select(`
                  *,
                  races (
                    name, date, place_code, race_number, result_1st
                  )
                `)
                .eq('id', payload.new.id)
                .single()
              
              if (!error && newTicketData) {
                const mappedTicket = mapTicketData(newTicketData)
                setMyTickets(prev => {
                    // 既存なら更新、新規なら追加
                    const index = prev.findIndex(t => t.id === mappedTicket.id)
                    if (index >= 0) {
                        const newTickets = [...prev]
                        newTickets[index] = mappedTicket
                        return newTickets
                    }
                    return [...prev, mappedTicket]
                })
                
                fetchSummary()
                
                // 大量更新時の通知スパムを防ぐため、ここでのToastは控えめにするか、
                // 同期処理以外の単発更新時のみに限定するのが理想ですが、一旦そのままにします
              }
            }
          )
          .subscribe()

        // 3. フレンドのチケット取得
        // useEffectでselectedFriendIdsの変更を検知して取得するため、ここでは削除
        /*
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

          const mappedFriendTickets: Ticket[] = (friendTicketsData || []).map(mapTicketData)
          setFriendTickets(mappedFriendTickets)
        }
        */

      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [refreshFriendRequests])

  // フレンド選択が変更されたらチケットを再取得
  useEffect(() => {
    setFriendTickets([])
    setFriendOffset(0)
    setFriendHasMore(true)
    fetchFriendTickets(false, filterState.selectedFriendIds)
  }, [filterState.selectedFriendIds])

  const hasActiveFilters = useMemo(() => {
    return (
      filterState.dateRange.from !== null ||
      filterState.dateRange.to !== null
    )
  }, [filterState])

  const applyFilters = (tickets: Ticket[]) => {
    return tickets.filter((ticket) => {
      if (filterState.displayMode !== "BOTH" && ticket.mode !== filterState.displayMode) return false
      if (!ticket.venue || (filterState.venues.length > 0 && !filterState.venues.includes(ticket.venue))) return false
      if (!ticket.race_date) return false // race_dateがないチケットは除外
      const ticketDate = new Date(ticket.race_date)
      if (filterState.dateRange.from && ticketDate < filterState.dateRange.from) return false
      if (filterState.dateRange.to && ticketDate > filterState.dateRange.to) return false
      return true
    })
  }

  const filteredMyTickets = useMemo(() => applyFilters(myTickets), [filterState, myTickets])
  const filteredFriendTickets = useMemo(() => {
    const byFriend = friendTickets.filter((t) => t.user_id && filterState.selectedFriendIds.includes(t.user_id))
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

  const refreshFriendData = async () => {
    try {
      const requests = await getFriendRequests()
      setPendingRequestCount(requests.length)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)
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
          avatar: p.avatar_url || ''
        }))
        setFriends(mappedFriends)
      } else {
        setFriends([])
      }
    } catch (error) {
      console.error('Error refreshing friend data:', error)
    }
  }

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
        races={dailyRaces}
        userProfile={userProfile}
        pendingRequestCount={pendingRequestCount}
        isFilterModalOpen={isFilterModalOpen}
        onFilterModalOpenChange={setIsFilterModalOpen}
      />

      {!isMobile && (
        <FilterSummary 
          filterState={filterState} 
          friends={friends} 
          className="max-w-[1800px] mx-auto" 
          onClick={() => setIsFilterModalOpen(true)}
        />
      )}

      {isMobile ? (
        <>
          <FilterSummary 
            filterState={filterState} 
            friends={friends} 
            onClick={() => setIsFilterModalOpen(true)}
          />

          <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

          <main className="pt-2 pb-6 px-3">
            {activeTab === "my" && (
              <>
                <AnalysisQueueList 
                  items={queueItems} 
                  onEdit={(item) => {
                    setEditingQueueItem(item)
                    setIsBettingWizardOpen(true)
                  }} 
                  onDelete={async (id) => {
                    try {
                      await deleteAnalysisQueue(id)
                      toast({ title: "削除しました" })
                    } catch (error) {
                      toast({ title: "削除に失敗しました", variant: "destructive" })
                    }
                  }} 
                />
                <RaceList 
                  races={myRaces} 
                title="MY RACES" 
                variant="my" 
                onSyncComplete={() => {
                  fetchMyTickets(false)
                  fetchSummary()
                }}
                isLoading={isLoading}
                hasMore={hasMore}
                onLoadMore={loadMoreMyTickets}
                summary={summary}
              />
              </>
            )}
            {activeTab === "friend" && (
              <RaceList 
                races={friendRaces} 
                title={friendRaceTitle} 
                variant="friend" 
                isLoading={isFriendLoading}
                hasMore={friendHasMore}
                onLoadMore={loadMoreFriendTickets}
                summary={friendSummary}
              />
            )}
            {activeTab === "analysis" && (
              <div className="glass-panel p-6 text-center">
                <p className="text-muted-foreground">分析機能は準備中です</p>
              </div>
            )}
          </main>
        </>
      ) : (
        <main className="pt-4 pb-6 px-6 max-w-[1800px] mx-auto">
          <AnalysisQueueList 
            items={queueItems} 
            onEdit={(item) => {
              setEditingQueueItem(item)
              setIsBettingWizardOpen(true)
            }} 
            onDelete={async (id) => {
              try {
                await deleteAnalysisQueue(id)
                toast({ title: "削除しました" })
              } catch (error) {
                toast({ title: "削除に失敗しました", variant: "destructive" })
              }
            }} 
          />
          {/* Race Lists - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <RaceList 
              races={myRaces} 
              title="MY RACES" 
              variant="my" 
              onSyncComplete={() => {
                fetchMyTickets(false)
                fetchSummary()
              }}
              isLoading={isLoading}
              hasMore={hasMore}
              onLoadMore={loadMoreMyTickets}
              summary={summary}
            />
            <RaceList 
              races={friendRaces} 
              title={friendRaceTitle} 
              variant="friend" 
              isLoading={isFriendLoading}
              hasMore={friendHasMore}
              onLoadMore={loadMoreFriendTickets}
              summary={friendSummary}
            />
          </div>
        </main>
      )}

      <FriendRequestModal 
        isOpen={isFriendModalOpen} 
        onClose={() => setIsFriendModalOpen(false)} 
        onUpdate={refreshFriendRequests}
      />

      <BettingWizard 
        open={isBettingWizardOpen} 
        onOpenChange={(open) => {
          setIsBettingWizardOpen(open)
          if (!open) {
            setEditingQueueItem(null)
            fetchMyTickets(false)
            fetchSummary()
          }
        }}
        defaultMode={editingQueueItem ? 'manual' : 'manual'}
        editingQueueItem={editingQueueItem}
      />
    </div>
  )
}
