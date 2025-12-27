"use client"

import { useState, useEffect, useMemo } from "react"
import { RaceData } from "@/app/actions/race"
import { format, differenceInSeconds, addMinutes } from "date-fns"
import { getNow } from "@/lib/time-utils"
import { PLACE_CODE_TO_NAME } from "@/lib/betting-utils"
import { cn } from "@/lib/utils"

interface RaceCountdownProps {
  races: RaceData[]
  onOpenSchedule: () => void
  className?: string
}

export function RaceCountdown({ races, onOpenSchedule, className }: RaceCountdownProps) {
  const [now, setNow] = useState(getNow())

  useEffect(() => {
    const timer = setInterval(() => setNow(getNow()), 1000)
    return () => clearInterval(timer)
  }, [])

  const nextRace = useMemo(() => {
    // Filter races that haven't started yet (or started very recently? usually we look for future start time)
    // The user wants "closest race to start".
    const upcoming = races.filter(r => {
      if (!r.post_time) return false
      return new Date(r.post_time) > now
    })

    if (upcoming.length === 0) return null

    return upcoming.sort((a, b) => {
      return new Date(a.post_time!).getTime() - new Date(b.post_time!).getTime()
    })[0]
  }, [races, now]) // Re-evaluate when 'now' changes to switch to next race automatically

  if (!nextRace || !nextRace.post_time) return null

  const raceTime = new Date(nextRace.post_time)
  const deadline = addMinutes(raceTime, -1)
  const secondsLeft = differenceInSeconds(deadline, now)
  
  // Format countdown
  const formatCountdown = (totalSeconds: number) => {
    if (totalSeconds < 0) return "CLOSED"
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const venueName = PLACE_CODE_TO_NAME[nextRace.place_code] || nextRace.place_code
  const timeStr = format(raceTime, "HH:mm")

  return (
    <div 
      className={cn(
        "items-center gap-2 px-3 py-1 border border-[#00f3ff]/30 bg-[#00f3ff]/5 cursor-pointer hover:bg-[#00f3ff]/10 transition-colors",
        className
      )}
      onClick={onOpenSchedule}
    >
      <span className="text-[10px] text-[#00f3ff] font-mono tracking-wider">NEXT:</span>
      <span className="text-sm font-bold text-foreground">
        {venueName} {nextRace.race_number}R
      </span>
      <span className="text-sm font-mono text-[#00f3ff] ml-1">
        {timeStr}
      </span>
      <span className="text-xs font-mono text-[#ff003c] ml-2">
        {formatCountdown(secondsLeft)}
      </span>
    </div>
  )
}
