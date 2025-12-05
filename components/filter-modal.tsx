"use client"

import { useState } from "react"
import { Filter, Check, CalendarDays, Users, MapPin, Layers } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Friend, FilterState } from "@/types/ticket"
import { VENUES } from "@/types/ticket"

interface FilterModalProps {
  friends: Friend[]
  filterState: FilterState
  onApplyFilters: (filters: FilterState) => void
  hasActiveFilters: boolean
}

export function FilterModal({ friends, filterState, onApplyFilters, hasActiveFilters }: FilterModalProps) {
  const [open, setOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<FilterState>(filterState)

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalFilters(filterState)
    }
    setOpen(isOpen)
  }

  const handleApply = () => {
    onApplyFilters(localFilters)
    setOpen(false)
  }

  const handleSelectAllFriends = () => {
    if (localFilters.selectedFriendIds.length === friends.length) {
      setLocalFilters((prev) => ({ ...prev, selectedFriendIds: [] }))
    } else {
      setLocalFilters((prev) => ({ ...prev, selectedFriendIds: friends.map((f) => f.id) }))
    }
  }

  const handleToggleFriend = (id: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      selectedFriendIds: prev.selectedFriendIds.includes(id)
        ? prev.selectedFriendIds.filter((fid) => fid !== id)
        : [...prev.selectedFriendIds, id],
    }))
  }

  const handleToggleVenue = (venue: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      venues: prev.venues.includes(venue) ? prev.venues.filter((v) => v !== venue) : [...prev.venues, venue],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 hover:bg-white/5 border border-white/10 hover:border-[#00f3ff]/50 transition-colors"
        >
          <Filter className="h-5 w-5 text-muted-foreground" />
          {hasActiveFilters && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#ff003c] rounded-full neon-pulse" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 max-w-md">
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
                  onClick={() => setLocalFilters((prev) => ({ ...prev, displayMode: mode }))}
                  className={cn(
                    "py-2 text-xs font-bold tracking-wider transition-all",
                    localFilters.displayMode === mode
                      ? mode === "REAL"
                        ? "bg-[#ff003c]/20 text-[#ff003c] border border-[#ff003c]/50"
                        : mode === "AIR"
                          ? "bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/50"
                          : "bg-white/10 text-foreground border border-white/30"
                      : "text-muted-foreground hover:bg-white/5",
                  )}
                >
                  {mode === "BOTH" ? "ALL" : mode}
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
                onClick={handleSelectAllFriends}
                className="text-[10px] text-[#00f3ff] hover:text-[#00f3ff]/80 font-mono"
              >
                {localFilters.selectedFriendIds.length === friends.length ? "DESELECT ALL" : "SELECT ALL"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {friends.map((friend) => {
                const isSelected = localFilters.selectedFriendIds.includes(friend.id)
                return (
                  <button
                    key={friend.id}
                    onClick={() => handleToggleFriend(friend.id)}
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
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="bg-black/50 border border-white/10 px-3 py-2 text-xs text-foreground focus:border-[#00f3ff]/50 focus:outline-none"
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, from: e.target.value ? new Date(e.target.value) : undefined },
                  }))
                }
              />
              <input
                type="date"
                className="bg-black/50 border border-white/10 px-3 py-2 text-xs text-foreground focus:border-[#00f3ff]/50 focus:outline-none"
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, to: e.target.value ? new Date(e.target.value) : undefined },
                  }))
                }
              />
            </div>
          </div>

          {/* Venue Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground tracking-wider">
              <MapPin className="h-4 w-4" />
              VENUE
            </div>
            <div className="grid grid-cols-5 gap-1">
              {VENUES.map((venue) => {
                const isSelected = localFilters.venues.includes(venue)
                return (
                  <button
                    key={venue}
                    onClick={() => handleToggleVenue(venue)}
                    className={cn(
                      "py-1.5 text-[10px] font-bold transition-all border",
                      isSelected
                        ? "bg-[#ff003c]/15 border-[#ff003c]/50 text-[#ff003c]"
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
          onClick={handleApply}
          className="w-full bg-[#ff003c] hover:bg-[#ff003c]/80 text-white font-bold tracking-wider py-5 skew-x-[-3deg]"
        >
          <span className="skew-x-[3deg]">APPLY FILTERS</span>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
