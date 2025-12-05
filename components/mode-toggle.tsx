"use client"

import { cn } from "@/lib/utils"

interface ModeToggleProps {
  isAirMode: boolean
  onToggle: () => void
}

export function ModeToggle({ isAirMode, onToggle }: ModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="relative flex items-center h-8 md:h-9 px-1 bg-black/50 border border-border rounded-sm overflow-hidden group"
    >
      {/* Background indicator */}
      <div
        className={cn(
          "absolute h-full w-1/2 transition-all duration-300 ease-out",
          isAirMode
            ? "left-0 bg-gradient-to-r from-[#00f3ff]/20 to-transparent"
            : "left-1/2 bg-gradient-to-l from-[#ff003c]/20 to-transparent",
        )}
      />

      {/* AIR Mode */}
      <div
        className={cn(
          "relative z-10 px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold tracking-wider transition-colors",
          isAirMode ? "text-[#00f3ff]" : "text-muted-foreground",
        )}
      >
        <span className="hidden md:inline">AIR</span>
        <span className="md:hidden">A</span>
        {isAirMode && (
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#00f3ff] neon-pulse" />
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-border" />

      {/* REAL Mode */}
      <div
        className={cn(
          "relative z-10 px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold tracking-wider transition-colors",
          !isAirMode ? "text-[#ff003c]" : "text-muted-foreground",
        )}
      >
        <span className="hidden md:inline">REAL</span>
        <span className="md:hidden">R</span>
        {!isAirMode && (
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#ff003c] neon-pulse" />
        )}
      </div>

      {/* Glow effect */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
          isAirMode ? "neon-glow-blue" : "neon-glow-red",
        )}
      />
    </button>
  )
}
