"use client"

import { useState, useEffect, useCallback } from "react"
import { Filter, Check, CalendarDays, Users, MapPin, Layers } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Friend, FilterState } from "@/types/ticket"
import { VENUES } from "@/types/ticket"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { date, z } from "zod"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

// react-datepicker とそのCSSをインポート
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { ja } from "date-fns/locale/ja"

// 日本語ロケールを登録
registerLocale("ja", ja)

interface FilterModalProps {
  friends: Friend[]
  filterState: FilterState
  onApplyFilters: (filters: FilterState) => void
  hasActiveFilters: boolean
}

const formSchema = z.object({
  friendIds: z.array(z.string()).optional(),
  date: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional(),
  venue: z.array(z.string()).optional(),
  displayMode: z.enum(["REAL", "AIR", "BOTH"]).optional(),
})

export function FilterModal({ friends, filterState, onApplyFilters, hasActiveFilters }: FilterModalProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [date, setDate] = useState<DateRange | undefined>()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const createQueryString = useCallback(() => {
    const query: { [key: string]: string | string[] | undefined } = {}
    const values = form.getValues()

    // フレンドID
    if (values.friendIds?.length) {
      query.friendIds = values.friendIds
    }

    // 日付
    if (values.date?.from && values.date.to) {
      query.date = `${values.date.from.toISOString()},${values.date.to.toISOString()}`
    }

    // 会場
    if (values.venue?.length) {
      query.venue = values.venue
    }

    // 表示モード
    if (values.displayMode) {
      query.displayMode = values.displayMode
    }

    return query
  }, [form])

  useEffect(() => {
    const from = searchParams.get("date")?.split(",")[0]
    const to = searchParams.get("date")?.split(",")[1]

    if (from && to) {
      setDate({ from: new Date(from), to: new Date(to) })
      form.setValue('date', { from: new Date(from), to: new Date(to) })
    }
  }, [searchParams, form])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 hover:bg-white/5 border border-white/10 hover:border-[#00f3ff]/50 transition-colors"
        >
          <Filter className="h-5 w-5 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 max-w-md" id="filter-modal-content">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-bold tracking-wider">
            <Filter className="h-5 w-5 text-[#00f3ff]" />
            FILTER OPTIONS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Display Mode Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground tracking-wider">
              <Layers className="h-4 w-4" />
              DISPLAY MODE
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 bg-black/50 border border-white/10">
              {(["REAL", "AIR", "BOTH"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => form.setValue("displayMode", mode)}
                  className={cn(
                    "py-2 text-xs font-bold tracking-wider transition-all",
                    filterState.displayMode === mode
                      ? "bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/50"
                      : "text-muted-foreground hover:bg-white/5",
                  )}
                >
                  {mode === "REAL" ? "実際の購入データのみ" : mode === "AIR" ? "エア購入馬券のみ" : "すべて表示"}
                </button>
              ))}
            </div>
          </div>

          {/* Friends Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground tracking-wider">
                <Users className="h-4 w-4" />
                FRIENDS
              </div>
              <button
                onClick={() => {
                  const allSelected = filterState.selectedFriendIds.length === friends.length
                  form.setValue("friendIds", allSelected ? [] : friends.map((f) => f.id))
                }}
                className="text-[10px] text-[#00f3ff] hover:text-[#00f3ff]/80 font-mono"
              >
                {filterState.selectedFriendIds.length === friends.length ? "DESELECT ALL" : "SELECT ALL"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {friends.map((friend) => {
                const isSelected = filterState.selectedFriendIds.includes(friend.id)
                return (
                  <button
                    key={friend.id}
                    onClick={() => {
                      const newSelected = isSelected
                        ? filterState.selectedFriendIds.filter((fid) => fid !== friend.id)
                        : [...filterState.selectedFriendIds, friend.id]
                      form.setValue("friendIds", newSelected)
                    }}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 border transition-all",
                      isSelected
                        ? "bg-[#00f3ff]/10 border-[#00f3ff]/50 text-[#00f3ff]"
                        : "bg-black/30 border-white/10 text-muted-foreground hover:border-white/30",
                    )}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-[8px] bg-white/10">{friend.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{friend.name}</span>
                    {isSelected && <Check className="h-3 w-3" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date Range Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground tracking-wider">
              <CalendarDays className="h-4 w-4" />
              DATE RANGE
            </div>
            <DatePicker
              selectsRange={true}
              startDate={date?.from}
              endDate={date?.to}
              onChange={(dates: [Date | null, Date | null]) => {
                setDate(dates[0] && dates[1] ? { from: dates[0], to: dates[1] } : undefined)
                form.setValue('date', dates[0] && dates[1] ? { from: dates[0], to: dates[1] } : undefined)
              }}
              isClearable={true}
              dateFormat="yyyy/MM/dd"
              locale="ja"
              className="w-full bg-black/50 border border-white/10 px-3 py-2 text-xs text-foreground focus:border-[#00f3ff]/50 focus:outline-none"
              portalId="filter-modal-content"
              popperPlacement="bottom"
            />
          </div>

          {/* Venue Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground tracking-wider">
              <MapPin className="h-4 w-4" />
              VENUE
            </div>
            <div className="grid grid-cols-5 gap-1">
              {VENUES.map((venue) => {
                const isSelected = filterState.venues.includes(venue)
                return (
                  <button
                    key={venue}
                    onClick={() => {
                      const newVenues = isSelected
                        ? filterState.venues.filter((v) => v !== venue)
                        : [...filterState.venues, venue]
                      form.setValue("venue", newVenues)
                    }}
                    className={cn(
                      "py-1.5 text-[10px] font-bold transition-all border",
                      isSelected
                        ? "bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/50"
                        : "bg-black/30 border-white/10 text-muted-foreground hover:border-white/30",
                    )}
                  >
                    {venue}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <Button
          onClick={() => {
            onApplyFilters(form.getValues())
            router.push({ pathname, query: createQueryString() })
          }}
          className="w-full bg-[#ff003c] hover:bg-[#ff003c]/80 text-white font-bold tracking-wider py-5 skew-x-[-3deg]"
        >
          <span className="skew-x-[3deg]">APPLY FILTERS</span>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
