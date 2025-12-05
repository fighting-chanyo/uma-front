"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Trophy, X, Clock, ChevronRight } from "lucide-react"
import { CompactBetVisualizer } from "./compact-bet-visualizer"
import type { Ticket } from "@/types/ticket"

interface TicketAccordionItemProps {
  ticket: Ticket
  index: number
}

export const GRID_COLS = "grid grid-cols-[24px_80px_1fr_80px_24px]"

export function TicketAccordionItem({ ticket, index }: TicketAccordionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isWin = ticket.status === "WIN"
  const isLose = ticket.status === "LOSE"
  const isPending = ticket.status === "PENDING"

  // 買い方の日本語表記
  const buyTypeLabel = ticket.buyType === "BOX" ? "ボックス" : ticket.buyType === "NAGASHI" ? "流し" : "フォメ"

  return (
    <div
      className={cn(
        "relative transition-all duration-200",
        index % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent",
        "hover:bg-white/[0.05]",
        "border-b border-white/[0.06]",
        isWin && "border-l-2 border-l-[#00ff41]",
        isLose && "border-l-2 border-l-[#ff003c]/50",
        isPending && "border-l-2 border-l-[#00f3ff]",
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn("w-full px-2 py-2 text-left group", GRID_COLS, "items-center gap-2")}
      >
        {/* Column 1: Status Icon */}
        <StatusIcon status={ticket.status} />

        {/* Column 2: 場所+R (固定幅) */}
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground whitespace-nowrap">
            {ticket.venue} {ticket.raceNumber}R
          </span>
          <span className="text-[9px] font-mono text-muted-foreground">{ticket.raceDate.replace(/\//g, ".")}</span>
        </div>

        {/* Column 3: 券種 + 買い方 (可変幅) */}
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 bg-[#ff003c]/15 border border-[#ff003c]/30 text-[#ff003c] text-[9px] font-bold">
            {ticket.betType}
          </span>
          <span className="shrink-0 inline-flex items-center px-1 py-0.5 bg-white/5 border border-white/20 text-[9px] font-mono text-muted-foreground">
            {buyTypeLabel}
          </span>
          {ticket.userName && <span className="text-[9px] text-[#00f3ff]/70 truncate">@{ticket.userName}</span>}
        </div>

        {/* Column 4: 金額 + ステータス (固定幅) */}
        <div className="flex flex-col items-end">
          <span className="text-xs font-mono font-bold text-foreground">¥{ticket.amount.toLocaleString()}</span>
          {isWin && ticket.payout && (
            <span className="text-[10px] font-mono text-[#00ff41]">+¥{ticket.payout.toLocaleString()}</span>
          )}
        </div>

        {/* Column 5: 開閉アイコン */}
        <ChevronRight
          className={cn(
            "shrink-0 h-4 w-4 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-90",
          )}
        />
      </button>

      {/* 展開エリア（高密度ビジュアライザー） */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-out",
          isExpanded ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="px-3 py-2 ml-[30px] bg-black/40 border-l border-white/10">
          {/* レース名 */}
          <div className="text-[10px] text-muted-foreground mb-1">{ticket.raceName}</div>

          <CompactBetVisualizer content={ticket.content} buyType={ticket.buyType} />

          {/* WIN演出 */}
          {isWin && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#00ff41]/10 border border-[#00ff41]/40 win-animation">
                <Trophy className="h-3 w-3 text-[#00ff41]" />
                <span className="text-[10px] font-black text-[#00ff41] tracking-widest">WIN</span>
              </div>
              <span className="text-xs font-mono text-[#00ff41] ml-2">払戻: ¥{ticket.payout?.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === "WIN") {
    return (
      <div className="shrink-0 w-5 h-5 flex items-center justify-center bg-[#00ff41]/20 rounded-sm">
        <Trophy className="h-3 w-3 text-[#00ff41]" />
      </div>
    )
  }

  if (status === "LOSE") {
    return (
      <div className="shrink-0 w-5 h-5 flex items-center justify-center bg-[#ff003c]/10 rounded-sm opacity-50">
        <X className="h-3 w-3 text-[#ff003c]" />
      </div>
    )
  }

  return (
    <div className="shrink-0 w-5 h-5 flex items-center justify-center bg-[#00f3ff]/10 rounded-sm">
      <Clock className="h-3 w-3 text-[#00f3ff] animate-pulse" />
    </div>
  )
}
