"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { X, Search, UserPlus, Check, Clock, UserCheck, UserX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { 
  searchUsers, 
  sendFriendRequest, 
  getFriendRequests, 
  acceptFriendRequest, 
  rejectFriendRequest,
  getFriends,
  removeFriend,
  type UserSearchResult,
  type FriendRequest,
  type FriendUser
} from "@/app/actions/friend"

interface FriendRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function FriendRequestModal({ isOpen, onClose, onUpdate }: FriendRequestModalProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'requests' | 'friends'>('search')
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const fetchRequests = useCallback(async () => {
    try {
      const data = await getFriendRequests()
      setRequests(data)
    } catch (error) {
      console.error("Failed to fetch requests:", error)
    }
  }, [])

  const fetchFriends = useCallback(async () => {
    try {
      const data = await getFriends()
      setFriends(data)
    } catch (error) {
      console.error("Failed to fetch friends:", error)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchRequests()
      if (activeTab === 'friends') {
        fetchFriends()
      }
    }
  }, [isOpen, fetchRequests, activeTab, fetchFriends])

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests()
    } else if (activeTab === 'friends') {
      fetchFriends()
    }
  }, [activeTab, fetchRequests, fetchFriends])

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    
    startTransition(async () => {
      try {
        const results = await searchUsers(searchQuery)
        setSearchResults(results)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "検索エラー",
          description: "ユーザーの検索に失敗しました。",
        })
      }
    })
  }

  const handleSendRequest = async (userId: string) => {
    try {
      const result = await sendFriendRequest(userId)
      if (result.success) {
        toast({
          title: "申請送信",
          description: "友達申請を送信しました。",
        })
        // Update local state to reflect change
        setSearchResults(prev => prev.map(user => 
          user.id === userId ? { ...user, status: 'PENDING_SENT' } : user
        ))
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "送信エラー",
        description: "友達申請の送信に失敗しました。",
      })
    }
  }

  const handleAccept = async (requestId: string) => {
    try {
      const result = await acceptFriendRequest(requestId)
      if (result.success) {
        toast({
          title: "承認完了",
          description: "友達申請を承認しました。",
        })
        fetchRequests()
        onUpdate?.()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "承認エラー",
        description: "友達申請の承認に失敗しました。",
      })
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      const result = await rejectFriendRequest(requestId)
      if (result.success) {
        toast({
          title: "拒否完了",
          description: "友達申請を拒否しました。",
        })
        fetchRequests()
        onUpdate?.()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "拒否エラー",
        description: "友達申請の拒否に失敗しました。",
      })
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm("本当に友達を解除しますか？")) return
    try {
      const result = await removeFriend(friendId)
      if (result.success) {
        toast({
          title: "解除完了",
          description: "友達を解除しました。",
        })
        fetchFriends()
        onUpdate?.()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "友達解除に失敗しました。",
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg glass-panel skew-container overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold tracking-wider">
              <span className="text-[#00f3ff]">FRIEND</span>
              <span className="text-foreground ml-1">SYSTEM</span>
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">友達の検索と管理</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-sm transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          <button
            onClick={() => setActiveTab('search')}
            className={cn(
              "flex-1 py-3 text-sm font-bold transition-colors relative",
              activeTab === 'search' ? "text-[#00f3ff] bg-[#00f3ff]/5" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            SEARCH
            {activeTab === 'search' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f3ff]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={cn(
              "flex-1 py-3 text-sm font-bold transition-colors relative",
              activeTab === 'requests' ? "text-[#00f3ff] bg-[#00f3ff]/5" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            REQUESTS
            {requests.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-[#ff003c] text-white rounded-full">
                {requests.length}
              </span>
            )}
            {activeTab === 'requests' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f3ff]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={cn(
              "flex-1 py-3 text-sm font-bold transition-colors relative",
              activeTab === 'friends' ? "text-[#00f3ff] bg-[#00f3ff]/5" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            FRIENDS
            {activeTab === 'friends' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f3ff]" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'search' ? (
            <>
              <div className="p-4 border-b border-border shrink-0">
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="ユーザー名で検索..."
                      className="pl-10 bg-black/30 border-border focus:border-[#00f3ff] focus:ring-[#00f3ff]/20"
                    />
                  </div>
                  <Button 
                    onClick={handleSearch}
                    disabled={isPending}
                    className="bg-[#00f3ff]/20 text-[#00f3ff] hover:bg-[#00f3ff]/30 border border-[#00f3ff]/50"
                  >
                    {isPending ? "検索中..." : "検索"}
                  </Button>
                </div>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {searchResults.map((user) => (
                  <UserCard 
                    key={user.id} 
                    user={user} 
                    onSendRequest={() => handleSendRequest(user.id)} 
                  />
                ))}
                {searchResults.length === 0 && searchQuery && !isPending && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">ユーザーが見つかりません</p>
                  </div>
                )}
                {searchResults.length === 0 && !searchQuery && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">ユーザー名を入力して検索してください</p>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'requests' ? (
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onAccept={() => handleAccept(request.id)}
                  onReject={() => handleReject(request.id)}
                />
              ))}
              {requests.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">届いている友達申請はありません</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {friends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onRemove={() => handleRemoveFriend(friend.id)}
                />
              ))}
              {friends.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">友達はいません</p>
                </div>
              )}
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

function UserCard({ user, onSendRequest }: { user: UserSearchResult; onSendRequest: () => void }) {
  const isFriend = user.status === 'ACCEPTED'
  const isPending = user.status === 'PENDING_SENT' || user.status === 'PENDING_RECEIVED'

  return (
    <div className="flex items-center gap-3 p-3 bg-black/30 border border-border rounded-sm hover:border-[#00f3ff]/30 transition-colors">
      <div className="relative">
        <Avatar className="h-12 w-12 border border-[#00f3ff]/30">
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback className="bg-[#00f3ff]/10 text-[#00f3ff] font-bold">
            {(user.display_name || 'UN').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1">
        <p className="font-bold text-foreground">{user.display_name || 'Unknown'}</p>
        <p className="text-[10px] text-muted-foreground">ID: {user.id.slice(0, 8)}</p>
      </div>

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

function RequestCard({ 
  request, 
  onAccept, 
  onReject 
}: { 
  request: FriendRequest; 
  onAccept: () => void; 
  onReject: () => void; 
}) {
  const user = request.sender
  return (
    <div className="flex items-center gap-3 p-3 bg-black/30 border border-border rounded-sm hover:border-[#00f3ff]/30 transition-colors">
      <div className="relative">
        <Avatar className="h-12 w-12 border border-[#00f3ff]/30">
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback className="bg-[#00f3ff]/10 text-[#00f3ff] font-bold">
            {(user.display_name || 'UN').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1">
        <p className="font-bold text-foreground">{user.display_name || 'Unknown'}</p>
        <p className="text-[10px] text-muted-foreground">
          {new Date(request.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onAccept}
          className="p-2 bg-[#00ff41]/20 border border-[#00ff41]/40 rounded-sm hover:bg-[#00ff41]/30 transition-colors"
          title="承認"
        >
          <UserCheck className="h-4 w-4 text-[#00ff41]" />
        </button>
        <button
          onClick={onReject}
          className="p-2 bg-[#ff003c]/20 border border-[#ff003c]/40 rounded-sm hover:bg-[#ff003c]/30 transition-colors"
          title="拒否"
        >
          <UserX className="h-4 w-4 text-[#ff003c]" />
        </button>
      </div>
    </div>
  )
}

function FriendCard({ friend, onRemove }: { friend: FriendUser; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-black/30 border border-border rounded-sm hover:border-[#00f3ff]/30 transition-colors">
      <div className="relative">
        <Avatar className="h-12 w-12 border border-[#00f3ff]/30">
          <AvatarImage src={friend.avatar_url || undefined} />
          <AvatarFallback className="bg-[#00f3ff]/10 text-[#00f3ff] font-bold">
            {(friend.display_name || 'UN').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1">
        <p className="font-bold text-foreground">{friend.display_name || 'Unknown'}</p>
        <p className="text-[10px] text-muted-foreground">ID: {friend.id.slice(0, 8)}</p>
      </div>

      <button
        onClick={onRemove}
        className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-sm hover:bg-red-500/20 transition-colors"
      >
        <UserX className="h-4 w-4 text-red-500" />
        <span className="text-xs font-bold text-red-500">REMOVE</span>
      </button>
    </div>
  )
}

