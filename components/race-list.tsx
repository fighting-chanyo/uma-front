"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { RaceAccordionItem } from "./race-accordion-item"
import { Button } from "@/components/ui/button"
import { RefreshCw, ScanLine, PenLine, Loader2 } from "lucide-react"
import type { Race } from "@/types/ticket"

interface RaceListProps {
  races: Race[]
  title: string
  variant?: "my" | "friend"
}

export function RaceList({ races, title, variant = "my" }: RaceListProps) {
  const [isSyncing, setIsSyncing] = useState(false)

  const { totalBet, totalReturn, winCount } = useMemo(() => {
    let bet = 0
    let ret = 0
    const winningRaceIds = new Set<string>() // レース単位での勝利をカウントするため

    races.forEach((race) => {
      race.tickets.forEach((ticket) => {
        // variantとticket.ownerをチェックして、対象のチケットのみ集計
        if (
          (variant === "my" && ticket.owner === "me") ||
          (variant === "friend" && ticket.owner === "friend")
        ) {
          bet += ticket.total_cost // ERROR: `amount`から`total_cost`に修正
          ret += ticket.payout || 0
          if (ticket.status === "WIN") {
            winningRaceIds.add(race.raceId) // 的中したレースIDをセットに追加
          }
        }
      })
    })

    return { totalBet: bet, totalReturn: ret, winCount: winningRaceIds.size }
  }, [races, variant])

  const balance = totalReturn - totalBet

  const handleSync = async (type: "ipat" | "ocr" | "manual") => {
    setIsSyncing(true)
    await new Promise((r) => setTimeout(r, 2000))
    setIsSyncing(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-stretch gap-2 mb-3">
        <div className="glass-panel p-3 md:p-4 hud-border relative overflow-hidden flex-1">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f3ff]/50" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f3ff]/50" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f3ff]/50" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f3ff]/50" />

          <div className="flex flex-col justify-between h-full">
            {/* Title + Financial Info */}
            <div className="flex items-center gap-3 md:gap-4 flex-wrap">
              <h2 className="text-sm md:text-base font-bold tracking-[0.15em] text-foreground uppercase">{title}</h2>
              <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono">
                <span className="text-[#ff003c]">Bet: ¥{totalBet.toLocaleString()}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-[#00ff41]">Ret: ¥{totalReturn.toLocaleString()}</span>
                <span
                  className={cn(
                    "font-bold px-1.5 py-0.5 border",
                    balance >= 0
                      ? "text-[#00ff41] border-[#00ff41]/30 bg-[#00ff41]/10"
                      : "text-[#ff003c] border-[#ff003c]/30 bg-[#ff003c]/10",
                  )}
                >
                  {balance >= 0 ? "+" : ""}¥{balance.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1 font-mono tracking-wider">
              {races.length} RACES • {winCount} WINS
            </p>
          </div>
        </div>

        {variant === "my" && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full px-4 py-2 text-[#00f3ff] hover:bg-[#00f3ff]/20 hover:text-[#00f3ff] border border-[#00f3ff]/50"
              onClick={() => handleSync("ipat")}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="w-5 h-5 mb-1 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5 mb-1" />
              )}
              <span className="text-[10px] font-mono font-bold tracking-widest">IPAT 同期</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full px-4 py-2 text-[#00f3ff] hover:bg-[#00f3ff]/20 hover:text-[#00f3ff] border border-[#00f3ff]/50"
              onClick={() => handleSync("ocr")}
              disabled={isSyncing}
            >
              <ScanLine className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-mono font-bold tracking-widest">画像認識</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full px-4 py-2 text-[#00f3ff] hover:bg-[#00f3ff]/20 hover:text-[#00f3ff] border border-[#00f3ff]/50"
              onClick={() => handleSync("manual")}
              disabled={isSyncing}
            >
              <PenLine className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-mono font-bold tracking-widest">手入力</span>
            </Button>
          </div>
        )}
      </div>

      {/* Race List */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)] border border-white/10 bg-black/20">
        <div
          className={cn(
            "sticky top-0 z-10 px-3 py-2 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10",
            "grid grid-cols-[140px_1fr_90px_24px] gap-3 items-center",
            "text-[9px] font-mono text-muted-foreground tracking-wider uppercase",
          )}
        >
          <span>DATE / RACE</span>
          <span>NAME</span>
          <span className="text-right">P&L</span>
          <span></span>
        </div>

        {/* Race Items */}
        {races.length > 0 ? (
          races.map((race, index) => (
            <RaceAccordionItem key={race.raceId} race={race} index={index} variant={variant} />
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm">NO DATA FOUND</div>
        )}
      </div>
    </div>
  )
}
