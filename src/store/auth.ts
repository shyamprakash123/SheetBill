import { create } from 'zustand'
import { supabase, type UserProfile } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    set({ user: data.user })
    await get().fetchProfile()
  },

  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    set({ user: data.user })
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    set({ user: null, profile: null })
  },

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return
    }

    set({ profile: data })
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { user } = get()
    if (!user) return

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    set({ profile: data })
  },
}))

// Initialize auth state
supabase.auth.onAuthStateChange((event, session) => {
  const { fetchProfile } = useAuthStore.getState()
  
  if (session?.user) {
    useAuthStore.setState({ user: session.user, loading: false })
    fetchProfile()
  } else {
    useAuthStore.setState({ user: null, profile: null, loading: false })
  }
})