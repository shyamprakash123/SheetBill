import { create } from 'zustand'
import { supabase, type UserProfile } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import { supabaseGoogleAuth } from '../lib/supabase-google-auth'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  hasGoogleTokens: () => Promise<boolean>
  getGoogleTokens: () => Promise<any>
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

  signInWithGoogle: async () => {
    await supabaseGoogleAuth.signInWithGoogle()
  },

  signOut: async () => {
    try {
      await supabaseGoogleAuth.signOut()
    } catch (error) {
      console.warn('Error during Google sign out:', error)
      // Continue with Supabase sign out even if Google revocation fails
      const { error: supabaseError } = await supabase.auth.signOut()
      if (supabaseError) throw supabaseError
    }

    set({ user: null, profile: null })
  },

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (data) {
        const googleTokens = await supabaseGoogleAuth.getGoogleTokens();
        if (googleTokens) {
          const updatedProfile = {
            ...data,
            google_tokens: googleTokens,
          };
          set({ profile: updatedProfile });
        } else {
          set({ profile: data });
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
    }
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

  hasGoogleTokens: async () => {
    try {
      const tokens = await supabaseGoogleAuth.getGoogleTokens()
      return tokens !== null && tokens.access_token !== ''
    } catch (error) {
      console.warn('Error checking Google tokens:', error)
      return false
    }
  },

  getGoogleTokens: async () => {
    try {
      return await supabaseGoogleAuth.getGoogleTokens()
    } catch (error) {
      console.warn('Error getting Google tokens:', error)
      return null
    }
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