import type { FilterState, Friend } from "@/types/ticket"
import { Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { VENUES } from "@/types/ticket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface FilterSummaryProps {
  filterState: FilterState
  friends: Friend[]
  className?: string
  onClick?: () => void
}

export function FilterSummary({ filterState, friends, className, onClick }: FilterSummaryProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  // 表示モード
  let displayModeText = null
  if (filterState.displayMode === "REAL") {
    displayModeText = "リアル馬券のみ"
  } else if (filterState.displayMode === "AIR") {
    displayModeText = "エア馬券のみ"
  }

  // 開催地
  let venueText = "開催地: 全て"
  if (filterState.venues.length > 0 && filterState.venues.length < VENUES.length) {
    venueText = `開催地: ${filterState.venues.join(", ")}`
  }

  // 日時
  let dateRangeText = "日時: 全期間"
  if (filterState.dateRange.from || filterState.dateRange.to) {
    if (filterState.dateRange.from && filterState.dateRange.to) {
      dateRangeText = `期間: ${formatDate(filterState.dateRange.from)} 〜 ${formatDate(filterState.dateRange.to)}`
    } else if (filterState.dateRange.from) {
      dateRangeText = `期間: ${formatDate(filterState.dateRange.from)} 〜`
    } else if (filterState.dateRange.to) {
      dateRangeText = `期間: 〜 ${formatDate(filterState.dateRange.to)}`
    }
  }

  // 選択されたフレンド
  const selectedFriends = friends.filter(f => filterState.selectedFriendIds.includes(f.id))

  return (
    <div className={className}>
      <div 
        className={cn(
          "flex items-center gap-4 text-xs text-muted-foreground bg-black/30 border-y border-white/10 px-6 py-2 overflow-x-auto whitespace-nowrap",
          onClick && "cursor-pointer hover:bg-white/5 transition-colors"
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-[#00f3ff]" />
          <span className="font-bold text-foreground">FILTER:</span>
        </div>

        {/* 表示モード */}
        {displayModeText && (
          <span className="bg-[#00f3ff]/10 text-[#00f3ff] px-2 py-0.5 rounded border border-[#00f3ff]/20">
            {displayModeText}
          </span>
        )}

        {/* 開催地 */}
        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
          {venueText}
        </span>

        {/* 日時 */}
        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
          {dateRangeText}
        </span>

        {/* フレンド */}
        {selectedFriends.length > 0 && (
          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            <span className="mr-1">FRIENDS:</span>
            <div className="flex -space-x-2">
              {selectedFriends.map((friend) => (
                <Avatar key={friend.id} className="h-5 w-5 border border-black ring-1 ring-white/20">
                  <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-[8px] bg-white/10">{friend.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
