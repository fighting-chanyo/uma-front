'use server'

import { createClient } from '@/lib/supabase/server'
import { TicketFormState } from '@/types/betting'

export async function saveBets(bets: (TicketFormState & { mode: 'REAL' | 'AIR' })[]) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const results = []
  const errors = []

  for (const bet of bets) {
    try {
      // 1. Find race_id
      const { data: race, error: raceError } = await supabase
        .from('races')
        .select('id')
        .eq('date', bet.race_date)
        .eq('place_code', bet.place_code)
        .eq('race_number', bet.race_number)
        .single()

      if (raceError || !race) {
        // If race not found, we might need to handle it. 
        // For now, let's assume we can't save a ticket for a non-existent race 
        // or we might need to create a placeholder race.
        // But usually races are imported.
        throw new Error(`Race not found for ${bet.race_date} ${bet.place_code} ${bet.race_number}R`)
      }

      // 2. Insert ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          race_id: race.id,
          content: {
            type: bet.type,
            method: bet.method,
            multi: bet.multi,
            selections: bet.selections,
            axis: bet.axis,
            partners: bet.partners,
            positions: bet.positions
          },
          amount_per_point: bet.amount,
          total_points: bet.total_points,
          total_cost: bet.total_cost,
          status: 'PENDING',
          source: bet.image_hash ? 'IMAGE_OCR' : 'MANUAL',
          mode: bet.mode,
          image_hash: bet.image_hash
        })
        .select()
        .single()

      if (ticketError) {
        throw ticketError
      }

      results.push(ticket)
    } catch (e: any) {
      console.error('Error saving bet:', e)
      errors.push({ bet, error: e.message })
    }
  }

  if (errors.length > 0) {
    return { success: false, results, errors }
  }

  return { success: true, results }
}
