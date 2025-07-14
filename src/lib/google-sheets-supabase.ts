import { useAuthStore } from '../store/auth'
import { supabaseGoogleAuth } from './supabase-google-auth'

export interface SheetData {
  range: string
  values: any[][]
}

export class GoogleSheetsSupabaseService {
  private async getValidAccessToken(): Promise<string> {
    const tokens = await supabaseGoogleAuth.getGoogleTokens()
    
    if (!tokens) {
      throw new Error('No Google tokens available. Please sign in with Google.')
    }

    // Check if token is expired (with 5 minute buffer)
    const now = Date.now()
    const expiresAt = tokens.expires_at
    
    if (expiresAt && now >= (expiresAt - 300000)) { // 5 minute buffer
      // Token is expired or will expire soon, refresh it
      const refreshedTokens = await supabaseGoogleAuth.refreshGoogleToken()
      if (!refreshedTokens) {
        throw new Error('Failed to refresh Google tokens')
      }
      return refreshedTokens.access_token
    }

    return tokens.access_token
  }

  private async makeGoogleAPIRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = await this.getValidAccessToken()
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(`Google API request failed: ${error.error?.message || response.statusText}`)
    }

    return response
  }

  // Create spreadsheet for user
  async createUserSpreadsheet(userEmail: string): Promise<string> {
    const spreadsheetData = {
      properties: {
        title: `SheetBill - ${userEmail}`,
        locale: 'en_US',
        timeZone: 'Asia/Kolkata',
        autoRecalc: 'ON_CHANGE'
      },
      sheets: [
        { properties: { title: 'Dashboard', gridProperties: { rowCount: 1000, columnCount: 26 } } },
        { properties: { title: 'Invoices', gridProperties: { rowCount: 1000, columnCount: 20 } } },
        { properties: { title: 'Products', gridProperties: { rowCount: 1000, columnCount: 15 } } },
        { properties: { title: 'Customers', gridProperties: { rowCount: 1000, columnCount: 12 } } },
        { properties: { title: 'Vendors', gridProperties: { rowCount: 1000, columnCount: 12 } } },
        { properties: { title: 'Payments', gridProperties: { rowCount: 1000, columnCount: 8 } } },
        { properties: { title: 'Expenses', gridProperties: { rowCount: 1000, columnCount: 10 } } },
        { properties: { title: 'Quotations', gridProperties: { rowCount: 1000, columnCount: 12 } } },
        { properties: { title: 'Credit_Notes', gridProperties: { rowCount: 1000, columnCount: 10 } } },
        { properties: { title: 'Settings', gridProperties: { rowCount: 100, columnCount: 5 } } }
      ]
    }

    const response = await this.makeGoogleAPIRequest('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      body: JSON.stringify(spreadsheetData)
    })

    const result = await response.json()
    await this.initializeSheetHeaders(result.spreadsheetId)
    return result.spreadsheetId
  }

  // Initialize headers for all sheets
  private async initializeSheetHeaders(spreadsheetId: string): Promise<void> {
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
      'Payments': [
        'Payment ID', 'Invoice ID', 'Amount', 'Date', 'Method', 'Status', 'Reference', 'Notes'
      ],
      'Expenses': [
        'Expense ID', 'Description', 'Amount', 'Date', 'Category', 'Vendor', 'Tax', 'Receipt', 'Status', 'Approved By'
      ],
      'Credit_Notes': [
        'Credit Note ID', 'Invoice ID', 'Customer', 'Date', 'Amount', 'Reason', 'Status', 'Approved By', 'Reference', 'Notes'
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
  }

  // Batch update sheet data
  async batchUpdateSheetData(spreadsheetId: string, data: { range: string; values: any[][] }[]): Promise<any> {
    const response = await this.makeGoogleAPIRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        body: JSON.stringify({
          valueInputOption: 'RAW',
          data
        })
      }
    )

    return response.json()
  }

  // Get sheet data
  async getSheetData(spreadsheetId: string, range: string): Promise<any[][]> {
    const encodedRange = encodeURIComponent(range)
    const response = await this.makeGoogleAPIRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`
    )

    const result = await response.json()
    return result.values || []
  }

  // Update sheet data
  async updateSheetData(spreadsheetId: string, range: string, values: any[][]): Promise<any> {
    const encodedRange = encodeURIComponent(range)
    const response = await this.makeGoogleAPIRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=RAW`,
      {
        method: 'PUT',
        body: JSON.stringify({ values })
      }
    )

    return response.json()
  }

  // Append data to sheet
  async appendToSheet(spreadsheetId: string, range: string, values: any[][]): Promise<any> {
    const encodedRange = encodeURIComponent(range)
    const response = await this.makeGoogleAPIRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        body: JSON.stringify({ values })
      }
    )

    return response.json()
  }

  // Add invoice to sheet
  async addInvoice(spreadsheetId: string, invoice: any): Promise<any> {
    const invoiceRow = [
      invoice.id,
      invoice.customerId || '',
      invoice.customerName,
      invoice.date,
      invoice.dueDate,
      invoice.subtotal,
      invoice.taxAmount,
      invoice.total,
      invoice.status,
      invoice.notes || '',
      JSON.stringify(invoice.items || []),
      invoice.paymentTerms || '',
      invoice.createdAt,
      invoice.updatedAt,
      invoice.pdfUrl || ''
    ]

    return this.appendToSheet(spreadsheetId, 'Invoices!A1', [invoiceRow])
  }

  // Add product to sheet
  async addProduct(spreadsheetId: string, product: any): Promise<any> {
    const productRow = [
      product.id,
      product.name,
      product.description,
      product.price,
      product.stock,
      product.hsnCode,
      product.taxRate,
      product.category,
      product.unit || 'pcs',
      product.imageUrl || '',
      product.createdAt,
      product.updatedAt,
      product.status || 'Active'
    ]

    return this.appendToSheet(spreadsheetId, 'Products!A1', [productRow])
  }

  // Add customer to sheet
  async addCustomer(spreadsheetId: string, customer: any): Promise<any> {
    const customerRow = [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.city || '',
      customer.state || '',
      customer.country || 'India',
      customer.gstin || '',
      customer.createdAt,
      customer.status || 'Active'
    ]

    return this.appendToSheet(spreadsheetId, 'Customers!A1', [customerRow])
  }

  // Add vendor to sheet
  async addVendor(spreadsheetId: string, vendor: any): Promise<any> {
    const vendorRow = [
      vendor.id,
      vendor.name,
      vendor.email,
      vendor.phone,
      vendor.address,
      vendor.city || '',
      vendor.state || '',
      vendor.country || 'India',
      vendor.gstin || '',
      vendor.createdAt,
      vendor.status || 'Active'
    ]

    return this.appendToSheet(spreadsheetId, 'Vendors!A1', [vendorRow])
  }
}

export const googleSheetsSupabaseService = new GoogleSheetsSupabaseService()