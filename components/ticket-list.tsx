"use client"

import { cn } from "@/lib/utils"
import { TicketAccordionItem, GRID_COLS } from "./ticket-accordion-item"
import type { Ticket } from "@/types/ticket"

interface TicketListProps {
  tickets: Ticket[]
  title: string
  isOwn?: boolean
}

export function TicketList({ tickets, title, isOwn }: TicketListProps) {
  const winCount = tickets.filter((t) => t.status === "WIN").length
  const totalPayout = tickets.reduce((sum, t) => sum + (t.payout || 0), 0)
  const totalBet = tickets.reduce((sum, t) => sum + t.total_cost, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Section Header - HUD Style */}
      <div className="glass-panel p-4 mb-3 hud-border relative overflow-hidden">
        {/* Corner decoration */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f3ff]/50" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f3ff]/50" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f3ff]/50" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f3ff]/50" />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-[0.2em] text-foreground uppercase">{title}</h2>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono tracking-wider">
              {tickets.length} ENTRIES • {winCount} WINS
            </p>
          </div>

          {isOwn && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-mono">PROFIT/LOSS</p>
              <p
                className={cn(
                  "text-lg font-bold font-mono",
                  totalPayout - totalBet >= 0 ? "text-[#00ff41]" : "text-[#ff003c]",
                )}
              >
                {totalPayout - totalBet >= 0 ? "+" : ""}¥{(totalPayout - totalBet).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Accordion List */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)] border border-white/10 bg-black/20">
        {/* List Header - CSS Grid同期 */}
        <div
          className={cn(
            "sticky top-0 z-10 px-2 py-1.5 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10",
            "text-[9px] font-mono text-muted-foreground tracking-wider uppercase",
            GRID_COLS,
            "items-center gap-2",
          )}
        >
          <span>ST</span>
          <span>PLACE</span>
          <span>TYPE / INFO</span>
          <span className="text-right">AMOUNT</span>
          <span></span>
        </div>

        {/* Accordion Items */}
        {tickets.length > 0 ? (
          tickets.map((ticket, index) => <TicketAccordionItem key={ticket.id} ticket={ticket} index={index} />)
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm">NO DATA FOUND</div>
        )}
      </div>
    </div>
  )
}
