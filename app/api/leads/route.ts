import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { full_name, phone, item_of_interest, amount, user_id, notes } = body

    // 1. Setup Supabase with Service Role (to bypass RLS for external hits)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 2. Format the WhatsApp URL automatically
    let whatsapp_url = ""
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '')
      const message = encodeURIComponent(`Hi ${full_name}, I'm following up on your interest in ${item_of_interest || 'our products'}.`)
      whatsapp_url = `https://wa.me/${cleanPhone}?text=${message}`
    }

    // 3. Insert into the database
    const { data, error } = await supabase
      .from('leads')
      .insert([
        { 
          full_name, 
          phone, 
          item_of_interest, 
          amount, 
          user_id, 
          notes,
          whatsapp_url,
          status: 'new' // Start them in the Active tab!
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}