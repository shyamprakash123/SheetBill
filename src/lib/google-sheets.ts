// Google Sheets API integration for SheetBill data backend
import { GoogleDriveService } from './google-drive'

export interface SheetData {
  range: string
  majorDimension: 'ROWS' | 'COLUMNS'
  values: any[][]
}

export interface BatchUpdateRequest {
  requests: any[]
}

export interface SpreadsheetProperties {
  title: string
  locale?: string
  autoRecalc?: 'ON_CHANGE' | 'MINUTE' | 'HOUR'
  timeZone?: string
}

export class GoogleSheetsService {
  private accessToken: string | null = null
  private driveService: GoogleDriveService | null = null

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null
    if (this.accessToken) {
      this.driveService = new GoogleDriveService(this.accessToken)
    }
  }

  private get headers() {
    if (!this.accessToken) {
      throw new Error('Google access token required')
    }
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  // Initialize user's spreadsheet with default sheets
  async createUserSpreadsheet(userEmail: string): Promise<string> {
    const spreadsheetData = {
      properties: {
        title: `SheetBill - ${userEmail}`,
        locale: 'en_US',
        timeZone: 'Asia/Kolkata',
        autoRecalc: 'ON_CHANGE'
      },
      sheets: [
        { 
          properties: { 
            title: 'Dashboard',
            gridProperties: { rowCount: 1000, columnCount: 26 }
          } 
        },
        { 
          properties: { 
            title: 'Invoices',
            gridProperties: { rowCount: 1000, columnCount: 15 }
          } 
        },
        { 
          properties: { 
            title: 'Products',
            gridProperties: { rowCount: 1000, columnCount: 12 }
          } 
        },
        { 
          properties: { 
            title: 'Customers',
            gridProperties: { rowCount: 1000, columnCount: 10 }
          } 
        },
        { 
          properties: { 
            title: 'Vendors',
            gridProperties: { rowCount: 1000, columnCount: 10 }
          } 
        },
        { 
          properties: { 
            title: 'Payments',
            gridProperties: { rowCount: 1000, columnCount: 8 }
          } 
        },
        { 
          properties: { 
            title: 'Expenses',
            gridProperties: { rowCount: 1000, columnCount: 10 }
          } 
        },
        { 
          properties: { 
            title: 'Quotations',
            gridProperties: { rowCount: 1000, columnCount: 12 }
          } 
        },
        { 
          properties: { 
            title: 'Credit_Notes',
            gridProperties: { rowCount: 1000, columnCount: 10 }
          } 
        },
        { 
          properties: { 
            title: 'Settings',
            gridProperties: { rowCount: 100, columnCount: 5 }
          } 
        }
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
      
      // Create a dedicated folder for SheetBill files
      if (this.driveService) {
        try {
          const folder = await this.driveService.createFolder(`SheetBill - ${userEmail}`)
          // Move the spreadsheet to the folder
          await this.moveFileToFolder(result.spreadsheetId, folder.id)
        } catch (error) {
          console.warn('Failed to organize files in Drive:', error)
        }
      }
      
      return result.spreadsheetId
    } catch (error) {
      console.error('Error creating spreadsheet:', error)
      throw error
    }
  }

  // Move file to a specific folder
  private async moveFileToFolder(fileId: string, folderId: string): Promise<void> {
    if (!this.driveService) return
    
    try {
      // Get current parents
      const file = await this.driveService.getFile(fileId)
      
      // Update file to new parent
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}`,
        {
          method: 'PATCH',
          headers: this.headers
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to move file to folder')
      }
    } catch (error) {
      console.warn('Failed to move file to folder:', error)
    }
  }

  // Initialize headers for each sheet
  private async initializeSheetHeaders(spreadsheetId: string) {
    const headers = {
      'Dashboard': ['Metric', 'Value', 'Period', 'Change', 'Last Updated'],
      'Invoices': ['Invoice ID', 'Customer', 'Date', 'Due Date', 'Amount', 'Tax', 'Total', 'Status', 'Notes', 'Payment Method', 'Reference', 'Created By', 'Updated At', 'PDF Link', 'Sent Date'],
      'Products': ['Product ID', 'Name', 'Description', 'Price', 'Stock', 'HSN Code', 'Tax Rate', 'Category', 'Unit', 'Supplier', 'Last Updated', 'Status'],
      'Customers': ['Customer ID', 'Name', 'Email', 'Phone', 'Address', 'GSTIN', 'State', 'Country', 'Created Date', 'Status'],
      'Vendors': ['Vendor ID', 'Name', 'Email', 'Phone', 'Address', 'GSTIN', 'State', 'Country', 'Created Date', 'Status'],
      'Payments': ['Payment ID', 'Invoice ID', 'Amount', 'Date', 'Method', 'Status', 'Reference', 'Notes'],
      'Expenses': ['Expense ID', 'Description', 'Amount', 'Date', 'Category', 'Vendor', 'Tax', 'Receipt', 'Status', 'Approved By'],
      'Quotations': ['Quote ID', 'Customer', 'Date', 'Valid Until', 'Amount', 'Tax', 'Total', 'Status', 'Items', 'Notes', 'Converted', 'Invoice ID'],
      'Credit_Notes': ['Credit Note ID', 'Invoice ID', 'Customer', 'Date', 'Amount', 'Reason', 'Status', 'Approved By', 'Reference', 'Notes'],
      'Settings': ['Key', 'Value', 'Description', 'Updated At', 'Updated By']
    }

    // Batch update all headers at once for better performance
    const requests = []
    
    for (const [sheetName, headerRow] of Object.entries(headers)) {
      const endColumn = String.fromCharCode(64 + headerRow.length)
      requests.push({
        range: `${sheetName}!A1:${endColumn}1`,
        values: [headerRow]
      })
    }

    // Batch update all headers
    await this.batchUpdateSheetData(spreadsheetId, requests)
    
    // Format headers with bold styling
    await this.formatHeaders(spreadsheetId)
  }

  // Format headers with bold styling and colors
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

  // Batch update multiple ranges
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

  // Batch update for formatting and other operations
  async batchUpdate(spreadsheetId: string, batchUpdateRequest: BatchUpdateRequest): Promise<any> {
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

  // Generic method to update sheet data
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

  // Get data from sheet
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

  // Get spreadsheet metadata
  async getSpreadsheetInfo(spreadsheetId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
        {
          headers: this.headers
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to get spreadsheet info: ${error.error?.message || 'Unknown error'}`)
      }

      return response.json()
    } catch (error) {
      console.error('Error getting spreadsheet info:', error)
      throw error
    }
  }

  // Create a new sheet in existing spreadsheet
  async addSheet(spreadsheetId: string, sheetName: string): Promise<any> {
    const request = {
      requests: [{
        addSheet: {
          properties: {
            title: sheetName,
            gridProperties: {
              rowCount: 1000,
              columnCount: 26
            }
          }
        }
      }]
    }

    return this.batchUpdate(spreadsheetId, request)
  }

  // Delete a sheet
  async deleteSheet(spreadsheetId: string, sheetId: number): Promise<any> {
    const request = {
      requests: [{
        deleteSheet: {
          sheetId
        }
      }]
    }

    return this.batchUpdate(spreadsheetId, request)
  }

  // Clear sheet data
  async clearSheet(spreadsheetId: string, range: string): Promise<any> {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`,
        {
          method: 'POST',
          headers: this.headers
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to clear sheet: ${error.error?.message || 'Unknown error'}`)
      }

      return response.json()
    } catch (error) {
      console.error('Error clearing sheet:', error)
      throw error
    }
  }

  // Add invoice to sheet
  async addInvoice(spreadsheetId: string, invoice: any) {
    const invoiceRow = [
      invoice.id,
      invoice.customer,
      invoice.date,
      invoice.dueDate,
      invoice.amount,
      invoice.tax,
      invoice.total,
      invoice.status,
      invoice.notes || '',
      invoice.paymentMethod || '',
      invoice.reference || '',
      invoice.createdBy || '',
      new Date().toISOString(),
      invoice.pdfLink || '',
      invoice.sentDate || ''
    ]

    const existingData = await this.getSheetData(spreadsheetId, 'Invoices!A:A')
    const nextRow = existingData.length + 1

    return this.updateSheetData(
      spreadsheetId,
      `Invoices!A${nextRow}:O${nextRow}`,
      [invoiceRow]
    )
  }

  // Add product to sheet
  async addProduct(spreadsheetId: string, product: any) {
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
      product.supplier || '',
      new Date().toISOString(),
      'Active'
    ]

    const existingData = await this.getSheetData(spreadsheetId, 'Products!A:A')
    const nextRow = existingData.length + 1

    return this.updateSheetData(
      spreadsheetId,
      `Products!A${nextRow}:L${nextRow}`,
      [productRow]
    )
  }

  // Add customer to sheet
  async addCustomer(spreadsheetId: string, customer: any) {
    const customerRow = [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.gstin,
      customer.state,
      customer.country,
      new Date().toISOString(),
      'Active'
    ]

    const existingData = await this.getSheetData(spreadsheetId, 'Customers!A:A')
    const nextRow = existingData.length + 1

    return this.updateSheetData(
      spreadsheetId,
      `Customers!A${nextRow}:J${nextRow}`,
      [customerRow]
    )
  }

  // Add vendor to sheet
  async addVendor(spreadsheetId: string, vendor: any) {
    const vendorRow = [
      vendor.id,
      vendor.name,
      vendor.email,
      vendor.phone,
      vendor.address,
      vendor.gstin,
      vendor.state,
      vendor.country,
      new Date().toISOString(),
      'Active'
    ]

    const existingData = await this.getSheetData(spreadsheetId, 'Vendors!A:A')
    const nextRow = existingData.length + 1

    return this.updateSheetData(
      spreadsheetId,
      `Vendors!A${nextRow}:J${nextRow}`,
      [vendorRow]
    )
  }

  // Add quotation to sheet
  async addQuotation(spreadsheetId: string, quotation: any) {
    const quotationRow = [
      quotation.id,
      quotation.customer,
      quotation.date,
      quotation.validUntil,
      quotation.amount,
      quotation.tax,
      quotation.total,
      quotation.status,
      quotation.items || 0,
      quotation.notes || '',
      false,
      ''
    ]

    const existingData = await this.getSheetData(spreadsheetId, 'Quotations!A:A')
    const nextRow = existingData.length + 1

    return this.updateSheetData(
      spreadsheetId,
      `Quotations!A${nextRow}:L${nextRow}`,
      [quotationRow]
    )
  }

  // Update invoice status
  async updateInvoiceStatus(spreadsheetId: string, invoiceId: string, status: string) {
    const data = await this.getSheetData(spreadsheetId, 'Invoices!A:I')
    const rowIndex = data.findIndex(row => row[0] === invoiceId)
    
    if (rowIndex > 0) { // Skip header row
      return this.updateSheetData(
        spreadsheetId,
        `Invoices!H${rowIndex + 1}:H${rowIndex + 1}`,
        [[status]]
      )
    }
    
    throw new Error('Invoice not found')
  }

  // Update any record status (mark as deleted instead of actual deletion)
  async updateRecordStatus(spreadsheetId: string, sheetName: string, recordId: string, status: string) {
    const data = await this.getSheetData(spreadsheetId, `${sheetName}!A:Z`)
    const rowIndex = data.findIndex(row => row[0] === recordId)
    
    if (rowIndex > 0) { // Skip header row
      // Find the status column (usually the last column with data)
      const statusColumnIndex = data[0].findIndex(header => 
        header.toLowerCase().includes('status')
      )
      
      if (statusColumnIndex >= 0) {
        const statusColumn = String.fromCharCode(65 + statusColumnIndex)
        return this.updateSheetData(
          spreadsheetId,
          `${sheetName}!${statusColumn}${rowIndex + 1}:${statusColumn}${rowIndex + 1}`,
          [[status]]
        )
      }
    }
    
    throw new Error('Record not found')
  }

  // Search across all sheets
  async searchAllSheets(spreadsheetId: string, searchTerm: string): Promise<any[]> {
    const sheets = ['Invoices', 'Products', 'Customers', 'Vendors', 'Quotations']
    const results = []

    for (const sheetName of sheets) {
      try {
        const data = await this.getSheetData(spreadsheetId, `${sheetName}!A:Z`)
        const [headers, ...rows] = data
        
        const matchingRows = rows.filter(row =>
          row.some(cell => 
            cell && cell.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        )

        matchingRows.forEach(row => {
          const record: any = { sheet: sheetName }
          headers.forEach((header, index) => {
            record[header] = row[index] || ''
          })
          results.push(record)
        })
      } catch (error) {
        console.warn(`Failed to search in ${sheetName}:`, error)
      }
    }

    return results
  }

  // Export sheet data as CSV
  async exportSheetAsCSV(spreadsheetId: string, sheetName: string): Promise<string> {
    const data = await this.getSheetData(spreadsheetId, `${sheetName}!A:Z`)
    
    return data.map(row => 
      row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  // Get sheet statistics
  async getSheetStats(spreadsheetId: string): Promise<any> {
    const stats: any = {}
    const sheets = ['Invoices', 'Products', 'Customers', 'Vendors', 'Quotations']

    for (const sheetName of sheets) {
      try {
        const data = await this.getSheetData(spreadsheetId, `${sheetName}!A:A`)
        stats[sheetName] = {
          totalRecords: Math.max(0, data.length - 1), // Exclude header
          lastUpdated: new Date().toISOString()
        }
      } catch (error) {
        stats[sheetName] = { totalRecords: 0, error: error.message }
      }
    }

    return stats
  }
}

// Enhanced Mock service for development/preview with realistic data
export class MockGoogleSheetsService extends GoogleSheetsService {
  private mockData: { [key: string]: any[][] } = {
    'Invoices': [
      ['Invoice ID', 'Customer', 'Date', 'Due Date', 'Amount', 'Tax', 'Total', 'Status', 'Notes'],
      ['INV-2024-001', 'Acme Corp', '2024-01-15', '2024-02-14', '10000', '1800', '11800', 'Paid', 'Website development'],
      ['INV-2024-002', 'Tech Solutions', '2024-01-16', '2024-02-15', '15000', '2700', '17700', 'Pending', 'Mobile app development'],
      ['INV-2024-003', 'StartupXYZ', '2024-01-18', '2024-02-17', '8000', '1440', '9440', 'Overdue', 'Consulting services'],
      ['INV-2024-004', 'Enterprise Ltd', '2024-01-20', '2024-02-19', '25000', '4500', '29500', 'Draft', 'System integration'],
    ],
    'Products': [
      ['Product ID', 'Name', 'Description', 'Price', 'Stock', 'HSN Code', 'Tax Rate', 'Category'],
      ['PRD-001', 'Web Development', 'Custom website development', '50000', '∞', '998314', '18%', 'Services'],
      ['PRD-002', 'Mobile App', 'iOS/Android app development', '75000', '∞', '998314', '18%', 'Services'],
      ['PRD-003', 'Consulting', 'Technical consulting services', '2000', '∞', '998314', '18%', 'Services'],
      ['PRD-004', 'Software License', 'Annual software license', '12000', '100', '998313', '18%', 'Software'],
    ],
    'Customers': [
      ['Customer ID', 'Name', 'Email', 'Phone', 'Address', 'GSTIN', 'State', 'Country'],
      ['CUST-001', 'Acme Corp', 'contact@acme.com', '+91-9876543210', 'Mumbai, MH', '27AABCU9603R1ZX', 'Maharashtra', 'India'],
      ['CUST-002', 'Tech Solutions', 'info@techsol.com', '+91-9876543211', 'Bangalore, KA', '29AABCU9603R1ZY', 'Karnataka', 'India'],
      ['CUST-003', 'StartupXYZ', 'hello@startupxyz.com', '+91-9876543212', 'Delhi, DL', '07AABCU9603R1ZZ', 'Delhi', 'India'],
      ['CUST-004', 'Enterprise Ltd', 'contact@enterprise.com', '+91-9876543213', 'Pune, MH', '27AABCU9603R1ZA', 'Maharashtra', 'India'],
    ]
  }

  async createUserSpreadsheet(userEmail: string): Promise<string> {
    return 'mock-spreadsheet-id-' + Date.now()
  }

  async getSheetData(spreadsheetId: string, range: string) {
    const sheetName = range.split('!')[0]
    return this.mockData[sheetName] || []
  }

  async updateSheetData(spreadsheetId: string, range: string, values: any[][]) {
    const sheetName = range.split('!')[0]
    if (!this.mockData[sheetName]) {
      this.mockData[sheetName] = []
    }
    return { updatedCells: values.length }
  }

  async addInvoice(spreadsheetId: string, invoice: any) {
    const invoiceRow = [
      invoice.id,
      invoice.customer,
      invoice.date,
      invoice.dueDate,
      invoice.amount,
      invoice.tax,
      invoice.total,
      invoice.status,
      invoice.notes || ''
    ]
    this.mockData['Invoices'].push(invoiceRow)
    return { updatedCells: 1 }
  }

  async addProduct(spreadsheetId: string, product: any) {
    const productRow = [
      product.id,
      product.name,
      product.description,
      product.price,
      product.stock,
      product.hsnCode,
      product.taxRate,
      product.category
    ]
    this.mockData['Products'].push(productRow)
    return { updatedCells: 1 }
  }

  async addCustomer(spreadsheetId: string, customer: any) {
    const customerRow = [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.gstin,
      customer.state,
      customer.country
    ]
    this.mockData['Customers'].push(customerRow)
    return { updatedCells: 1 }
  }

  async updateInvoiceStatus(spreadsheetId: string, invoiceId: string, status: string) {
    const invoices = this.mockData['Invoices']
    const invoiceIndex = invoices.findIndex(row => row[0] === invoiceId)
    if (invoiceIndex > 0) {
      invoices[invoiceIndex][7] = status
    }
    return { updatedCells: 1 }
  }

  async deleteRecord(spreadsheetId: string, sheetName: string, recordId: string) {
    const data = this.mockData[sheetName]
    if (data) {
      const index = data.findIndex(row => row[0] === recordId)
      if (index > 0) {
        data.splice(index, 1)
      }
    }
    return { deletedRows: 1 }
  }

  async addVendor(spreadsheetId: string, vendor: any) {
    const vendorRow = [
      vendor.id,
      vendor.name,
      vendor.email,
      vendor.phone,
      vendor.address,
      vendor.gstin,
      vendor.state,
      vendor.country,
      new Date().toISOString(),
      'Active'
    ]
    if (!this.mockData['Vendors']) {
      this.mockData['Vendors'] = [
        ['Vendor ID', 'Name', 'Email', 'Phone', 'Address', 'GSTIN', 'State', 'Country', 'Created Date', 'Status']
      ]
    }
    this.mockData['Vendors'].push(vendorRow)
    return { updatedCells: 1 }
  }

  async addQuotation(spreadsheetId: string, quotation: any) {
    const quotationRow = [
      quotation.id,
      quotation.customer,
      quotation.date,
      quotation.validUntil,
      quotation.amount,
      quotation.tax,
      quotation.total,
      quotation.status,
      quotation.items || 0,
      quotation.notes || '',
      false,
      ''
    ]
    if (!this.mockData['Quotations']) {
      this.mockData['Quotations'] = [
        ['Quote ID', 'Customer', 'Date', 'Valid Until', 'Amount', 'Tax', 'Total', 'Status', 'Items', 'Notes', 'Converted', 'Invoice ID']
      ]
    }
    this.mockData['Quotations'].push(quotationRow)
    return { updatedCells: 1 }
  }

  async updateRecordStatus(spreadsheetId: string, sheetName: string, recordId: string, status: string) {
    const data = this.mockData[sheetName]
    if (data) {
      const index = data.findIndex(row => row[0] === recordId)
      if (index > 0) {
        // Find status column (usually last column)
        const statusColumnIndex = data[0].findIndex(header => 
          header.toLowerCase().includes('status')
        )
        if (statusColumnIndex >= 0) {
          data[index][statusColumnIndex] = status
        }
      }
    }
    return { updatedCells: 1 }
  }

  async searchAllSheets(spreadsheetId: string, searchTerm: string) {
    const results = []
    for (const [sheetName, data] of Object.entries(this.mockData)) {
      const [headers, ...rows] = data
      const matchingRows = rows.filter(row =>
        row.some(cell => 
          cell && cell.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      
      matchingRows.forEach(row => {
        const record: any = { sheet: sheetName }
        headers.forEach((header, index) => {
          record[header] = row[index] || ''
        })
        results.push(record)
      })
    }
    return results
  }

  async exportSheetAsCSV(spreadsheetId: string, sheetName: string) {
    const data = this.mockData[sheetName] || []
    return data.map(row => 
      row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  async getSheetStats(spreadsheetId: string) {
    const stats: any = {}
    for (const [sheetName, data] of Object.entries(this.mockData)) {
      stats[sheetName] = {
        totalRecords: Math.max(0, data.length - 1),
        lastUpdated: new Date().toISOString()
      }
    }
    return stats
  }
}