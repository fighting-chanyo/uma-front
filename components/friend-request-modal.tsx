"use client"

import { useState } from "react"
import { X, Search, UserPlus, Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

interface FriendRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

const mockUsers = [
  { id: "1", name: "TurfMaster", rank: "A", status: "none", avatar: "cyber warrior" },
  { id: "2", name: "HorseWhisperer", rank: "S", status: "friend", avatar: "neon samurai" },
  { id: "3", name: "NightRider", rank: "B", status: "pending", avatar: "robot face" },
  { id: "4", name: "GoldenDerby", rank: "A", status: "none", avatar: "futuristic pilot" },
  { id: "5", name: "SprintKing", rank: "S", status: "none", avatar: "cyber ninja" },
]

export function FriendRequestModal({ isOpen, onClose }: FriendRequestModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState(mockUsers)

  if (!isOpen) return null

  const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSendRequest = (userId: string) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, status: "pending" } : user)))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-panel skew-container overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold tracking-wider">
              <span className="text-[#00f3ff]">FRIEND</span>
              <span className="text-foreground ml-1">SEARCH</span>
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">ユーザーを検索して友達申請を送る</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-sm transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ユーザー名で検索..."
              className="pl-10 bg-black/30 border-border focus:border-[#00f3ff] focus:ring-[#00f3ff]/20"
            />
          </div>
        </div>

        {/* User List */}
        <div className="p-4 max-h-80 overflow-y-auto space-y-3">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} onSendRequest={() => handleSendRequest(user.id)} />
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">ユーザーが見つかりません</p>
            </div>
          )}
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00f3ff] pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00f3ff] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00f3ff] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00f3ff] pointer-events-none" />
      </div>
    </div>
  )
}

interface UserCardProps {
  user: {
    id: string
    name: string
    rank: string
    status: string
    avatar: string
  }
  onSendRequest: () => void
}

function UserCard({ user, onSendRequest }: UserCardProps) {
  const isFriend = user.status === "friend"
  const isPending = user.status === "pending"

  return (
    <div className="flex items-center gap-3 p-3 bg-black/30 border border-border rounded-sm hover:border-[#00f3ff]/30 transition-colors">
      {/* Avatar */}
      <div className="relative">
        <Avatar className="h-12 w-12 border border-[#00f3ff]/30">
          <AvatarImage src={`/.jpg?height=48&width=48&query=${user.avatar}`} />
          <AvatarFallback className="bg-[#00f3ff]/10 text-[#00f3ff] font-bold">
            {user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {/* Rank badge */}
        <span
          className={cn(
            "absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm",
            user.rank === "S" && "bg-[#ff003c] text-white",
            user.rank === "A" && "bg-[#00f3ff] text-black",
            user.rank === "B" && "bg-white/20 text-foreground",
          )}
        >
          {user.rank}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1">
        <p className="font-bold text-foreground">{user.name}</p>
        <p className="text-[10px] text-muted-foreground">ID: {user.id.padStart(8, "0")}</p>
      </div>

      {/* Action Button */}
      {isFriend ? (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-sm">
          <Check className="h-4 w-4 text-[#00ff41]" />
          <span className="text-xs font-bold text-[#00ff41]">FRIEND</span>
        </div>
      ) : isPending ? (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-border rounded-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">PENDING</span>
        </div>
      ) : (
        <button
          onClick={onSendRequest}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#ff003c]/20 border border-[#ff003c]/40 rounded-sm hover:bg-[#ff003c]/30 transition-colors"
        >
          <UserPlus className="h-4 w-4 text-[#ff003c]" />
          <span className="text-xs font-bold text-[#ff003c]">ADD</span>
        </button>
      )}
    </div>
  )
}
