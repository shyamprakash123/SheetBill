import { create } from 'zustand'
import { GoogleSheetsService, MockGoogleSheetsService } from '../lib/google-sheets'

interface Invoice {
  id: string
  customer: string
  date: string
  dueDate: string
  amount: number
  tax: number
  total: number
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'
  notes?: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: string | number
  hsnCode: string
  taxRate: string
  category: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  gstin: string
  state: string
  country: string
}

interface SheetsState {
  service: GoogleSheetsService | MockGoogleSheetsService
  spreadsheetId: string | null
  invoices: Invoice[]
  products: Product[]
  customers: Customer[]
  loading: boolean
  error: string | null
  setSpreadsheetId: (id: string) => void
  initializeService: (accessToken?: string) => void
  fetchInvoices: () => Promise<void>
  fetchProducts: () => Promise<void>
  fetchCustomers: () => Promise<void>
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>
  updateInvoiceStatus: (invoiceId: string, status: Invoice['status']) => Promise<void>
  deleteInvoice: (invoiceId: string) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  deleteCustomer: (customerId: string) => Promise<void>
  clearError: () => void
}

export const useSheetsStore = create<SheetsState>((set, get) => ({
  service: new MockGoogleSheetsService(),
  spreadsheetId: null,
  invoices: [],
  products: [],
  customers: [],
  loading: false,
  error: null,

  setSpreadsheetId: (id: string) => {
    set({ spreadsheetId: id })
  },

  initializeService: (accessToken?: string) => {
    const service = accessToken 
      ? new GoogleSheetsService(accessToken)
      : new MockGoogleSheetsService()
    
    set({ service })
  },

  fetchInvoices: async () => {
    const { service, spreadsheetId } = get()
    if (!spreadsheetId) return

    set({ loading: true, error: null })
    try {
      const data = await service.getSheetData(spreadsheetId, 'Invoices!A:I')
      const [headers, ...rows] = data
      const invoices = rows.map(row => ({
        id: row[0] || '',
        customer: row[1] || '',
        date: row[2] || '',
        dueDate: row[3] || '',
        amount: parseFloat(row[4]) || 0,
        tax: parseFloat(row[5]) || 0,
        total: parseFloat(row[6]) || 0,
        status: (row[7] as Invoice['status']) || 'Draft',
        notes: row[8] || '',
      }))
      set({ invoices })
    } catch (error) {
      console.error('Error fetching invoices:', error)
      set({ error: 'Failed to fetch invoices' })
    } finally {
      set({ loading: false })
    }
  },

  fetchProducts: async () => {
    const { service, spreadsheetId } = get()
    if (!spreadsheetId) return

    set({ loading: true, error: null })
    try {
      const data = await service.getSheetData(spreadsheetId, 'Products!A:H')
      const [headers, ...rows] = data
      const products = rows.map(row => ({
        id: row[0] || '',
        name: row[1] || '',
        description: row[2] || '',
        price: parseFloat(row[3]) || 0,
        stock: row[4] || 0,
        hsnCode: row[5] || '',
        taxRate: row[6] || '18%',
        category: row[7] || '',
      }))
      set({ products })
    } catch (error) {
      console.error('Error fetching products:', error)
      set({ error: 'Failed to fetch products' })
    } finally {
      set({ loading: false })
    }
  },

  fetchCustomers: async () => {
    const { service, spreadsheetId } = get()
    if (!spreadsheetId) return

    set({ loading: true, error: null })
    try {
      const data = await service.getSheetData(spreadsheetId, 'Customers!A:H')
      const [headers, ...rows] = data
      const customers = rows.map(row => ({
        id: row[0] || '',
        name: row[1] || '',
        email: row[2] || '',
        phone: row[3] || '',
        address: row[4] || '',
        gstin: row[5] || '',
        state: row[6] || '',
        country: row[7] || 'India',
      }))
      set({ customers })
    } catch (error) {
      console.error('Error fetching customers:', error)
      set({ error: 'Failed to fetch customers' })
    } finally {
      set({ loading: false })
    }
  },

  addInvoice: async (invoiceData: Omit<Invoice, 'id'>) => {
    const { service, spreadsheetId } = get()
    if (!spreadsheetId) return

    set({ loading: true, error: null })
    try {
      const invoice = {
        id: `INV-${Date.now()}`,
        ...invoiceData,
      }
      
      await service.addInvoice(spreadsheetId, invoice)
      await get().fetchInvoices()
    } catch (error) {
      console.error('Error adding invoice:', error)
      set({ error: 'Failed to add invoice' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  addProduct: async (productData: Omit<Product, 'id'>) => {
    const { service, spreadsheetId } = get()
    if (!spreadsheetId) return

    set({ loading: true, error: null })
    try {
      const product = {
        id: `PRD-${Date.now()}`,
        ...productData,
      }
      
      await service.addProduct(spreadsheetId, product)
      await get().fetchProducts()
    } catch (error) {
      console.error('Error adding product:', error)
      set({ error: 'Failed to add product' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  addCustomer: async (customerData: Omit<Customer, 'id'>) => {
    const { service, spreadsheetId } = get()
    if (!spreadsheetId) return

    set({ loading: true, error: null })
    try {
      const customer = {
        id: `CUST-${Date.now()}`,
        ...customerData,
      }
      
      await service.addCustomer(spreadsheetId, customer)
      await get().fetchCustomers()
    } catch (error) {
      console.error('Error adding customer:', error)
      set({ error: 'Failed to add customer' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateInvoiceStatus: async (invoiceId: string, status: Invoice['status']) => {
    const { service, spreadsheetId } = get()
    if (!spreadsheetId) return

    set({ loading: true, error: null })
    try {
      await service.updateInvoiceStatus(spreadsheetId, invoiceId, status)
      await get().fetchInvoices()
    } catch (error) {
      console.error('Error updating invoice status:', error)
      set({ error: 'Failed to update invoice status' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  deleteInvoice: async (invoiceId: string) => {
    const { service, spreadsheetId } = get()
    if (!spreadsheetId) return

    set({ loading: true, error: null })
    try {
      await service.deleteRecord(spreadsheetId, 'Invoices', invoiceId)
      await get().fetchInvoices()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      set({ error: 'Failed to delete invoice' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  deleteProduct: async (productId: string) => {
    const { service, spreadsheetId } = get()
    if (!spreadsheetId) return

    set({ loading: true, error: null })
    try {
      await service.deleteRecord(spreadsheetId, 'Products', productId)
      await get().fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      set({ error: 'Failed to delete product' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  deleteCustomer: async (customerId: string) => {
    const { service, spreadsheetId } = get()
    if (!spreadsheetId) return

    set({ loading: true, error: null })
    try {
      await service.deleteRecord(spreadsheetId, 'Customers', customerId)
      await get().fetchCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
      set({ error: 'Failed to delete customer' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))