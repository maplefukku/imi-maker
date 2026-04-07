import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeValues } from '@/lib/value-analyzer'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('meanings')
    .select('meaning')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const analysis = analyzeValues(data || [])

  return NextResponse.json({ analysis })
}
