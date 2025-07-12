// Invoice management service with Google Sheets backend
import { GoogleSheetsAPI } from './google-api'
import { format } from 'date-fns'

export interface InvoiceItem {
  id: string
  productId: string
  productName: string
  description: string
  quantity: number
  rate: number
  amount: number
  taxRate: number
  taxAmount: number
}

export interface Invoice {
  id: string
  customerId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
  customerGSTIN?: string
  date: string
  dueDate: string
  subtotal: number
  taxAmount: number
  total: number
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'
  notes?: string
  items: InvoiceItem[]
  paymentTerms?: string
  createdAt: string
  updatedAt: string
  pdfUrl?: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  gstin?: string
  createdAt: string
  status: 'Active' | 'Inactive'
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number | string
  hsnCode: string
  taxRate: number
  category: string
  unit: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
  status: 'Active' | 'Inactive'
}

export class InvoiceService {
  private sheetsAPI: GoogleSheetsAPI
  private spreadsheetId: string

  constructor(accessToken: string, spreadsheetId: string) {
    this.sheetsAPI = new GoogleSheetsAPI(accessToken)
    this.spreadsheetId = spreadsheetId
  }

  // Invoice CRUD operations
  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const invoice: Invoice = {
      id: `INV-${Date.now()}`,
      ...invoiceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const row = [
      invoice.id,
      invoice.customerId,
      invoice.customerName,
      invoice.date,
      invoice.dueDate,
      invoice.subtotal,
      invoice.taxAmount,
      invoice.total,
      invoice.status,
      invoice.notes || '',
      JSON.stringify(invoice.items),
      invoice.paymentTerms || '',
      invoice.createdAt,
      invoice.updatedAt,
      invoice.pdfUrl || ''
    ]

    await this.sheetsAPI.appendToSheet(this.spreadsheetId, 'Invoices!A1', [row])
    return invoice
  }

  async getInvoices(): Promise<Invoice[]> {
    try {
      const data = await this.sheetsAPI.getSheetData(this.spreadsheetId, 'Invoices!A:M')
      if (!data || data.length === 0) {
        return []
      }
      
      // const [headers, ...rows] = data
      // if (!rows || rows.length === 0) {
      //   return []
      // }

      return data.map(row => ({
        id: row[0] || '',
        customerId: row[1] || '',
        customerName: row[2] || '',
        date: row[3] || '',
        dueDate: row[4] || '',
        subtotal: parseFloat(row[5]) || 0,
        taxAmount: parseFloat(row[6]) || 0,
        total: parseFloat(row[7]) || 0,
        status: (row[8] as Invoice['status']) || 'Draft',
        notes: row[9] || '',
        items: row[10] ? JSON.parse(row[10]) : [],
        paymentTerms: row[11] || '',
        createdAt: row[12] || '',
        updatedAt: row[13] || '',
        pdfUrl: row[14] || ''
      })).filter(invoice => invoice.id) // Filter out empty rows
    } catch (error) {
      console.error('Error getting invoices:', error)
      return [] // Return empty array instead of throwing
    }
  }

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    const invoices = await this.getInvoices()
    return invoices.find(inv => inv.id === invoiceId) || null
  }

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice> {
    const invoices = await this.getInvoices()
    const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId)
    
    if (invoiceIndex === -1) {
      throw new Error('Invoice not found')
    }

    const updatedInvoice = {
      ...invoices[invoiceIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    const row = [
      updatedInvoice.id,
      updatedInvoice.customerId,
      updatedInvoice.customerName,
      updatedInvoice.date,
      updatedInvoice.dueDate,
      updatedInvoice.subtotal,
      updatedInvoice.taxAmount,
      updatedInvoice.total,
      updatedInvoice.status,
      updatedInvoice.notes || '',
      JSON.stringify(updatedInvoice.items),
      updatedInvoice.paymentTerms || '',
      updatedInvoice.createdAt,
      updatedInvoice.updatedAt,
      updatedInvoice.pdfUrl || ''
    ]

    const rowNumber = invoiceIndex + 2 // +1 for header, +1 for 1-based indexing
    await this.sheetsAPI.updateSheetData(
      this.spreadsheetId, 
      `Invoices!A${rowNumber}:O${rowNumber}`, 
      [row]
    )

    return updatedInvoice
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    const invoices = await this.getInvoices()
    const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId)
    
    if (invoiceIndex === -1) {
      throw new Error('Invoice not found')
    }

    // Mark as deleted instead of actually deleting
    await this.updateInvoice(invoiceId, { status: 'Cancelled' })
  }

  // Customer CRUD operations
  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const customer: Customer = {
      id: `CUST-${Date.now()}`,
      ...customerData,
      createdAt: new Date().toISOString()
    }

    const row = [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.city,
      customer.state,
      customer.country,
      customer.gstin || '',
      customer.createdAt,
      customer.status
    ]

    await this.sheetsAPI.appendToSheet(this.spreadsheetId, 'Customers!A1', [row])
    return customer
  }

  async getCustomers(): Promise<Customer[]> {
    try {
      const data = await this.sheetsAPI.getSheetData(this.spreadsheetId, 'Customers!A:K')
      if (!data || data.length === 0) {
        return []
      }
      
      // const [headers, ...rows] = data
      // if (!rows || rows.length === 0) {
      //   return []
      // }

      return data.map(row => ({
        id: row[0] || '',
        name: row[1] || '',
        email: row[2] || '',
        phone: row[3] || '',
        address: row[4] || '',
        city: row[5] || '',
        state: row[6] || '',
        country: row[7] || 'India',
        gstin: row[8] || '',
        createdAt: row[9] || '',
        status: (row[10] as Customer['status']) || 'Active'
      })).filter(customer => customer.id) // Filter out empty rows
    } catch (error) {
      console.error('Error getting customers:', error)
      return [] // Return empty array instead of throwing
    }
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer> {
    const customers = await this.getCustomers()
    const customerIndex = customers.findIndex(cust => cust.id === customerId)
    
    if (customerIndex === -1) {
      throw new Error('Customer not found')
    }

    const updatedCustomer = { ...customers[customerIndex], ...updates }

    const row = [
      updatedCustomer.id,
      updatedCustomer.name,
      updatedCustomer.email,
      updatedCustomer.phone,
      updatedCustomer.address,
      updatedCustomer.city,
      updatedCustomer.state,
      updatedCustomer.country,
      updatedCustomer.gstin || '',
      updatedCustomer.createdAt,
      updatedCustomer.status
    ]

    const rowNumber = customerIndex + 2
    await this.sheetsAPI.updateSheetData(
      this.spreadsheetId, 
      `Customers!A${rowNumber}:K${rowNumber}`, 
      [row]
    )

    return updatedCustomer
  }

  // Product CRUD operations
  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const product: Product = {
      id: `PRD-${Date.now()}`,
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const row = [
      product.id,
      product.name,
      product.description,
      product.price,
      product.stock,
      product.hsnCode,
      product.taxRate,
      product.category,
      product.unit,
      product.imageUrl || '',
      product.createdAt,
      product.updatedAt,
      product.status
    ]

    await this.sheetsAPI.appendToSheet(this.spreadsheetId, 'Products!A1', [row])
    return product
  }

  async getProducts(): Promise<Product[]> {
  try {
    const data = await this.sheetsAPI.getSheetData(this.spreadsheetId, 'Products!A:M')
    if (!data || data.length === 0) return []

    // const [headers, ...rows] = data
    // if (!rows || rows.length === 0) return []

    return data
      .filter(row => row.length >= 13 && row[0]) // Ensure data completeness
      .map(row => {
        const stockVal = parseFloat(row[4])
        return {
          id: row[0] || '',
          name: row[1] || '',
          description: row[2] || '',
          price: parseFloat(row[3]) || 0,
          stock: isNaN(stockVal) ? (row[4] || '') : stockVal,
          hsnCode: row[5] || '',
          taxRate: parseFloat(row[6]) || 18,
          category: row[7] || '',
          unit: row[8] || 'pcs',
          imageUrl: row[9] || '',
          createdAt: row[10] || '',
          updatedAt: row[11] || '',
          status: (row[12] as Product['status']) || 'Active'
        }
      })
  } catch (error) {
    console.error('Error getting products:', error)
    return []
  }
}


  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    const products = await this.getProducts()
    const productIndex = products.findIndex(prod => prod.id === productId)
    
    if (productIndex === -1) {
      throw new Error('Product not found')
    }

    const updatedProduct = {
      ...products[productIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    const row = [
      updatedProduct.id,
      updatedProduct.name,
      updatedProduct.description,
      updatedProduct.price,
      updatedProduct.stock,
      updatedProduct.hsnCode,
      updatedProduct.taxRate,
      updatedProduct.category,
      updatedProduct.unit,
      updatedProduct.imageUrl || '',
      updatedProduct.createdAt,
      updatedProduct.updatedAt,
      updatedProduct.status
    ]

    const rowNumber = productIndex + 2
    await this.sheetsAPI.updateSheetData(
      this.spreadsheetId, 
      `Products!A${rowNumber}:M${rowNumber}`, 
      [row]
    )

    return updatedProduct
  }

  // Search functionality
  async searchInvoices(query: string): Promise<Invoice[]> {
    const invoices = await this.getInvoices()
    const searchTerm = query.toLowerCase()
    
    return invoices.filter(invoice => 
      invoice.id.toLowerCase().includes(searchTerm) ||
      invoice.customerName.toLowerCase().includes(searchTerm) ||
      invoice.status.toLowerCase().includes(searchTerm)
    )
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const customers = await this.getCustomers()
    const searchTerm = query.toLowerCase()
    
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm) ||
      customer.phone.includes(searchTerm)
    )
  }

  async searchProducts(query: string): Promise<Product[]> {
    const products = await this.getProducts()
    const searchTerm = query.toLowerCase()
    
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    )
  }

  // Analytics
  async getInvoiceStats() {
    const invoices = await this.getInvoices()
    
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid')
    const pendingInvoices = invoices.filter(inv => inv.status === 'Sent')
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue')
    
    return {
      totalInvoices: invoices.length,
      totalRevenue,
      paidAmount: paidInvoices.reduce((sum, inv) => sum + inv.total, 0),
      pendingAmount: pendingInvoices.reduce((sum, inv) => sum + inv.total, 0),
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.total, 0),
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      overdueCount: overdueInvoices.length
    }
  }
}