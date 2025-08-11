import { useAuthStore } from "../store/auth";
import { supabaseGoogleAuth } from "./supabase-google-auth";

export interface SheetData {
  range: string;
  values: any[][];
}

export class GoogleSheetsSupabaseService {
  private sheetIdMapCache: Record<string, number> | null = null;

  private async getValidAccessToken(): Promise<string> {
    const tokens = await supabaseGoogleAuth.getGoogleTokens();

    if (!tokens) {
      throw new Error(
        "No Google tokens available. Please sign in with Google."
      );
    }

    // Check if token is expired (with 5 minute buffer)
    const now = Date.now();
    const expiresAt = tokens.expires_at * 1000;

    // Refresh if expired or will expire in next 5 minutes
    if (expiresAt && now >= expiresAt - 5 * 60 * 1000) {
      // Token is expired or will expire soon, refresh it
      const refreshedTokens = await supabaseGoogleAuth.refreshGoogleToken();
      if (!refreshedTokens) {
        throw new Error("Failed to refresh Google tokens");
      }
      return refreshedTokens.access_token;
    }

    return tokens.access_token;
  }

  private async makeGoogleAPIRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const accessToken = await this.getValidAccessToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        `Google API request failed: ${
          error.error?.message || response.statusText
        }`
      );
    }

    return response;
  }

  // Create spreadsheet for user
  async createUserSpreadsheet(userEmail: string): Promise<string> {
    const spreadsheetData = {
      properties: {
        title: `SheetBill - ${userEmail}`,
        locale: "en_US",
        timeZone: "Asia/Kolkata",
        autoRecalc: "ON_CHANGE",
      },
      sheets: [
        {
          properties: {
            title: "Dashboard",
            gridProperties: { rowCount: 1000, columnCount: 26 },
          },
        },
        {
          properties: {
            title: "Invoices",
            gridProperties: { rowCount: 1000, columnCount: 20 },
          },
        },
        {
          properties: {
            title: "Products",
            gridProperties: { rowCount: 1000, columnCount: 15 },
          },
        },
        {
          properties: {
            title: "Customers",
            gridProperties: { rowCount: 1000, columnCount: 12 },
          },
        },
        {
          properties: {
            title: "Vendors",
            gridProperties: { rowCount: 1000, columnCount: 12 },
          },
        },
        {
          properties: {
            title: "Payments",
            gridProperties: { rowCount: 1000, columnCount: 8 },
          },
        },
        {
          properties: {
            title: "Expenses",
            gridProperties: { rowCount: 1000, columnCount: 10 },
          },
        },
        {
          properties: {
            title: "Quotations",
            gridProperties: { rowCount: 1000, columnCount: 12 },
          },
        },
        {
          properties: {
            title: "Credit_Notes",
            gridProperties: { rowCount: 1000, columnCount: 10 },
          },
        },
        {
          properties: {
            title: "Settings",
            gridProperties: { rowCount: 100, columnCount: 5 },
          },
        },
      ],
    };

    const response = await this.makeGoogleAPIRequest(
      "https://sheets.googleapis.com/v4/spreadsheets",
      {
        method: "POST",
        body: JSON.stringify(spreadsheetData),
      }
    );

    const result = await response.json();
    await this.initializeSheetHeaders(result.spreadsheetId);
    return result.spreadsheetId;
  }

  // Initialize headers for all sheets
  private async initializeSheetHeaders(spreadsheetId: string): Promise<void> {
    const now = new Date().toISOString();
    const systemUser = "system";

    const headers = {
      Invoices: [
        "Invoice ID",
        "Customer ID",
        "Customer Name",
        "Date",
        "Due Date",
        "Subtotal",
        "Tax Amount",
        "Total",
        "Status",
        "Notes",
        "Items",
        "Payment Terms",
        "Created At",
        "Updated At",
        "Ledger Id",
        "PDF URL",
      ],
      Products: [
        "Product ID",
        "Name",
        "Description",
        "Price",
        "Stock",
        "HSN Code",
        "Tax Rate",
        "Category",
        "Unit",
        "Image URL",
        "Created At",
        "Updated At",
        "Status",
      ],
      Customers: [
        "Row ID",
        "Customer ID",
        "Name",
        "Email",
        "Phone",
        "Address",
        "City",
        "State",
        "Country",
        "GSTIN",
        "Created At",
        "Status",
      ],
      Vendors: [
        "Vendor ID",
        "Name",
        "Email",
        "Phone",
        "Address",
        "City",
        "State",
        "Country",
        "GSTIN",
        "Created At",
        "Status",
      ],
      Quotations: [
        "Quote ID",
        "Customer ID",
        "Customer Name",
        "Date",
        "Valid Until",
        "Subtotal",
        "Tax Amount",
        "Total",
        "Status",
        "Items",
        "Notes",
        "Created At",
        "Updated At",
        "Converted To Invoice",
      ],
      Payments: [
        "Payment ID",
        "Invoice ID",
        "Amount",
        "Date",
        "Method",
        "Status",
        "Reference",
        "Notes",
      ],
      Expenses: [
        "Expense ID",
        "Description",
        "Amount",
        "Date",
        "Category",
        "Vendor",
        "Tax",
        "Receipt",
        "Status",
        "Approved By",
      ],
      Credit_Notes: [
        "Credit Note ID",
        "Invoice ID",
        "Customer",
        "Date",
        "Amount",
        "Reason",
        "Status",
        "Approved By",
        "Reference",
        "Notes",
      ],

      ViewInvoices: ['=SORT(INDIRECT("Invoices!A2:AH"), 1, FALSE)'],

      ViewCustomers: ['=SORT(INDIRECT("Customers!A2:AL"), 1, FALSE)'],

      Customer_Ledgers: [
        "Row ID",
        "Ledger ID",
        "Cutomer ID",
        "Document Id",
        "Date",
        "Status",
        "Amount",
        "Balance",
      ],

      Customer_View_Ledgers: [""],

      // Initialize Settings sheet with structured key-value rows
      Settings: [
        ["Section", "companyDetails", "", now, systemUser],
        ["name", "", "Company name", now, systemUser],
        ["billing_address", "", "Company address", now, systemUser],
        ["billing_city", "", "City", now, systemUser],
        ["billing_state", "", "State", now, systemUser],
        ["billing_pincode", "", "PIN Code", now, systemUser],
        ["billing_country", "India", "Country", now, systemUser],
        ["shipping_address", "", "Company address", now, systemUser],
        ["shipping_city", "", "City", now, systemUser],
        ["shipping_state", "", "State", now, systemUser],
        ["shipping_pincode", "", "PIN Code", now, systemUser],
        ["shipping_country", "India", "Country", now, systemUser],
        ["gstin", "", "GSTIN", now, systemUser],
        ["pan", "", "PAN number", now, systemUser],
        ["email", "", "Company email", now, systemUser],
        ["phone", "", "Company phone", now, systemUser],
        ["website", "", "Company website", now, systemUser],
        ["logo", "", "Company Logo", now, systemUser],

        ["Section", "userProfile", "", now, systemUser],
        ["name", "", "User full name", now, systemUser],
        ["email", "", "User email address", now, systemUser],
        ["phone", "", "User phone number", now, systemUser],
        ["profile_img", "", "Profile image URL", now, systemUser],

        ["Section", "preferences", "", now, systemUser],
        ["roundoff", "", "Enable roundoff", now, systemUser],
        ["defaultDueDays", "", "Default due days", now, systemUser],
        ["invoice_prefix", "INV", "Prefix for Invoice", now, systemUser],
        ["credit_prefix", "CR", "Prefix for Credit", now, systemUser],
        ["purchase_prefix", "PUR", "Prefix for Purchase", now, systemUser],
        ["expenses_prefix", "EXP", "Prefix for Expenses", now, systemUser],
        ["quotations_prefix", "QUO", "Prefix for Quotations", now, systemUser],
        ["discountType", "", "Discount type (percent/fixed)", now, systemUser],
        ["additionalCharges", "", "Additional Charges", now, systemUser],
        ["emailSubject", "", "Default email subject", now, systemUser],
        ["emailBody", "", "Default email body", now, systemUser],

        ["Section", "thermalPrintSettings", "", now, systemUser],
        ["terms", "", "Footer terms text", now, systemUser],
        ["companyDetails", "", "Show company info", now, systemUser],
        ["showItemDescription", "", "Show item descriptions", now, systemUser],
        ["showHSN", "", "Show HSN codes", now, systemUser],
        ["showCashReceived", "", "Show cash received", now, systemUser],
        ["showLogo", "", "Show logo", now, systemUser],

        ["Section", "signatures", "", now, systemUser],
        ["name", "", "Signature label", now, systemUser],
        ["image", "", "Signature image URL", now, systemUser],

        ["Section", "notesTerms", "", now, systemUser],
        ["invoice_notes", "", "Note or terms content", now, systemUser],
        ["sales_return_notes", "", "Note or terms content", now, systemUser],
        ["purchase_notes", "", "Note or terms content", now, systemUser],
        ["purchase_return_notes", "", "Note or terms content", now, systemUser],
        ["purchase_order_notes", "", "Note or terms content", now, systemUser],
        ["quotation_notes", "", "Note or terms content", now, systemUser],
        ["delivery_notes", "", "Note or terms content", now, systemUser],
        ["proforma_notes", "", "Note or terms content", now, systemUser],

        ["Section", "banks", "", now, systemUser],
        ["banks", "", "Banks", now, systemUser],
      ],
    };

    const requests = [];

    for (const [sheetName, headerOrRows] of Object.entries(headers)) {
      if (sheetName === "Settings") {
        requests.push({
          range: `${sheetName}!A1:E${headerOrRows.length}`,
          values: headerOrRows as string[][],
        });
      } else {
        const headerRow = headerOrRows as string[];
        const endColumn = String.fromCharCode(64 + headerRow.length);
        requests.push({
          range: `${sheetName}!A1:${endColumn}1`,
          values: [headerRow], // Wrap single row in an array to make it 2D
        });
      }
    }

    await this.batchUpdateSheetData(spreadsheetId, requests);
  }

  // Batch update sheet data
  async batchUpdateSheetData(
    spreadsheetId: string,
    data: { range: string; values: any[][] }[]
  ): Promise<any> {
    const response = await this.makeGoogleAPIRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({
          valueInputOption: "USER_ENTERED",
          data,
        }),
      }
    );

    return response.json();
  }

  // Batch update sheet data
  async batchUpdateSheet(
    spreadsheetId: string,
    requests: { range: string; values: any[][] }[]
  ): Promise<any> {
    const response = await this.makeGoogleAPIRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({
          requests,
        }),
      }
    );

    return response.json();
  }

  async getSheetIdMap(spreadsheetId: string) {
    if (this.sheetIdMapCache) return this.sheetIdMapCache;

    const res = await this.makeGoogleAPIRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`
    );

    const data = await res.json();

    this.sheetIdMapCache = {};

    data.sheets.forEach((sheet: any) => {
      this.sheetIdMapCache![sheet.properties.title] = sheet.properties.sheetId;
    });

    return this.sheetIdMapCache;
  }

  // Get sheet data
  async getSheetData(spreadsheetId: string, range: string): Promise<any[][]> {
    const encodedRange = encodeURIComponent(range);
    const response = await this.makeGoogleAPIRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`
    );

    const result = await response.json();
    return result.values || [];
  }

  // Update sheet data
  async updateSheetData(
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<any> {
    const encodedRange = encodeURIComponent(range);
    const response = await this.makeGoogleAPIRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        body: JSON.stringify({ values }),
      }
    );

    return response.json();
  }

  // Append data to sheet
  async appendToSheet(
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<any> {
    const encodedRange = encodeURIComponent(range);
    const response = await this.makeGoogleAPIRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        body: JSON.stringify({ values }),
      }
    );

    return response.json();
  }

  // Add invoice to sheet
  async addInvoice(spreadsheetId: string, invoice: any): Promise<any> {
    const invoiceRow = [
      invoice.id,
      invoice.customerId || "",
      invoice.customerName,
      invoice.date,
      invoice.dueDate,
      invoice.subtotal,
      invoice.taxAmount,
      invoice.total,
      invoice.status,
      invoice.notes || "",
      JSON.stringify(invoice.items || []),
      invoice.paymentTerms || "",
      invoice.createdAt,
      invoice.updatedAt,
      invoice.pdfUrl || "",
    ];

    return this.appendToSheet(spreadsheetId, "Invoices!A1", [invoiceRow]);
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
      product.unit || "pcs",
      product.imageUrl || "",
      product.createdAt,
      product.updatedAt,
      product.status || "Active",
    ];

    return this.appendToSheet(spreadsheetId, "Products!A1", [productRow]);
  }

  // Add customer to sheet
  async addCustomer(spreadsheetId: string, customer: any): Promise<any> {
    const customerRow = [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.city || "",
      customer.state || "",
      customer.country || "India",
      customer.gstin || "",
      customer.createdAt,
      customer.status || "Active",
    ];

    return this.appendToSheet(spreadsheetId, "Customers!A1", [customerRow]);
  }

  // Add vendor to sheet
  async addVendor(spreadsheetId: string, vendor: any): Promise<any> {
    const vendorRow = [
      vendor.id,
      vendor.name,
      vendor.email,
      vendor.phone,
      vendor.address,
      vendor.city || "",
      vendor.state || "",
      vendor.country || "India",
      vendor.gstin || "",
      vendor.createdAt,
      vendor.status || "Active",
    ];

    return this.appendToSheet(spreadsheetId, "Vendors!A1", [vendorRow]);
  }
}

export const googleSheetsSupabaseService = new GoogleSheetsSupabaseService();
