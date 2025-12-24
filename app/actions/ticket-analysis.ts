'use server'

import { createClient } from '@/lib/supabase/server'
import { AnalysisQueueItem } from '@/types/analysis'

const BUCKET_NAME = 'ticket-images'

export async function uploadTicketImage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}.${fileExt}`
  
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file)

  if (uploadError) {
    console.error('Upload error:', uploadError)
    throw new Error('Failed to upload image')
  }

  // Create queue item
  const { data: queueItem, error: dbError } = await supabase
    .from('analysis_queue')
    .insert({
      user_id: user.id,
      image_path: fileName,
      status: 'pending'
    })
    .select()
    .single()

  if (dbError) {
    console.error('DB error:', dbError)
    throw new Error('Failed to create analysis queue')
  }

  return queueItem as AnalysisQueueItem
}

export async function analyzeTicketQueue(queueId: string) {
  const supabase = await createClient()
  
  // Get queue item
  const { data: queueItem, error: fetchError } = await supabase
    .from('analysis_queue')
    .select('*')
    .eq('id', queueId)
    .single()

  if (fetchError || !queueItem) {
    throw new Error('Queue item not found')
  }

  // Update status to processing
  await supabase
    .from('analysis_queue')
    .update({ status: 'processing' })
    .eq('id', queueId)

  try {
    // Download image from Storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(queueItem.image_path)

    if (downloadError || !fileBlob) {
      throw new Error('Failed to download image')
    }

    // Call backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) {
      throw new Error('API URL not configured')
    }

    const formData = new FormData()
    formData.append('file', fileBlob, 'image.jpg') // Filename is dummy

    const response = await fetch(`${apiUrl}/api/analyze/image`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Backend error: ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()

    // Update queue with result
    await supabase
      .from('analysis_queue')
      .update({
        status: 'completed',
        result_json: result,
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId)

    return { success: true, result }

  } catch (error: any) {
    console.error('Analysis error:', error)
    
    // Update queue with error
    await supabase
      .from('analysis_queue')
      .update({
        status: 'error',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId)

    return { success: false, error: error.message }
  }
}

export async function deleteAnalysisQueue(queueId: string) {
    const supabase = await createClient()
    await supabase.from('analysis_queue').delete().eq('id', queueId)
}
