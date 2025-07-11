import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserProfile = {
  id: string
  email: string
  full_name?: string
  plan: 'free' | 'starter' | 'professional' | 'enterprise'
  google_tokens?: any
  google_sheet_id?: string
  invoice_count: number
  created_at: string
  updated_at: string
}

export type SubscriptionHistory = {
  id: string
  user_id: string
  plan: string
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  payment_id?: string
  amount?: number
  razorpay_subscription_id?: string
  created_at: string
}