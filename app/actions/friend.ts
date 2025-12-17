'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type UserSearchResult = {
  id: string
  display_name: string | null
  avatar_url: string | null
  status: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED'
}

export type FriendRequest = {
  id: string
  sender: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
  created_at: string
}

export type FriendUser = {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  if (!query.trim()) return []

  // 1. Search profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .ilike('display_name', `%${query}%`)
    .neq('id', user.id)
    .limit(20)

  if (profilesError || !profiles) return []

  // 2. Check friendship status
  const profileIds = profiles.map(p => p.id)
  
  if (profileIds.length === 0) return []

  const { data: sentRequests } = await supabase
    .from('friends')
    .select('friend_id, status')
    .eq('user_id', user.id)
    .in('friend_id', profileIds)

  const { data: receivedRequests } = await supabase
    .from('friends')
    .select('user_id, status')
    .eq('friend_id', user.id)
    .in('user_id', profileIds)

  const results: UserSearchResult[] = profiles.map(profile => {
    let status: UserSearchResult['status'] = 'NONE'

    const sent = sentRequests?.find(r => r.friend_id === profile.id)
    const received = receivedRequests?.find(r => r.user_id === profile.id)

    if (sent) {
        if (sent.status === 'ACCEPTED') status = 'ACCEPTED'
        else status = 'PENDING_SENT'
    } else if (received) {
        if (received.status === 'ACCEPTED') status = 'ACCEPTED'
        else status = 'PENDING_RECEIVED'
    }

    return {
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      status
    }
  })

  return results
}

export async function sendFriendRequest(friendId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const { error } = await supabase
    .from('friends')
    .insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'PENDING'
    })

  if (error) return { success: false, error: error.message }
  revalidatePath('/')
  return { success: true }
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // 1. Get pending requests
  const { data: requests, error: requestsError } = await supabase
    .from('friends')
    .select('id, user_id, created_at')
    .eq('friend_id', user.id)
    .eq('status', 'PENDING')

  if (requestsError) throw requestsError
  if (!requests || requests.length === 0) return []

  // 2. Get sender profiles
  const senderIds = requests.map(r => r.user_id)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', senderIds)

  if (profilesError) throw profilesError

  // 3. Combine data
  const profileMap = new Map(profiles?.map(p => [p.id, p]))

  return requests.map(req => ({
    id: req.id,
    sender: profileMap.get(req.user_id) || {
      id: req.user_id,
      display_name: 'Unknown',
      avatar_url: null
    },
    created_at: req.created_at
  }))
}

export async function acceptFriendRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  // 1. Get the request to find the sender
  const { data: request, error: fetchError } = await supabase
    .from('friends')
    .select('user_id, friend_id')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) return { success: false, error: "Request not found" }
  if (request.friend_id !== user.id) return { success: false, error: "Unauthorized" }

  // 2. Update status to ACCEPTED
  const { error: updateError } = await supabase
    .from('friends')
    .update({ status: 'ACCEPTED' })
    .eq('id', requestId)

  if (updateError) return { success: false, error: updateError.message }

  // 3. Insert reverse row
  const { error: insertError } = await supabase
    .from('friends')
    .insert({
      user_id: user.id,
      friend_id: request.user_id,
      status: 'ACCEPTED'
    })
    // Ignore duplicate key error if it somehow exists
    .select() 

  if (insertError && !insertError.message.includes('duplicate key')) {
      console.error("Error inserting reverse friend row:", insertError)
  }

  revalidatePath('/')
  return { success: true }
}

export async function rejectFriendRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('id', requestId)
    .eq('friend_id', user.id) // Security check

  if (error) return { success: false, error: error.message }
  revalidatePath('/')
  return { success: true }
}

export async function getFriends(): Promise<FriendUser[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: friends, error } = await supabase
    .from('friends')
    .select('friend_id, created_at')
    .eq('user_id', user.id)
    .eq('status', 'ACCEPTED')

  if (error) throw error
  if (!friends || friends.length === 0) return []

  const friendIds = friends.map(f => f.friend_id)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', friendIds)

  if (profilesError) throw profilesError

  const profileMap = new Map(profiles?.map(p => [p.id, p]))

  return friends.map(f => {
    const profile = profileMap.get(f.friend_id)
    return {
      id: f.friend_id,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      created_at: f.created_at
    }
  })
}

export async function removeFriend(friendId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const { error } = await supabase
    .from('friends')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

  if (error) return { success: false, error: "Failed to remove friend" }
  
  revalidatePath('/')
  return { success: true }
}
