'use server'

import { createClient } from '@/lib/supabase/server'

export interface RaceData {
  id: string
  date: string
  place_code: string
  race_number: number
  name: string | null
  status: string
  post_time: string | null
  result_1st: string | null
  result_2nd: string | null
  result_3rd: string | null
}

export async function getDailyRaces(dateStr: string): Promise<RaceData[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('races')
    .select('*')
    .eq('date', dateStr)
    .order('place_code', { ascending: true })
    .order('race_number', { ascending: true })
  
  if (error) {
    console.error('Error fetching races:', error)
    return []
  }
  
  return data as RaceData[]
}
