import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import toast from 'react-hot-toast'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { fetchProfile } = useAuthStore()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          toast.error('Authentication failed')
          navigate('/auth')
          return
        }

        if (data.session) {
          // Check if we have Google provider tokens
          if (data.session.provider_token) {
            // Fetch user profile to update with Google tokens
            await fetchProfile()
            toast.success('Successfully signed in with Google!')
            navigate('/app/dashboard')
          } else {
            toast.error('Google authentication incomplete')
            navigate('/auth')
          }
        } else {
          navigate('/auth')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        toast.error('Authentication failed')
        navigate('/auth')
      }
    }

    handleAuthCallback()
  }, [navigate, fetchProfile])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Completing authentication...</p>
      </div>
    </div>
  )
}