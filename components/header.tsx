"use client"

import Link from "next/link"
import { Bell, Users, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FilterModal } from "./filter-modal"
import type { Friend, FilterState } from "@/types/ticket"

interface HeaderProps {
  friends: Friend[]
  filterState: FilterState
  onApplyFilters: (filters: FilterState) => void
  hasActiveFilters: boolean
  onOpenFriendModal: () => void
  nextRaceInfo?: { venue: string; raceNumber: number; time: string }
  userProfile?: { name: string; avatarUrl?: string } | null
  pendingRequestCount?: number
  isFilterModalOpen?: boolean
  onFilterModalOpenChange?: (open: boolean) => void
}

export function Header({
  friends,
  filterState,
  onApplyFilters,
  hasActiveFilters,
  onOpenFriendModal,
  nextRaceInfo,
  userProfile,
  pendingRequestCount = 0,
  isFilterModalOpen,
  onFilterModalOpenChange,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-border">
      <div className="max-w-[1800px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <h1 className="text-lg md:text-xl font-bold tracking-wider glitch-text">
              <span className="text-[#ff003c]">REMOTE</span>
              <span className="text-foreground ml-1">KEIBA</span>
            </h1>
            <div className="absolute -bottom-0.5 left-0 w-full h-[2px] bg-gradient-to-r from-[#ff003c] via-[#ff003c]/50 to-transparent" />
          </div>
          <span className="hidden md:block text-[9px] text-muted-foreground tracking-widest">v0.1.1-beta</span>
        </div>

        {nextRaceInfo && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 border border-[#00f3ff]/30 bg-[#00f3ff]/5">
            <span className="text-[10px] text-[#00f3ff] font-mono tracking-wider">NEXT:</span>
            <span className="text-sm font-bold text-foreground">
              {nextRaceInfo.venue} {nextRaceInfo.raceNumber}R
            </span>
            <span className="text-sm font-mono text-[#00f3ff]">{nextRaceInfo.time}</span>
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center gap-2 md:gap-3">
          <FilterModal
            friends={friends}
            filterState={filterState}
            onApplyFilters={onApplyFilters}
            hasActiveFilters={hasActiveFilters}
            open={isFilterModalOpen}
            onOpenChange={onFilterModalOpenChange}
          />

          {/* Notification Bell */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-white/5">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff003c] rounded-full neon-pulse" />
          </Button>

          {/* Friend Request Button */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-white/5" onClick={onOpenFriendModal}>
            <Users className="h-5 w-5 text-muted-foreground" />
            {pendingRequestCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff003c] text-[10px] font-bold text-white neon-pulse">
                {pendingRequestCount}
              </span>
            )}
          </Button>

          {/* User Profile */}
          <Link href="/profile/setup?mode=edit" className="flex items-center gap-2 pl-2 border-l border-border cursor-pointer hover:opacity-80 transition-opacity">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">{userProfile?.name || ""}</p>
            </div>
            <Avatar className="h-8 w-8 border border-[#00f3ff]/30">
              {userProfile?.avatarUrl && <AvatarImage src={userProfile.avatarUrl} />}
              <AvatarFallback className="bg-[#00f3ff]/10 text-[#00f3ff]">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  )
}
