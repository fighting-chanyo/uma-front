"use client"

import { Ticket, Users, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  activeTab: "my" | "friend" | "analysis"
  onTabChange: (tab: "my" | "friend" | "analysis") => void
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const tabs = [
    { id: "my" as const, label: "自分", icon: Ticket },
    { id: "friend" as const, label: "友達", icon: Users },
    { id: "analysis" as const, label: "分析", icon: BarChart3 },
  ]

  return (
    <nav className="sticky top-16 z-40 glass-panel border-b border-border">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 relative transition-colors",
                isActive ? "text-[#ff003c]" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{tab.label}</span>

              {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#ff003c]" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
