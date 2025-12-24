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
      let { data: race, error: raceError } = await supabase
        .from('races')
        .select('id')
        .eq('date', bet.race_date)
        .eq('place_code', bet.place_code)
        .eq('race_number', bet.race_number)
        .single()

      if (raceError || !race) {
        // Try to create a placeholder race if not found
        // This is necessary when image analysis returns a race that hasn't been synced yet
        const { data: newRace, error: createError } = await supabase
            .from('races')
            .insert({
                date: bet.race_date,
                place_code: bet.place_code,
                race_number: bet.race_number,
                name: '未登録レース',
                status: 'SCHEDULED' 
            })
            .select('id')
            .single();
        
        if (createError || !newRace) {
             console.error('Failed to create placeholder race:', createError);
             throw new Error(`Race not found and failed to create for ${bet.race_date} ${bet.place_code} ${bet.race_number}R`)
        }
        race = newRace;
      }

      // 2. Insert or Update ticket
      let ticketData;
      let ticketError;

      const payload = {
          user_id: user.id,
          race_id: race.id,
          bet_type: bet.type,
          buy_type: bet.method,
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
          source: (bet.image_hash || bet.image_url) ? 'AI-OCR' : 'MANUAL',
          mode: bet.mode,
          receipt_unique_id: bet.image_hash, // Use image_hash as receipt_unique_id for AI-OCR
          image_url: bet.image_url
      };

      if (bet.id) {
        // Update
        // Reset payout related columns
        const updatePayload = {
            ...payload,
            payout: null
        };

        const { data, error } = await supabase
          .from('tickets')
          .update(updatePayload)
          .eq('id', bet.id)
          .eq('user_id', user.id) // Security check
          .select()
          .single()
        ticketData = data;
        ticketError = error;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('tickets')
          .insert(payload)
          .select()
          .single()
        ticketData = data;
        ticketError = error;
      }

      if (ticketError) {
        throw ticketError
      }

      results.push(ticketData)
    } catch (e: any) {
      console.error('Error saving bet:', e)
      errors.push({ bet, error: e.message })
    }
  }

  // Trigger race result update for affected dates
  const datesToUpdate = new Set(bets.map(b => b.race_date));
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (apiUrl) {
    for (const date of Array.from(datesToUpdate)) {
        try {
            // Call backend API to update results
            // We don't await this to avoid blocking the UI response, or we can await if critical
            // Given "recalculated", it might be better to await or at least fire and forget properly
            // Since this is a server action, we should probably await to ensure it's triggered
            await fetch(`${apiUrl}/api/races/update-results?target_date=${date}`, {
                method: 'POST',
            });
        } catch (e) {
            console.error(`Failed to trigger race result update for ${date}:`, e);
        }
    }
  }

  if (errors.length > 0) {
    return { success: false, results, errors }
  }

  return { success: true, results }
}

export async function deleteTicket(ticketId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId)
    .eq('user_id', user.id) // Security check

  if (error) {
    throw error
  }

  return { success: true }
}
