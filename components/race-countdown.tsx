"use client"

import { useState, useEffect, useMemo } from "react"
import { RaceData } from "@/app/actions/race"
import { format, differenceInSeconds, addMinutes } from "date-fns"

const PLACE_CODE_MAP: Record<string, string> = {
  "01": "札幌", "02": "函館", "03": "福島", "04": "新潟",
  "05": "東京", "06": "中山", "07": "中京", "08": "京都",
  "09": "阪神", "10": "小倉"
}

interface RaceCountdownProps {
  races: RaceData[]
  onOpenSchedule: () => void
}

export function RaceCountdown({ races, onOpenSchedule }: RaceCountdownProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
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

  const venueName = PLACE_CODE_MAP[nextRace.place_code] || nextRace.place_code
  const timeStr = format(raceTime, "HH:mm")

  return (
    <div 
      className="hidden md:flex items-center gap-2 px-3 py-1 border border-[#00f3ff]/30 bg-[#00f3ff]/5 cursor-pointer hover:bg-[#00f3ff]/10 transition-colors"
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
