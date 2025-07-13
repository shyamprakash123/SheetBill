import { supabase } from './supabase'
import { Provider } from '@supabase/supabase-js'

export interface GoogleTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  provider_token: string
  provider_refresh_token: string
}

export class SupabaseGoogleAuth {
  // Required scopes for Google Sheets and Drive access
  private readonly GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ].join(' ')

  /**
   * Initiate Google Sign-In with required OAuth scopes
   */
  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google' as Provider,
      options: {
        scopes: this.GOOGLE_SCOPES,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        },
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      throw new Error(`Google Sign-In failed: ${error.message}`)
    }
  }

  /**
   * Get Google tokens from the current session
   */
  async getGoogleTokens(): Promise<GoogleTokens | null> {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      throw new Error(`Failed to get session: ${error.message}`)
    }

    if (!session?.provider_token || !session?.provider_refresh_token) {
      return null
    }

    return {
      access_token: session.provider_token,
      refresh_token: session.provider_refresh_token,
      expires_in: session.expires_in || 3600,
      expires_at: session.expires_at || Date.now() + 3600000,
      provider_token: session.provider_token,
      provider_refresh_token: session.provider_refresh_token
    }
  }

  /**
   * Refresh Google access token using Supabase
   */
  async refreshGoogleToken(): Promise<GoogleTokens | null> {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      throw new Error(`Failed to refresh token: ${error.message}`)
    }

    if (!data.session?.provider_token) {
      throw new Error('No provider token available after refresh')
    }

    return {
      access_token: data.session.provider_token,
      refresh_token: data.session.provider_refresh_token || '',
      expires_in: data.session.expires_in || 3600,
      expires_at: data.session.expires_at || Date.now() + 3600000,
      provider_token: data.session.provider_token,
      provider_refresh_token: data.session.provider_refresh_token || ''
    }
  }

  /**
   * Check if user has valid Google tokens
   */
  async hasValidGoogleTokens(): Promise<boolean> {
    try {
      const tokens = await this.getGoogleTokens()
      return tokens !== null && tokens.access_token !== ''
    } catch {
      return false
    }
  }

  /**
   * Get user info from Google using the access token
   */
  async getGoogleUserInfo(): Promise<any> {
    const tokens = await this.getGoogleTokens()
    if (!tokens) {
      throw new Error('No Google tokens available')
    }

    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get Google user info')
    }

    return response.json()
  }

  /**
   * Sign out and revoke Google tokens
   */
  async signOut(): Promise<void> {
    // Get tokens before signing out to revoke them
    try {
      const tokens = await this.getGoogleTokens()
      if (tokens?.access_token) {
        // Revoke Google tokens
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`, {
          method: 'POST'
        })
      }
    } catch (error) {
      console.warn('Failed to revoke Google tokens:', error)
    }

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`)
    }
  }
}

export const supabaseGoogleAuth = new SupabaseGoogleAuth()