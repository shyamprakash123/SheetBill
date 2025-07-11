import React, { useEffect } from 'react'

export default function GoogleAuthCallback() {
  useEffect(() => {
    // Extract the authorization code from URL
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')

    if (code) {
      // Send success message to parent window
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        code
      }, window.location.origin)
    } else if (error) {
      // Send error message to parent window
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error
      }, window.location.origin)
    }

    // Close the popup
    window.close()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing authentication...</p>
      </div>
    </div>
  )
}