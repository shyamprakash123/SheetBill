import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { googleAPIService } from '../lib/google-api'
import { useAuthStore } from '../store/auth'
import Button from './ui/Button'
import toast from 'react-hot-toast'

interface GoogleAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function GoogleAuthModal({ isOpen, onClose, onSuccess }: GoogleAuthModalProps) {
  const [loading, setLoading] = useState(false)
  const { updateProfile } = useAuthStore()

  const handleGoogleAuth = async () => {
    setLoading(true)
    
    try {
      // Open Google OAuth in a popup
      const authUrl = googleAPIService.getAuthUrl()
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        throw new Error('Failed to open popup window. Please allow popups for this site.')
      }
      // Listen for messages from the popup
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          popup?.close()
          window.removeEventListener('message', messageListener)

          try {
            const { code } = event.data
            const tokens = await googleAPIService.exchangeCodeForTokens(code)

            // Create spreadsheet for the user
            const { GoogleSheetsAPI } = await import('../lib/google-api')
            const sheetsAPI = new GoogleSheetsAPI(tokens.access_token)
            
            let spreadsheetId
            try {
              const userInfo = await googleAPIService.getUserInfo(tokens.access_token)
              spreadsheetId = await sheetsAPI.createUserSpreadsheet(userInfo.email)
            } catch (error) {
              console.error('Error creating spreadsheet:', error)
              spreadsheetId = null
            }

            // Update user profile with Google tokens and spreadsheet ID
            await updateProfile({
              google_tokens: tokens,
              google_sheet_id: spreadsheetId || null
            })

            if (spreadsheetId) {
              toast.success('Google account connected and spreadsheet created successfully!')
            } else {
              toast.success('Google account connected! Spreadsheet will be created when you first use the app.')
            }
            onSuccess()
          } catch (error) {
            console.error('Error processing Google auth:', error)
            toast.error('Failed to connect Google account')
          } finally {
            setLoading(false)
          }
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          popup?.close()
          window.removeEventListener('message', messageListener)
          setLoading(false)
          toast.error('Google authentication failed')
        }
      }

      window.addEventListener('message', messageListener)

    } catch (error) {
      console.error('Error initiating Google auth:', error)
      toast.error('Failed to start Google authentication')
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Connect Google Account
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24">
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
                </div>
                
                <div className="text-center mb-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Google Account Required
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    To use SheetBill, you need to connect your Google account. This allows us to:
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Create and manage your invoices in Google Sheets
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Store your business documents and logos in Google Drive
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sync data across all your devices automatically
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Privacy Note:</strong> We only access the files we create for your invoicing needs. 
                    Your existing Google Drive files remain private.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGoogleAuth}
                    loading={loading}
                    className="flex-1 flex items-center justify-center space-x-2"
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
                    <span>Connect Google</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}