"use client"

import { useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RaceData } from "@/app/actions/race"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

const PLACE_CODE_MAP: Record<string, string> = {
  "01": "札幌", "02": "函館", "03": "福島", "04": "新潟",
  "05": "東京", "06": "中山", "07": "中京", "08": "京都",
  "09": "阪神", "10": "小倉"
}

interface RaceScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  races: RaceData[]
  currentDate?: Date // For testing or specific date view
}

export function RaceScheduleModal({ isOpen, onClose, races, currentDate = new Date() }: RaceScheduleModalProps) {
  // Group races by venue (place_code)
  const scheduleData = useMemo(() => {
    const venues = Array.from(new Set(races.map(r => r.place_code))).sort()
    const grid: Record<number, Record<string, RaceData>> = {}

    // Initialize grid for 12 races
    for (let i = 1; i <= 12; i++) {
      grid[i] = {}
    }

    races.forEach(race => {
      if (grid[race.race_number]) {
        grid[race.race_number][race.place_code] = race
      }
    })

    return { venues, grid }
  }, [races])

  // Find the next race to highlight
  const nextRaceId = useMemo(() => {
    const now = new Date()
    const upcomingRaces = races.filter(r => {
      if (!r.post_time) return false
      return new Date(r.post_time) > now
    })
    
    if (upcomingRaces.length === 0) return null
    
    // Sort by time
    upcomingRaces.sort((a, b) => {
      const timeA = new Date(a.post_time!).getTime()
      const timeB = new Date(b.post_time!).getTime()
      return timeA - timeB
    })
    
    return upcomingRaces[0].id
  }, [races])

  const getRaceStatus = (race: RaceData) => {
    if (!race.post_time) return "unknown"
    const raceTime = new Date(race.post_time)
    const now = new Date()
    
    if (race.id === nextRaceId) return "next"
    if (raceTime < now) return "finished"
    return "future"
  }

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "--:--"
    return format(new Date(dateStr), "HH:mm")
  }

  const displayDate = races.length > 0 ? races[0].date : format(new Date(), "yyyy-MM-dd")

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-[#0a0a0a] border-[#333] text-white p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-[#333]">
          <DialogTitle className="text-lg font-bold">
            {displayDate} 出走時刻一覧
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-center text-sm">
              <thead>
                <tr>
                  <th className="p-3 border-b border-[#333] text-muted-foreground font-normal w-16">レース</th>
                  {scheduleData.venues.map(code => (
                    <th key={code} className="p-3 border-b border-[#333] text-muted-foreground font-normal">
                      {PLACE_CODE_MAP[code] || code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(raceNum => (
                  <tr key={raceNum} className="border-b border-[#333]/50 last:border-0">
                    <td className="p-3 text-muted-foreground">{raceNum}R</td>
                    {scheduleData.venues.map(code => {
                      const race = scheduleData.grid[raceNum][code]
                      if (!race) return <td key={code} className="p-3 text-muted-foreground">-</td>

                      const status = getRaceStatus(race)
                      
                      return (
                        <td key={code} className="p-0">
                          <div className={cn(
                            "py-3 px-2 transition-colors",
                            status === "finished" && "text-muted-foreground bg-[#1a1a1a]",
                            status === "next" && "bg-[#00ff00] text-black font-bold",
                            status === "future" && "text-white hover:bg-white/5"
                          )}>
                            {formatTime(race.post_time)}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
