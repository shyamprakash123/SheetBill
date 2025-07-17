// Invoice management service with Google Sheets backend
import { InvoiceFormData } from "../types/invoice";
import { googleSheetsSupabaseService } from "./google-sheets-supabase";
import { format } from "date-fns";

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
}

export interface Invoice extends InvoiceFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
  pdfUrl?: string;
  status: "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  gstin?: string;
  createdAt: string;
  status: "Active" | "Inactive";
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number | string;
  hsnCode: string;
  taxRate: number;
  category: string;
  unit: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  status: "Active" | "Inactive";
}

export interface CompanyDetails {
  logo: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  website: string;
}

export interface UserProfile {
  profile_img: string;
  name: string;
  email: string;
  phone: string;
}

export interface Preferences {
  roundoff: string;
  defaultDueDays: string;
  discountType: string;
  emailSubject: string;
  emailBody: string;
}

export interface ThermalPrintSettings {
  terms: string;
  companyDetails: string;
  showItemDescription: string;
  showHSN: string;
  showCashReceived: string;
  showLogo: string;
}

export interface SignatureSettings {
  name: string;
  image: string;
}

export interface NotesAndTerms {
  type: string;
  label: string;
  note: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  branch: string;
}

export interface Settings {
  companyDetails: Partial<CompanyDetails>;
  userProfile: Partial<UserProfile>;
  preferences: Partial<Preferences>;
  thermalPrintSettings: Partial<ThermalPrintSettings>;
  signatures: Partial<SignatureSettings>;
  notesTerms: Partial<NotesAndTerms>[];
  banks: Partial<BankDetails>[];
}

export class InvoiceService {
  private sheetsService: typeof googleSheetsSupabaseService;
  private spreadsheetId: string;

  constructor(accessToken: string, spreadsheetId: string) {
    this.sheetsService = googleSheetsSupabaseService;
    this.spreadsheetId = spreadsheetId;
  }

  // Invoice CRUD operations
  async createInvoice(
    invoiceData: Omit<Invoice, "id" | "createdAt" | "updatedAt">
  ): Promise<Invoice> {
    const invoice: Invoice = {
      id: `${invoiceData.invoicePrefix}${Date.now()}`,
      ...invoiceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const row = [
      // Basic Info
      invoice.id,
      invoice.documentType,
      invoice.invoiceType,
      invoice.invoiceNumber,
      invoice.invoicePrefix,
      invoice.invoiceDate,
      invoice.dueDate || "",
      invoice.supplierInvoiceDate || "",
      invoice.supplierInvoiceNumber || "",
      invoice.reference || "",

      // Address & Parties
      JSON.stringify(invoice.dispatchFromAddress || {}),
      JSON.stringify(invoice.customer || {}),
      JSON.stringify(invoice.vendor || {}),

      // Items & Pricing
      JSON.stringify(invoice.items),
      JSON.stringify(invoice.globalDiscount),
      JSON.stringify(invoice.additionalCharges),

      // Tax & Deductions
      JSON.stringify(invoice.tds),
      JSON.stringify(invoice.tdsUnderGst),
      JSON.stringify(invoice.tcs),
      invoice.extraDiscount,
      invoice.roundOff,

      // Payment & Bank
      JSON.stringify(invoice.bankAccount || {}),
      invoice.markedAsPaid,
      invoice.paymentNotes || "",

      // Additional Info
      invoice.notes,
      JSON.stringify(invoice.signature || {}),
      JSON.stringify(
        invoice.attachments?.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          // Note: File content would need to be handled separately
          // as Google Sheets can't store binary data directly
        })) || []
      ),

      // System Fields
      invoice.status,
      invoice.createdAt,
      invoice.updatedAt,
      invoice.pdfUrl || "",
    ];

    await this.sheetsService.appendToSheet(this.spreadsheetId, "Invoices!A2", [
      row,
    ]);
    return invoice;
  }

  async getInvoices(): Promise<Invoice[]> {
    try {
      const data = await this.sheetsService.getSheetData(
        this.spreadsheetId,
        "Invoices!A2:M"
      );
      if (!data || data.length === 0) {
        return [];
      }

      // const [headers, ...rows] = data
      // if (!rows || rows.length === 0) {
      //   return []
      // }

      return data
        .map((row) => ({
          id: row[0] || "",
          customerId: row[1] || "",
          customerName: row[2] || "",
          date: row[3] || "",
          dueDate: row[4] || "",
          subtotal: parseFloat(row[5]) || 0,
          taxAmount: parseFloat(row[6]) || 0,
          total: parseFloat(row[7]) || 0,
          status: (row[8] as Invoice["status"]) || "Draft",
          notes: row[9] || "",
          items: row[10] ? JSON.parse(row[10]) : [],
          paymentTerms: row[11] || "",
          createdAt: row[12] || "",
          updatedAt: row[13] || "",
          pdfUrl: row[14] || "",
        }))
        .filter((invoice) => invoice.id); // Filter out empty rows
    } catch (error) {
      console.error("Error getting invoices:", error);
      return []; // Return empty array instead of throwing
    }
  }

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    const invoices = await this.getInvoices();
    return invoices.find((inv) => inv.id === invoiceId) || null;
  }

  async updateInvoice(
    invoiceId: string,
    updates: Partial<Invoice>
  ): Promise<Invoice> {
    const invoices = await this.getInvoices();
    const invoiceIndex = invoices.findIndex((inv) => inv.id === invoiceId);

    if (invoiceIndex === -1) {
      throw new Error("Invoice not found");
    }

    const updatedInvoice = {
      ...invoices[invoiceIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

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
      updatedInvoice.notes || "",
      JSON.stringify(updatedInvoice.items),
      updatedInvoice.paymentTerms || "",
      updatedInvoice.createdAt,
      updatedInvoice.updatedAt,
      updatedInvoice.pdfUrl || "",
    ];

    const rowNumber = invoiceIndex + 2; // +1 for header, +1 for 1-based indexing
    await this.sheetsService.updateSheetData(
      this.spreadsheetId,
      `Invoices!A${rowNumber}:O${rowNumber}`,
      [row]
    );

    return updatedInvoice;
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    const invoices = await this.getInvoices();
    const invoiceIndex = invoices.findIndex((inv) => inv.id === invoiceId);

    if (invoiceIndex === -1) {
      throw new Error("Invoice not found");
    }

    // Mark as deleted instead of actually deleting
    await this.updateInvoice(invoiceId, { status: "Cancelled" });
  }

  // Customer CRUD operations
  async createCustomer(
    customerData: Omit<Customer, "id" | "createdAt">
  ): Promise<Customer> {
    const customer: Customer = {
      id: `CUST-${Date.now()}`,
      ...customerData,
      createdAt: new Date().toISOString(),
    };

    const row = [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.city,
      customer.state,
      customer.country,
      customer.gstin || "",
      customer.createdAt,
      customer.status,
    ];

    await this.sheetsService.appendToSheet(this.spreadsheetId, "Customers!A2", [
      row,
    ]);
    return customer;
  }

  async getCustomers(): Promise<Customer[]> {
    try {
      const data = await this.sheetsService.getSheetData(
        this.spreadsheetId,
        "Customers!A2:K"
      );
      if (!data || data.length === 0) {
        return [];
      }

      // const [headers, ...rows] = data
      // if (!rows || rows.length === 0) {
      //   return []
      // }

      return data
        .map((row) => ({
          id: row[0] || "",
          name: row[1] || "",
          email: row[2] || "",
          phone: row[3] || "",
          address: row[4] || "",
          city: row[5] || "",
          state: row[6] || "",
          country: row[7] || "India",
          gstin: row[8] || "",
          createdAt: row[9] || "",
          status: (row[10] as Customer["status"]) || "Active",
        }))
        .filter((customer) => customer.id); // Filter out empty rows
    } catch (error) {
      console.error("Error getting customers:", error);
      return []; // Return empty array instead of throwing
    }
  }

  async updateCustomer(
    customerId: string,
    updates: Partial<Customer>
  ): Promise<Customer> {
    const customers = await this.getCustomers();
    const customerIndex = customers.findIndex((cust) => cust.id === customerId);

    if (customerIndex === -1) {
      throw new Error("Customer not found");
    }

    const updatedCustomer = { ...customers[customerIndex], ...updates };

    const row = [
      updatedCustomer.id,
      updatedCustomer.name,
      updatedCustomer.email,
      updatedCustomer.phone,
      updatedCustomer.address,
      updatedCustomer.city,
      updatedCustomer.state,
      updatedCustomer.country,
      updatedCustomer.gstin || "",
      updatedCustomer.createdAt,
      updatedCustomer.status,
    ];

    const rowNumber = customerIndex + 2;
    await this.sheetsService.updateSheetData(
      this.spreadsheetId,
      `Customers!A${rowNumber}:K${rowNumber}`,
      [row]
    );

    return updatedCustomer;
  }

  // Settings CRUD operations
  // READ entire settings as grouped sections
  async getAllSettings(): Promise<Record<string, Record<string, string>>> {
    const rows = await this.sheetsService.getSheetData(
      this.spreadsheetId,
      `Settings!A:E`
    );
    const settings: Record<string, Record<string, string>> = {};

    let currentSection = "";

    for (const row of rows) {
      if (row[0] === "Section") {
        currentSection = row[1];
        settings[currentSection] = {};
      } else if (currentSection && row[0]) {
        settings[currentSection][row[0]] = row[1] ?? "";
      }
    }

    return settings;
  }

  // UPDATE values in a specific section
  async updateSection(
    section: string,
    updates: Record<string, string>,
    updatedBy = "system"
  ): Promise<void> {
    const rows = await this.sheetsService.getSheetData(
      this.spreadsheetId,
      `Settings!A:E`
    );

    let sectionStart = -1;

    // 1. Find section start
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === "Section" && rows[i][1] === section) {
        sectionStart = i + 1;
        break;
      }
    }

    if (sectionStart === -1) throw new Error(`Section "${section}" not found.`);

    // 2. Collect batch updates
    const now = new Date().toISOString();
    const batchUpdates: { range: string; values: any[][] }[] = [];

    for (let i = sectionStart; i < rows.length; i++) {
      const [key] = rows[i];
      if (key === "Section") break; // reached next section

      if (updates[key] !== undefined) {
        const rowNum = i + 1;
        batchUpdates.push({
          range: `Settings!B${rowNum}:E${rowNum}`,
          values: [[updates[key], rows[i][2], now, updatedBy]],
        });
      }
    }

    if (batchUpdates.length > 0) {
      await this.sheetsService.batchUpdateSheetData(
        this.spreadsheetId,
        batchUpdates
      );
    }
  }

  // CREATE a new section (appends to end)
  async createSection(
    section: string,
    fields: Record<string, { value: string; description: string }>,
    createdBy = "system"
  ) {
    const now = new Date().toISOString();
    const rows: any[][] = [];

    rows.push(["Section", section, "", "", ""]);
    for (const [key, { value, description }] of Object.entries(fields)) {
      rows.push([key, value, description, now, createdBy]);
    }

    const existing = await this.sheetsService.getSheetData(
      this.spreadsheetId,
      `Settings!A:A`
    );
    const startRow = existing.length + 1;

    await this.sheetsService.updateSheetData(
      this.spreadsheetId,
      `Settings!A${startRow}:E`,
      rows
    );
  }

  // DELETE a section (optional: soft delete only if needed)
  async deleteSection(section: string): Promise<void> {
    const rows = await this.sheetsService.getSheetData(
      this.spreadsheetId,
      `Settings!A:E`
    );
    let start = -1;
    let end = rows.length;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === "Section" && rows[i][1] === section) {
        start = i;
      } else if (start !== -1 && rows[i][0] === "Section") {
        end = i;
        break;
      }
    }

    if (start === -1) throw new Error(`Section "${section}" not found`);

    // Clear the rows in the range
    const range = `Settings!A${start + 1}:E${end}`;
    const emptyRows = Array.from({ length: end - start }, () => [
      "",
      "",
      "",
      "",
      "",
    ]);

    await this.sheetsService.updateSheetData(
      this.spreadsheetId,
      range,
      emptyRows
    );
  }

  // Product CRUD operations
  async createProduct(
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<Product> {
    const product: Product = {
      id: `PRD-${Date.now()}`,
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

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
      product.imageUrl || "",
      product.createdAt,
      product.updatedAt,
      product.status,
    ];

    await this.sheetsService.appendToSheet(this.spreadsheetId, "Products!A2", [
      row,
    ]);
    return product;
  }

  async getProducts(): Promise<Product[]> {
    try {
      const data = await this.sheetsService.getSheetData(
        this.spreadsheetId,
        "Products!A2:M"
      );
      if (!data || data.length === 0) return [];

      // const [headers, ...rows] = data
      // if (!rows || rows.length === 0) return []

      return data
        .filter((row) => row.length >= 13 && row[0]) // Ensure data completeness
        .map((row) => {
          const stockVal = parseFloat(row[4]);
          return {
            id: row[0] || "",
            name: row[1] || "",
            description: row[2] || "",
            price: parseFloat(row[3]) || 0,
            stock: isNaN(stockVal) ? row[4] || "" : stockVal,
            hsnCode: row[5] || "",
            taxRate: parseFloat(row[6]) || 18,
            category: row[7] || "",
            unit: row[8] || "pcs",
            imageUrl: row[9] || "",
            createdAt: row[10] || "",
            updatedAt: row[11] || "",
            status: (row[12] as Product["status"]) || "Active",
          };
        });
    } catch (error) {
      console.error("Error getting products:", error);
      return [];
    }
  }

  async updateProduct(
    productId: string,
    updates: Partial<Product>
  ): Promise<Product> {
    const products = await this.getProducts();
    const productIndex = products.findIndex((prod) => prod.id === productId);

    if (productIndex === -1) {
      throw new Error("Product not found");
    }

    const updatedProduct = {
      ...products[productIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

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
      updatedProduct.imageUrl || "",
      updatedProduct.createdAt,
      updatedProduct.updatedAt,
      updatedProduct.status,
    ];

    const rowNumber = productIndex + 2;
    await this.sheetsService.updateSheetData(
      this.spreadsheetId,
      `Products!A${rowNumber}:M${rowNumber}`,
      [row]
    );

    return updatedProduct;
  }

  // Search functionality
  async searchInvoices(query: string): Promise<Invoice[]> {
    const invoices = await this.getInvoices();
    const searchTerm = query.toLowerCase();

    return invoices.filter(
      (invoice) =>
        invoice.id.toLowerCase().includes(searchTerm) ||
        invoice.customerName.toLowerCase().includes(searchTerm) ||
        invoice.status.toLowerCase().includes(searchTerm)
    );
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const customers = await this.getCustomers();
    const searchTerm = query.toLowerCase();

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm)
    );
  }

  async searchProducts(query: string): Promise<Product[]> {
    const products = await this.getProducts();
    const searchTerm = query.toLowerCase();

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
  }

  // Analytics
  async getInvoiceStats() {
    const invoices = await this.getInvoices();

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidInvoices = invoices.filter((inv) => inv.status === "Paid");
    const pendingInvoices = invoices.filter((inv) => inv.status === "Sent");
    const overdueInvoices = invoices.filter((inv) => inv.status === "Overdue");

    return {
      totalInvoices: invoices.length,
      totalRevenue,
      paidAmount: paidInvoices.reduce((sum, inv) => sum + inv.total, 0),
      pendingAmount: pendingInvoices.reduce((sum, inv) => sum + inv.total, 0),
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.total, 0),
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      overdueCount: overdueInvoices.length,
    };
  }
}
