import type { FilterState, Friend } from "@/types/ticket"
import { Filter } from "lucide-react"

interface FilterSummaryProps {
  filterState: FilterState
  friends: Friend[]
  className?: string
}

export function FilterSummary({ filterState, friends, className }: FilterSummaryProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  // Construct a single string for the date range if it exists
  let dateRangeString = ""
  if (filterState.dateRange.from && filterState.dateRange.to) {
    dateRangeString = `期間: ${formatDate(filterState.dateRange.from)} 〜 ${formatDate(filterState.dateRange.to)}`
  } else if (filterState.dateRange.from) {
    dateRangeString = `期間: ${formatDate(filterState.dateRange.from)} 〜`
  } else if (filterState.dateRange.to) {
    dateRangeString = `期間: 〜 ${formatDate(filterState.dateRange.to)}`
  }

  const filters = [
    filterState.displayMode !== "BOTH" && `表示: ${filterState.displayMode}`,
    filterState.venues.length > 0 && `開催地: ${filterState.venues.join(", ")}`,
    dateRangeString,
  ].filter(Boolean)

  if (filters.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-black/30 border-y border-white/10 px-6 py-2">
        <Filter className="w-4 h-4" />
        <span className="font-bold">フィルタ:</span>
        {filters.map((filter, index) => (
          <span key={index} className="bg-white/10 px-2 py-0.5 rounded">
            {filter}
          </span>
        ))}
      </div>
    </div>
  )
}
