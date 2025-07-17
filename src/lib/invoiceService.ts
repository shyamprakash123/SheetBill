import { InvoiceFormData } from "../types/invoice";

export interface Invoice extends InvoiceFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
  pdfUrl?: string;
  status: "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";
}

export class InvoiceService {
  private sheetsService: any; // Replace with your actual sheets service type
  private spreadsheetId: string;

  constructor(sheetsService: any, spreadsheetId: string) {
    this.sheetsService = sheetsService;
    this.spreadsheetId = spreadsheetId;
  }

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

  async updateInvoice(
    invoiceId: string,
    updates: Partial<Omit<Invoice, "id" | "createdAt">>
  ): Promise<Invoice> {
    // First get the existing invoice
    const existingInvoices = await this.getInvoices();
    const existingInvoice = existingInvoices.find(
      (inv) => inv.id === invoiceId
    );

    if (!existingInvoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }

    const updatedInvoice: Invoice = {
      ...existingInvoice,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Find the row index (add 2 because of header row and 0-based indexing)
    const rowIndex =
      existingInvoices.findIndex((inv) => inv.id === invoiceId) + 2;

    const row = [
      // Basic Info
      updatedInvoice.id,
      updatedInvoice.documentType,
      updatedInvoice.invoiceType,
      updatedInvoice.invoiceNumber,
      updatedInvoice.invoicePrefix,
      updatedInvoice.invoiceDate,
      updatedInvoice.dueDate || "",
      updatedInvoice.supplierInvoiceDate || "",
      updatedInvoice.supplierInvoiceNumber || "",
      updatedInvoice.reference || "",

      // Address & Parties
      JSON.stringify(updatedInvoice.dispatchFromAddress || {}),
      JSON.stringify(updatedInvoice.customer || {}),
      JSON.stringify(updatedInvoice.vendor || {}),

      // Items & Pricing
      JSON.stringify(updatedInvoice.items),
      JSON.stringify(updatedInvoice.globalDiscount),
      JSON.stringify(updatedInvoice.additionalCharges),

      // Tax & Deductions
      JSON.stringify(updatedInvoice.tds),
      JSON.stringify(updatedInvoice.tdsUnderGst),
      JSON.stringify(updatedInvoice.tcs),
      updatedInvoice.extraDiscount,
      updatedInvoice.roundOff,

      // Payment & Bank
      JSON.stringify(updatedInvoice.bankAccount || {}),
      updatedInvoice.markedAsPaid,
      updatedInvoice.paymentNotes || "",

      // Additional Info
      updatedInvoice.notes,
      JSON.stringify(updatedInvoice.signature || {}),
      JSON.stringify(
        updatedInvoice.attachments?.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })) || []
      ),

      // System Fields
      updatedInvoice.status,
      updatedInvoice.createdAt,
      updatedInvoice.updatedAt,
      updatedInvoice.pdfUrl || "",
    ];

    await this.sheetsService.updateSheetRow(
      this.spreadsheetId,
      `Invoices!A${rowIndex}:AF${rowIndex}`,
      [row]
    );

    return updatedInvoice;
  }

  async getInvoices(): Promise<Invoice[]> {
    try {
      const data = await this.sheetsService.getSheetData(
        this.spreadsheetId,
        "Invoices!A2:AF" // Extended to column AF to accommodate all fields
      );

      if (!data || data.length === 0) {
        return [];
      }

      return data
        .map((row): Invoice => {
          try {
            return {
              // Basic Info
              id: row[0] || "",
              documentType: row[1] || "sales-invoice",
              invoiceType: row[2] || "regular",
              invoiceNumber: row[3] || "",
              invoicePrefix: row[4] || "",
              invoiceDate: row[5] || "",
              dueDate: row[6] || undefined,
              supplierInvoiceDate: row[7] || undefined,
              supplierInvoiceNumber: row[8] || undefined,
              reference: row[9] || undefined,

              // Address & Parties
              dispatchFromAddress: row[10]
                ? this.safeJsonParse(row[10])
                : undefined,
              customer: row[11] ? this.safeJsonParse(row[11]) : undefined,
              vendor: row[12] ? this.safeJsonParse(row[12]) : undefined,

              // Items & Pricing
              items: row[13] ? this.safeJsonParse(row[13], []) : [],
              globalDiscount: row[14]
                ? this.safeJsonParse(row[14], { type: "percentage", value: 0 })
                : { type: "percentage", value: 0 },
              additionalCharges: row[15] ? this.safeJsonParse(row[15], []) : [],

              // Tax & Deductions
              tds: row[16]
                ? this.safeJsonParse(row[16], {
                    enabled: false,
                    rate: 0,
                    amount: 0,
                  })
                : { enabled: false, rate: 0, amount: 0 },
              tdsUnderGst: row[17]
                ? this.safeJsonParse(row[17], {
                    enabled: false,
                    rate: 0,
                    amount: 0,
                  })
                : { enabled: false, rate: 0, amount: 0 },
              tcs: row[18]
                ? this.safeJsonParse(row[18], {
                    enabled: false,
                    rate: 0,
                    amount: 0,
                  })
                : { enabled: false, rate: 0, amount: 0 },
              extraDiscount: parseFloat(row[19]) || 0,
              roundOff: row[20] === "true" || row[20] === true,

              // Payment & Bank
              bankAccount: row[21] ? this.safeJsonParse(row[21]) : undefined,
              markedAsPaid: row[22] === "true" || row[22] === true,
              paymentNotes: row[23] || undefined,

              // Additional Info
              notes: row[24] || "",
              signature: row[25] ? this.safeJsonParse(row[25]) : undefined,
              attachments: [], // Files would need special handling

              // System Fields
              status: (row[27] as Invoice["status"]) || "Draft",
              createdAt: row[28] || "",
              updatedAt: row[29] || "",
              pdfUrl: row[30] || undefined,
            };
          } catch (error) {
            console.error("Error parsing invoice row:", error, row);
            return null;
          }
        })
        .filter(
          (invoice): invoice is Invoice => invoice !== null && invoice.id !== ""
        );
    } catch (error) {
      console.error("Error getting invoices:", error);
      return [];
    }
  }

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    const invoices = await this.getInvoices();
    return invoices.find((invoice) => invoice.id === invoiceId) || null;
  }

  async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      const invoices = await this.getInvoices();
      const rowIndex = invoices.findIndex((inv) => inv.id === invoiceId);

      if (rowIndex === -1) {
        throw new Error(`Invoice with ID ${invoiceId} not found`);
      }

      // Delete the row (add 2 because of header row and 0-based indexing)
      await this.sheetsService.deleteSheetRow(this.spreadsheetId, rowIndex + 2);

      return true;
    } catch (error) {
      console.error("Error deleting invoice:", error);
      return false;
    }
  }

  // Helper method for safe JSON parsing
  private safeJsonParse(jsonString: string, defaultValue: any = null): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn("Failed to parse JSON:", jsonString, error);
      return defaultValue;
    }
  }

  // Method to calculate totals from invoice data
  calculateInvoiceTotals(invoice: Invoice) {
    const subtotal = invoice.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const itemDiscounts = invoice.items.reduce((sum, item) => {
      const baseAmount = item.quantity * item.unitPrice;
      return (
        sum +
        (item.discount.type === "percentage"
          ? (baseAmount * item.discount.value) / 100
          : item.discount.value)
      );
    }, 0);

    const globalDiscountAmount =
      invoice.globalDiscount.type === "percentage"
        ? (subtotal * invoice.globalDiscount.value) / 100
        : invoice.globalDiscount.value;

    const discountedSubtotal = subtotal - itemDiscounts - globalDiscountAmount;
    const taxAmount = invoice.items.reduce(
      (sum, item) => sum + item.taxAmount,
      0
    );
    const additionalChargesTotal = invoice.additionalCharges.reduce(
      (sum, charge) => sum + charge.amount,
      0
    );

    let total =
      discountedSubtotal +
      taxAmount +
      additionalChargesTotal -
      invoice.extraDiscount;

    // Apply TDS, TCS
    if (invoice.tds.enabled) {
      total -= invoice.tds.amount;
    }
    if (invoice.tdsUnderGst.enabled) {
      total -= invoice.tdsUnderGst.amount;
    }
    if (invoice.tcs.enabled) {
      total += invoice.tcs.amount;
    }

    // Round off
    const roundedTotal = invoice.roundOff ? Math.round(total) : total;
    const roundOffAmount = roundedTotal - total;

    return {
      subtotal,
      totalDiscount:
        itemDiscounts + globalDiscountAmount + invoice.extraDiscount,
      taxAmount,
      additionalChargesTotal,
      total: roundedTotal,
      roundOffAmount,
    };
  }
}
