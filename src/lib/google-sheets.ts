// Google Sheets API integration for SheetBill data backend
export class GoogleSheetsService {
  private accessToken: string | null = null

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null
  }

  // Initialize user's spreadsheet with default sheets
  async createUserSpreadsheet(userEmail: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Google access token required')
    }

    const spreadsheetData = {
      properties: {
        title: `SheetBill - ${userEmail}`,
      },
      sheets: [
        { properties: { title: 'Invoices' } },
        { properties: { title: 'Products' } },
        { properties: { title: 'Customers' } },
        { properties: { title: 'Vendors' } },
        { properties: { title: 'Payments' } },
        { properties: { title: 'Expenses' } },
        { properties: { title: 'Reports' } },
        { properties: { title: 'Quotations' } },
        { properties: { title: 'Credit_Notes' } },
      ]
    }

    try {
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spreadsheetData)
      })

      if (!response.ok) {
        throw new Error('Failed to create spreadsheet')
      }

      const result = await response.json()
      await this.initializeSheetHeaders(result.spreadsheetId)
      return result.spreadsheetId
    } catch (error) {
      console.error('Error creating spreadsheet:', error)
      throw error
    }
  }

  // Initialize headers for each sheet
  private async initializeSheetHeaders(spreadsheetId: string) {
    const headers = {
      'Invoices': ['Invoice ID', 'Customer', 'Date', 'Due Date', 'Amount', 'Tax', 'Total', 'Status', 'Notes'],
      'Products': ['Product ID', 'Name', 'Description', 'Price', 'Stock', 'HSN Code', 'Tax Rate', 'Category'],
      'Customers': ['Customer ID', 'Name', 'Email', 'Phone', 'Address', 'GSTIN', 'State', 'Country'],
      'Vendors': ['Vendor ID', 'Name', 'Email', 'Phone', 'Address', 'GSTIN', 'State', 'Country'],
      'Payments': ['Payment ID', 'Invoice ID', 'Amount', 'Date', 'Method', 'Status', 'Reference'],
      'Expenses': ['Expense ID', 'Description', 'Amount', 'Date', 'Category', 'Vendor', 'Tax', 'Receipt'],
      'Reports': ['Report Type', 'Period', 'Generated Date', 'Data', 'Status'],
      'Quotations': ['Quote ID', 'Customer', 'Date', 'Valid Until', 'Amount', 'Tax', 'Total', 'Status'],
      'Credit_Notes': ['Credit Note ID', 'Invoice ID', 'Customer', 'Date', 'Amount', 'Reason', 'Status'],
    }

    for (const [sheetName, headerRow] of Object.entries(headers)) {
      await this.updateSheetData(spreadsheetId, `${sheetName}!A1:${String.fromCharCode(64 + headerRow.length)}1`, [headerRow])
    }
  }

  // Generic method to update sheet data
  async updateSheetData(spreadsheetId: string, range: string, values: any[][]) {
    if (!this.accessToken) {
      throw new Error('Google access token required')
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update sheet data')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating sheet:', error)
      throw error
    }
  }

  // Get data from sheet
  async getSheetData(spreadsheetId: string, range: string) {
    if (!this.accessToken) {
      throw new Error('Google access token required')
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get sheet data')
      }

      const result = await response.json()
      return result.values || []
    } catch (error) {
      console.error('Error getting sheet data:', error)
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
      invoice.notes || ''
    ]

    const existingData = await this.getSheetData(spreadsheetId, 'Invoices!A:A')
    const nextRow = existingData.length + 1

    return this.updateSheetData(
      spreadsheetId,
      `Invoices!A${nextRow}:I${nextRow}`,
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
      product.category
    ]

    const existingData = await this.getSheetData(spreadsheetId, 'Products!A:A')
    const nextRow = existingData.length + 1

    return this.updateSheetData(
      spreadsheetId,
      `Products!A${nextRow}:H${nextRow}`,
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
      customer.country
    ]

    const existingData = await this.getSheetData(spreadsheetId, 'Customers!A:A')
    const nextRow = existingData.length + 1

    return this.updateSheetData(
      spreadsheetId,
      `Customers!A${nextRow}:H${nextRow}`,
      [customerRow]
    )
  }

  // Update invoice status
  async updateInvoiceStatus(spreadsheetId: string, invoiceId: string, status: string) {
    const data = await this.getSheetData(spreadsheetId, 'Invoices!A:I')
    const rowIndex = data.findIndex(row => row[0] === invoiceId)
    
    if (rowIndex > 0) { // Skip header row
      return this.updateSheetData(
        spreadsheetId,
        `Invoices!H${rowIndex + 1}`,
        [[status]]
      )
    }
    
    throw new Error('Invoice not found')
  }

  // Delete record
  async deleteRecord(spreadsheetId: string, sheetName: string, recordId: string) {
    // This would require more complex logic to delete rows
    // For now, we'll mark as deleted or implement via batch update
    console.log(`Delete ${recordId} from ${sheetName}`)
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
}