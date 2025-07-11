// Enhanced Google API integration with proper error handling
import { GoogleAuth } from 'google-auth-library'

export interface GoogleTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
  expires_at?: number
}

export interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture?: string
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
  webContentLink?: string
  thumbnailLink?: string
}

export class GoogleAPIService {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private scopes: string[]

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    this.clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET
    this.redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`
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

  // Generate OAuth URL
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

  // Exchange code for tokens
  async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    try {
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
        throw new Error(`Token exchange failed: ${error.error_description || error.error}`)
      }

      const tokens = await response.json()
      tokens.expires_at = Date.now() + (tokens.expires_in * 1000)
      return tokens
    } catch (error) {
      console.error('Error exchanging code for tokens:', error)
      throw error
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    try {
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
        throw new Error(`Token refresh failed: ${error.error_description || error.error}`)
      }

      const tokens = await response.json()
      tokens.expires_at = Date.now() + (tokens.expires_in * 1000)
      return tokens
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw error
    }
  }

  // Get user info
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get user info')
      }

      return response.json()
    } catch (error) {
      console.error('Error getting user info:', error)
      throw error
    }
  }

  // Check if token is expired
  isTokenExpired(tokens: GoogleTokens): boolean {
    if (!tokens.expires_at) return false
    return Date.now() >= tokens.expires_at - 60000 // 1 minute buffer
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken(tokens: GoogleTokens): Promise<string> {
    if (!this.isTokenExpired(tokens)) {
      return tokens.access_token
    }

    if (!tokens.refresh_token) {
      throw new Error('No refresh token available. Please re-authenticate.')
    }

    const newTokens = await this.refreshAccessToken(tokens.refresh_token)
    return newTokens.access_token
  }
}

export class GoogleSheetsAPI {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  // Create spreadsheet for user
  async createUserSpreadsheet(userEmail: string): Promise<string> {
    const spreadsheetData = {
      properties: {
        title: `SheetBill - ${userEmail}`,
        locale: 'en_IN',
        timeZone: 'Asia/Kolkata',
        autoRecalc: 'ON_CHANGE'
      },
      sheets: [
        { properties: { title: 'Dashboard', gridProperties: { rowCount: 1000, columnCount: 26 } } },
        { properties: { title: 'Invoices', gridProperties: { rowCount: 1000, columnCount: 20 } } },
        { properties: { title: 'Products', gridProperties: { rowCount: 1000, columnCount: 15 } } },
        { properties: { title: 'Customers', gridProperties: { rowCount: 1000, columnCount: 12 } } },
        { properties: { title: 'Vendors', gridProperties: { rowCount: 1000, columnCount: 12 } } },
        { properties: { title: 'Quotations', gridProperties: { rowCount: 1000, columnCount: 15 } } },
        { properties: { title: 'Purchases', gridProperties: { rowCount: 1000, columnCount: 15 } } },
        { properties: { title: 'Settings', gridProperties: { rowCount: 100, columnCount: 5 } } }
      ]
    }

    try {
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(spreadsheetData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to create spreadsheet: ${error.error?.message || 'Unknown error'}`)
      }

      const result = await response.json()
      await this.initializeSheetHeaders(result.spreadsheetId)
      return result.spreadsheetId
    } catch (error) {
      console.error('Error creating spreadsheet:', error)
      throw error
    }
  }

  // Initialize headers for all sheets
  private async initializeSheetHeaders(spreadsheetId: string) {
    const headers = {
      'Invoices': [
        'Invoice ID', 'Customer ID', 'Customer Name', 'Date', 'Due Date', 
        'Subtotal', 'Tax Amount', 'Total', 'Status', 'Notes', 
        'Items', 'Payment Terms', 'Created At', 'Updated At', 'PDF URL'
      ],
      'Products': [
        'Product ID', 'Name', 'Description', 'Price', 'Stock', 
        'HSN Code', 'Tax Rate', 'Category', 'Unit', 'Image URL', 
        'Created At', 'Updated At', 'Status'
      ],
      'Customers': [
        'Customer ID', 'Name', 'Email', 'Phone', 'Address', 
        'City', 'State', 'Country', 'GSTIN', 'Created At', 'Status'
      ],
      'Vendors': [
        'Vendor ID', 'Name', 'Email', 'Phone', 'Address', 
        'City', 'State', 'Country', 'GSTIN', 'Created At', 'Status'
      ],
      'Quotations': [
        'Quote ID', 'Customer ID', 'Customer Name', 'Date', 'Valid Until', 
        'Subtotal', 'Tax Amount', 'Total', 'Status', 'Items', 
        'Notes', 'Created At', 'Updated At', 'Converted To Invoice'
      ],
      'Purchases': [
        'Purchase ID', 'Vendor ID', 'Vendor Name', 'Date', 'Due Date', 
        'Subtotal', 'Tax Amount', 'Total', 'Status', 'Items', 
        'Notes', 'Created At', 'Updated At', 'Receipt URL'
      ],
      'Settings': [
        'Key', 'Value', 'Description', 'Updated At', 'Updated By'
      ]
    }

    const requests = []
    
    for (const [sheetName, headerRow] of Object.entries(headers)) {
      const endColumn = String.fromCharCode(64 + headerRow.length)
      requests.push({
        range: `${sheetName}!A1:${endColumn}1`,
        values: [headerRow]
      })
    }

    await this.batchUpdateSheetData(spreadsheetId, requests)
    await this.formatHeaders(spreadsheetId)
  }

  // Format headers
  private async formatHeaders(spreadsheetId: string): Promise<void> {
    const requests = [
      {
        repeatCell: {
          range: {
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
              textFormat: { bold: true },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
        }
      }
    ]

    await this.batchUpdate(spreadsheetId, { requests })
  }

  // Batch update sheet data
  async batchUpdateSheetData(spreadsheetId: string, data: { range: string; values: any[][] }[]): Promise<any> {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          valueInputOption: 'RAW',
          data
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to batch update sheet data: ${error.error?.message || 'Unknown error'}`)
    }

    return response.json()
  }

  // Batch update for formatting
  async batchUpdate(spreadsheetId: string, batchUpdateRequest: any): Promise<any> {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(batchUpdateRequest)
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to batch update: ${error.error?.message || 'Unknown error'}`)
    }

    return response.json()
  }

  // Get sheet data
  async getSheetData(spreadsheetId: string, range: string) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
        {
          headers: this.headers
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to get sheet data: ${error.error?.message || 'Unknown error'}`)
      }

      const result = await response.json()
      return result.values || []
    } catch (error) {
      console.error('Error getting sheet data:', error)
      throw error
    }
  }

  // Update sheet data
  async updateSheetData(spreadsheetId: string, range: string, values: any[][]) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify({ values })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to update sheet data: ${error.error?.message || 'Unknown error'}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating sheet:', error)
      throw error
    }
  }

  // Append data to sheet
  async appendToSheet(spreadsheetId: string, range: string, values: any[][]) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ values })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to append to sheet: ${error.error?.message || 'Unknown error'}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error appending to sheet:', error)
      throw error
    }
  }

  // Delete row
  async deleteRow(spreadsheetId: string, sheetId: number, rowIndex: number) {
    const requests = [{
      deleteDimension: {
        range: {
          sheetId,
          dimension: 'ROWS',
          startIndex: rowIndex,
          endIndex: rowIndex + 1
        }
      }
    }]

    return this.batchUpdate(spreadsheetId, { requests })
  }
}

export class GoogleDriveAPI {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
    }
  }

  // Create folder
  async createFolder(name: string, parentId?: string): Promise<DriveFile> {
    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId && { parents: [parentId] })
    }

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    })

    if (!response.ok) {
      throw new Error('Failed to create folder')
    }

    return response.json()
  }

  // Upload file
  async uploadFile(file: File, folderId?: string): Promise<DriveFile> {
    const metadata = {
      name: file.name,
      ...(folderId && { parents: [folderId] })
    }

    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', file)

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: this.headers,
      body: form
    })

    if (!response.ok) {
      throw new Error('Failed to upload file')
    }

    const result = await response.json()
    
    // Make file publicly viewable
    await this.makeFilePublic(result.id)
    
    return result
  }

  // Make file public
  async makeFilePublic(fileId: string): Promise<void> {
    const permission = {
      type: 'anyone',
      role: 'reader'
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          ...this.headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(permission)
      }
    )

    if (!response.ok) {
      throw new Error('Failed to make file public')
    }
  }

  // Get file public URL
  getPublicUrl(fileId: string): string {
    return `https://drive.google.com/uc?id=${fileId}`
  }

  // Delete file
  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: this.headers
      }
    )

    if (!response.ok) {
      throw new Error('Failed to delete file')
    }
  }
}

// Singleton instances
export const googleAPIService = new GoogleAPIService()