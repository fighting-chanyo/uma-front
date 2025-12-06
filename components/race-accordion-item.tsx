"use client"

import { useState } from "react"
import { ChevronDown, Trophy, Ghost } from "lucide-react"
import { cn } from "@/lib/utils"
import { CompactBetVisualizer } from "./compact-bet-visualizer"
import type { Race, Ticket } from "@/types/ticket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface RaceAccordionItemProps {
  race: Race
  index: number
  variant?: "my" | "friend"
}

const statusConfig = {
  PENDING: { border: "border-l-[#00f3ff]", bg: "bg-[#00f3ff]/5", text: "text-[#00f3ff]", label: "PENDING" },
  WIN: { border: "border-l-[#00ff41]", bg: "bg-[#00ff41]/5", text: "text-[#00ff41]", label: "WIN" },
  LOSE: { border: "border-l-[#ff003c]/50", bg: "bg-[#ff003c]/5", text: "text-[#ff003c]/50", label: "LOSE" },
}

export function RaceAccordionItem({ race, index, variant = "my" }: RaceAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const config = statusConfig[race.status]
  const balance = race.totalReturn - race.totalBet
  const myTickets = race.tickets.filter((t) => t.owner === "me")
  const friendTickets = race.tickets.filter((t) => t.owner === "friend")

  const datePart = race.raceId.split("-")[0]
  // 年を含めた形式に変更 (slice(5)を削除)
  const formattedDate = datePart || ""

  const friendTicketsByUser = friendTickets.reduce(
    (acc, ticket) => {
      const key = ticket.userId || ticket.userName || "Unknown"
      if (!acc[key]) {
        acc[key] = {
          userName: ticket.userName || "Unknown",
          userAvatar: ticket.userAvatar,
          tickets: [],
        }
      }
      acc[key].tickets.push(ticket)
      return acc
    },
    {} as Record<string, { userName: string; userAvatar?: string; tickets: (Ticket & { owner: "me" | "friend" })[] }>,
  )

  return (
    <div className={cn(index % 2 === 0 ? "bg-white/[0.01]" : "bg-transparent")}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full grid grid-cols-[140px_1fr_90px_24px] gap-3 px-3 py-3 items-center",
          "hover:bg-white/[0.03] transition-colors text-left",
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-mono">{formattedDate}</span>
          <span className="text-sm md:text-base font-bold text-foreground whitespace-nowrap tracking-wide">
            {race.venue} {race.raceNumber}R
          </span>
        </div>

        {/* Race Name */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs md:text-sm font-medium text-foreground truncate">{race.raceName}</span>
          {race.status === "WIN" && <Trophy className="w-4 h-4 text-[#00ff41] flex-shrink-0" />}
        </div>

        {/* Balance */}
        <div className="text-right">
          <span
            className={cn("text-xs md:text-sm font-mono font-bold", balance >= 0 ? "text-[#00ff41]" : "text-[#ff003c]")}
          >
            {balance >= 0 ? "+" : ""}¥{balance.toLocaleString()}
          </span>
        </div>

        {/* Chevron */}
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="border-t border-white/5 bg-black/30">
          {variant === "my" && myTickets.length > 0 && (
            <div>
              {myTickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}

          {variant === "friend" && friendTickets.length > 0 && (
            <div>
              {Object.entries(friendTicketsByUser).map(([userId, { userName, userAvatar, tickets }]) => (
                <div key={userId} className="border-b border-white/5 last:border-b-0">
                  {/* User Sub-header */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02]">
                    <Avatar className="w-5 h-5 border border-white/20">
                      <AvatarImage src={userAvatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-[#ff003c]/20 text-[#ff003c] text-[8px]">
                        {userName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-mono text-white/70">{userName}</span>
                    <span className="text-[9px] text-muted-foreground">({tickets.length})</span>
                  </div>
                  {/* User's tickets */}
                  {tickets.map((ticket) => (
                    <TicketRow key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TicketRow({ ticket }: { ticket: Ticket & { owner: "me" | "friend" } }) {
  const statusColor = {
    PENDING: "bg-[#00f3ff]",
    WIN: "bg-[#00ff41]",
    LOSE: "bg-[#ff003c]/40",
  }

  const isAir = ticket.mode === "AIR"

  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr_80px] gap-3 px-3 py-1 items-center",
        "transition-colors",
        isAir
          ? [
              "bg-white/[0.08]", // 背景色を明るめに変更
              "border-l-2 border-dashed border-white/40", // ボーダーを少し強調
            ]
          : ["hover:bg-white/[0.02]", ticket.owner === "friend" && "bg-[#ff003c]/[0.02]"],
      )}
    >
      {/* Status + Bet Type + Mode Badge */}
      <div className="flex items-center gap-2">
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusColor[ticket.status])} />
        {isAir && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 border border-dashed text-white/70 border-white/40 bg-white/5">
            エア
          </span>
        )}
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 border",
            isAir
              ? "text-yellow-400/70 border-yellow-400/30 bg-yellow-400/5" // エア馬券の券種も少し強調
              : "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
          )}
        >
          {ticket.betType}
        </span>
      </div>

      {/* Bet Content */}
      <div className="min-w-0">
        <CompactBetVisualizer content={ticket.content} buyType={ticket.buyType} />
      </div>

      {/* Amount / Payout */}
      <div className="text-right text-xs font-mono flex items-center justify-end gap-3 whitespace-nowrap">
        <span className="text-muted-foreground">¥{ticket.amount.toLocaleString()}</span>
        
        {ticket.status === "WIN" && ticket.payout && (
          <span className="text-[#00ff41] font-bold">
            WIN:¥{ticket.payout.toLocaleString()}
          </span>
        )}
        {ticket.status === "LOSE" && <span className="text-[#ff003c]">LOSE</span>}
      </div>
    </div>
  )
}
