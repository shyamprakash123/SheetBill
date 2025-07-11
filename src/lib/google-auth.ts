// Google OAuth and API integration for SheetBill
import { GoogleAuth } from 'google-auth-library'

export interface GoogleTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture?: string
}

export class GoogleAuthService {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private scopes: string[]

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    this.clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET
    this.redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI
    this.scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]

    if (!this.clientId || !this.clientSecret) {
      console.warn('Google OAuth credentials not configured')
    }
  }

  // Generate OAuth URL for user authorization
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to exchange code for tokens: ${error.error_description || error.error}`)
    }

    return response.json()
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to refresh token: ${error.error_description || error.error}`)
    }

    return response.json()
  }

  // Get user information from Google
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    return response.json()
  }

  // Revoke tokens
  async revokeTokens(accessToken: string): Promise<void> {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: 'POST',
    })
  }
}

// Singleton instance
export const googleAuthService = new GoogleAuthService()