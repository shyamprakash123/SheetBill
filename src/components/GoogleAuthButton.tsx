import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { googleAuthService } from '../lib/google-auth'
import { useAuthStore } from '../store/auth'
import Button from './ui/Button'
import toast from 'react-hot-toast'

interface GoogleAuthButtonProps {
  onSuccess?: (tokens: any) => void
  onError?: (error: Error) => void
  className?: string
}

export default function GoogleAuthButton({ onSuccess, onError, className }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false)
  const { profile, updateProfile } = useAuthStore()

  const handleGoogleAuth = async () => {
    setLoading(true)
    
    try {
      // Open Google OAuth in a popup
      const authUrl = googleAuthService.getAuthUrl()
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )

      // Listen for the popup to close or send a message
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          setLoading(false)
          toast.error('Authentication cancelled')
        }
      }, 1000)

      // Listen for messages from the popup
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed)
          popup?.close()
          window.removeEventListener('message', messageListener)

          try {
            const { code } = event.data
            const tokens = await googleAuthService.exchangeCodeForTokens(code)
            const userInfo = await googleAuthService.getUserInfo(tokens.access_token)

            // Update user profile with Google tokens
            await updateProfile({
              google_tokens: tokens,
              google_sheet_id: null // Will be set when spreadsheet is created
            })

            toast.success('Google account connected successfully!')
            onSuccess?.(tokens)
          } catch (error) {
            console.error('Error processing Google auth:', error)
            toast.error('Failed to connect Google account')
            onError?.(error as Error)
          } finally {
            setLoading(false)
          }
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed)
          popup?.close()
          window.removeEventListener('message', messageListener)
          setLoading(false)
          toast.error('Google authentication failed')
          onError?.(new Error(event.data.error))
        }
      }

      window.addEventListener('message', messageListener)

    } catch (error) {
      console.error('Error initiating Google auth:', error)
      toast.error('Failed to start Google authentication')
      setLoading(false)
      onError?.(error as Error)
    }
  }

  const isConnected = profile?.google_tokens?.access_token

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Button
        onClick={handleGoogleAuth}
        loading={loading}
        variant={isConnected ? "outline" : "primary"}
        className="w-full flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span>
          {isConnected ? 'Google Connected' : 'Connect Google Sheets'}
        </span>
      </Button>
    </motion.div>
  )
}