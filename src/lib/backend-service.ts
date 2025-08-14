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

export interface CustomerLedger {
  ledger_id: string;
  customer_id: string;
  document_id: string;
  date: string;
  status: string;
  type: string;
  amount: string;
  balance: string;
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

function dateStringToSerial(dateStr) {
  // Sheets serial number calculation
  const date = new Date(dateStr + "T00:00:00Z");
  return Math.floor(date.getTime() / (1000 * 60 * 60 * 24)) + 25569;
}

function getUserEnteredValue(val) {
  // Real date detection
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const serial =
      (new Date(val) - new Date("1899-12-30")) / (1000 * 60 * 60 * 24);
    return {
      userEnteredValue: { numberValue: serial },
      userEnteredFormat: {
        numberFormat: { type: "DATE", pattern: "yyyy-mm-dd" },
      },
    };
  }

  if (typeof val === "number") {
    return { userEnteredValue: { numberValue: val } };
  } else if (typeof val === "boolean") {
    return { userEnteredValue: { boolValue: val } };
  } else if (typeof val === "string") {
    if (val.startsWith("=")) {
      return { userEnteredValue: { formulaValue: val } };
    }
    const num = parseFloat(val);
    if (!isNaN(num) && /^\d+(\.\d+)?$/.test(val)) {
      return { userEnteredValue: { numberValue: num } };
    }
    return { userEnteredValue: { stringValue: val } };
  } else {
    return { userEnteredValue: { stringValue: String(val) } };
  }
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
      id: `${invoiceData.invoicePrefix}${invoiceData.invoiceNumber}`,
      ...invoiceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let ledgerData: Omit<CustomerLedger, "ledger_id" | "date">;
    let ledgerData1: Omit<CustomerLedger, "ledger_id" | "date"> = {};

    if (invoice.markedAsPaid) {
      ledgerData = {
        customer_id: invoice.customerId,
        status: "paid",
        type: "Invoice",
        document_id: invoice.id,
        amount: -invoice.total,
      };
      ledgerData1 = {
        customer_id: invoice.customerId,
        status: "-",
        type: "Invoice",
        document_id: invoice.id,
        amount: invoice.total,
      };
    } else {
      ledgerData = {
        customer_id: invoice.customerId,
        status: "pending",
        type: "Invoice",
        document_id: invoice.id,
        amount: -invoice.total,
      };
    }

    const ledger: CustomerLedger = {
      ledger_id: `CUSTLED-${Date.now()}`,
      ...ledgerData,
      date: new Date().toISOString(),
    };

    const ledger1: CustomerLedger = {
      ledger_id: `CUSTLED-${Date.now()}`,
      ...ledgerData1,
      date: new Date().toISOString(),
    };

    const row = [
      "=ROW()",
      invoice.id,
      invoice.customerId || "",
      JSON.stringify(invoice.customer),
      invoice.invoiceDate,
      invoice.dueDate || "",
      invoice.subtotal || 0,
      invoice.taxAmount || 0,
      invoice.total || 0,
      invoice.status,
      JSON.stringify(invoice.items || []),
      invoice.paymentNotes || "",
      invoice.documentType,
      invoice.invoiceType,
      invoice.invoiceNumber,
      invoice.invoicePrefix,
      JSON.stringify(invoice.bankAccount),
      JSON.stringify(invoice.additionalCharges),
      JSON.stringify(invoice.paymentModes),
      JSON.stringify(invoice.globalDiscount),
      JSON.stringify(invoice.notes),
      JSON.stringify(invoice.tds),
      JSON.stringify(invoice.tdsUnderGst),
      JSON.stringify(invoice.tcs),
      invoice.extraDiscount,
      invoice.markedAsPaid,
      JSON.stringify(invoice.attachments),
      JSON.stringify(invoice.dispatchFromAddress),
      JSON.stringify(invoice.shipping),
      JSON.stringify(invoice.signature),
      invoice.reference,
      invoice.createdAt,
      invoice.updatedAt,
      ledger.ledger_id,
      invoice.pdfUrl || "",
    ];

    const ledger_row = [
      "=ROW()",
      ledger.ledger_id,
      ledger.customer_id,
      ledger.document_id || "",
      ledger.date,
      ledger.date.split("T")[0],
      ledger.date,
      ledger.status,
      ledger.type || "",
      "",
      null,
      "",
      ledger.amount,
    ];

    const ledger_row_paid = [
      "=ROW()",
      ledger1.ledger_id,
      ledger1.customer_id,
      ledger1.document_id || "",
      ledger1.date,
      ledger1.date.split("T")[0],
      ledger1.date,
      ledger1.status,
      ledger1.type || "",
      invoice?.paymentModes[0]?.paymentMethod || "",
      JSON.stringify(invoice.bankAccount),
      invoice?.paymentNotes || "",
      ledger1.amount,
    ];

    const sheetIds = await this.sheetsService.getSheetIdMap(this.spreadsheetId);

    const requests = [
      {
        appendCells: {
          sheetId: sheetIds["Invoices"],
          rows: [
            {
              values: row.map((val) => getUserEnteredValue(val)),
            },
          ],
          fields: "*",
        },
      },
      {
        appendCells: {
          sheetId: sheetIds["Customer_Ledgers"],
          rows: invoice.markedAsPaid
            ? [
                {
                  values: ledger_row.map((val) => getUserEnteredValue(val)),
                },
                {
                  values: ledger_row_paid.map((val) =>
                    getUserEnteredValue(val)
                  ),
                },
              ]
            : [
                {
                  values: ledger_row.map((val) => getUserEnteredValue(val)),
                },
              ],

          fields: "*",
        },
      },
    ];

    const batchUpdateRes = await this.sheetsService.batchUpdateSheet(
      this.spreadsheetId,
      requests
    );

    // await this.sheetsService.appendToSheet(this.spreadsheetId, "Invoices!A2", [
    //   row,
    // ]);

    // console.log(invoice.customer);

    return invoice;
  }

  safeParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  async getInvoices(): Promise<Invoice[]> {
    try {
      const data = await this.sheetsService.getSheetData(
        this.spreadsheetId,
        "ViewInvoices!A1:AH"
      );
      if (!data || data.length === 0) {
        return [];
      }

      return data
        .map((row) => ({
          rowId: row[0] || "",
          id: row[1] || "",
          customerId: row[2] || "",
          customer: this.safeParse(row[3]) || "",
          invoiceDate: row[4] || "",
          date: row[4] || "", // Keep for backward compatibility
          dueDate: row[5] || "",
          subtotal: parseFloat(row[6]) || 0,
          taxAmount: parseFloat(row[7]) || 0,
          total: parseFloat(row[8]) || 0,
          status: (row[9] as Invoice["status"]) || "Draft",
          items: this.safeParse(row[10]) || "",
          paymentNotes: row[11] || "",
          documentType: row[12] || "",
          invoiceType: row[13] || "",
          invoiceNumber: row[14] || "",
          invoicePrefix: row[15] || "",
          bankAccount: row[16] ? this.safeParse(row[16]) : null,
          additionalCharges: row[17] ? this.safeParse(row[17]) : null,
          paymentModes: row[18] ? this.safeParse(row[18]) : [],
          globalDiscount: row[19]
            ? this.safeParse(row[19])
            : {
                type: "percentage",
                value: 0,
              },
          notes: row[20] ? this.safeParse(row[20]) : {},
          tds: row[21]
            ? this.safeParse(row[21])
            : { enabled: false, rate: 0, amount: 0 },
          tdsUnderGst: row[22]
            ? this.safeParse(row[22])
            : {
                enabled: false,
                rate: 0,
                amount: 0,
              },
          tcs: row[23]
            ? this.safeParse(row[23])
            : { enabled: false, rate: 0, amount: 0 },
          extraDiscount: row[24] || 0,
          markedAsPaid: row[25] || false,
          attachments: row[26] ? this.safeParse(row[26]) : [],
          dispatchFromAddress: row[27] ? this.safeParse(row[27]) : null,
          shipping: row[28] ? this.safeParse(row[28]) : null,
          signature: row[29] ? this.safeParse(row[29]) : null,
          reference: row[30] || null,
          createdAt: row[31] || "",
          updatedAt: row[32] || "",
          ledger_id: row[33] || "",
          pdfUrl: row[34] || "",
        }))
        .filter((invoice) => invoice.id); // Filter out empty rows
    } catch (error) {
      console.error("Error getting invoices:", error);
      return []; // Return empty array instead of throwing
    }
  }

  async getInvoiceById(rowIndex: number): Promise<Invoice | null> {
    try {
      const range = `Invoices!A${rowIndex}:AH${rowIndex}`;
      const data = await this.sheetsService.getSheetData(
        this.spreadsheetId,
        range
      );

      if (!data || data.length === 0 || !data[0][1]) {
        return null;
      }

      const row = data[0]; // only one row fetched

      const invoice: Invoice = {
        rowId: row[0] || "",
        id: row[1] || "",
        customerId: row[2] || "",
        customer: JSON.parse(row[3]) || "",
        invoiceDate: row[4] || "",
        date: row[4] || "", // Keep for backward compatibility
        dueDate: row[5] || "",
        subtotal: parseFloat(row[6]) || 0,
        taxAmount: parseFloat(row[7]) || 0,
        total: parseFloat(row[8]) || 0,
        status: (row[9] as Invoice["status"]) || "Draft",
        items: JSON.parse(row[10]) || "",
        paymentNotes: row[11] || "",
        documentType: row[12] || "",
        invoiceType: row[13] || "",
        invoiceNumber: row[14] || "",
        invoicePrefix: row[15] || "",
        bankAccount: row[16] ? JSON.parse(row[16]) : null,
        additionalCharges: row[17] ? JSON.parse(row[17]) : null,
        paymentModes: row[18] ? JSON.parse(row[18]) : [],
        globalDiscount: row[19]
          ? JSON.parse(row[19])
          : {
              type: "percentage",
              value: 0,
            },
        notes: row[20] ? JSON.parse(row[20]) : {},
        tds: row[21]
          ? JSON.parse(row[21])
          : { enabled: false, rate: 0, amount: 0 },
        tdsUnderGst: row[22]
          ? JSON.parse(row[22])
          : {
              enabled: false,
              rate: 0,
              amount: 0,
            },
        tcs: row[23]
          ? JSON.parse(row[23])
          : { enabled: false, rate: 0, amount: 0 },
        extraDiscount: row[24] || 0,
        markedAsPaid: row[25] || false,
        attachments: row[26] ? JSON.parse(row[26]) : [],
        dispatchFromAddress: row[27] ? JSON.parse(row[27]) : null,
        shipping: row[28] ? JSON.parse(row[28]) : null,
        signature: row[29] ? JSON.parse(row[29]) : null,
        reference: row[30] || null,
        createdAt: row[31] || "",
        updatedAt: row[32] || "",
        ledger_id: row[33] || "",
        pdfUrl: row[34] || "",
      };

      return invoice;
    } catch (error) {
      console.error(`Error getting invoice at row ${rowIndex}:`, error);
      return null;
    }
  }

  async updateInvoice(
    invoiceId: string,
    updatedInvoice: Partial<Invoice>
  ): Promise<Invoice> {
    const invoice = {
      ...updatedInvoice,
      updatedAt: new Date().toISOString(),
    };

    const row = [
      "=ROW()",
      invoice.id,
      invoice.customerId || "",
      JSON.stringify(invoice.customer),
      invoice.invoiceDate,
      invoice.dueDate || "",
      invoice.subtotal || 0,
      invoice.taxAmount || 0,
      invoice.total || 0,
      invoice.status,
      JSON.stringify(invoice.items || []),
      invoice.paymentNotes || "",
      invoice.documentType,
      invoice.invoiceType,
      invoice.invoiceNumber,
      invoice.invoicePrefix,
      JSON.stringify(invoice.bankAccount),
      JSON.stringify(invoice.additionalCharges),
      JSON.stringify(invoice.paymentModes),
      JSON.stringify(invoice.globalDiscount),
      JSON.stringify(invoice.notes),
      JSON.stringify(invoice.tds),
      JSON.stringify(invoice.tdsUnderGst),
      JSON.stringify(invoice.tcs),
      invoice.extraDiscount,
      invoice.markedAsPaid,
      JSON.stringify(invoice.attachments),
      JSON.stringify(invoice.dispatchFromAddress),
      JSON.stringify(invoice.shipping),
      JSON.stringify(invoice.signature),
      invoice.reference,
      invoice.createdAt,
      invoice.updatedAt,
      invoice.ledger_id,
      invoice.pdfUrl || "",
    ];

    await this.sheetsService.updateSheetData(
      this.spreadsheetId,
      `Invoices!A${invoiceId}:AH${invoiceId}`,
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
      "=ROW()",
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      JSON.stringify(customer.companyDetails),
      JSON.stringify(customer.billingAddress),
      JSON.stringify(customer.shippingAddress),
      JSON.stringify(customer.other),
      ,
      customer.createdAt,
      customer.status,
    ];

    const openingBalance =
      customer?.balance != null
        ? customer?.accountType?.toLowerCase() === "credit"
          ? Number(customer.balance)
          : -Number(customer.balance)
        : null;

    const ledgerData: Omit<CustomerLedger, "ledger_id" | "date" | "balance"> = {
      customer_id: customer.id,
      type: "Opening Balance",
      status: "opening balance",
      amount: openingBalance,
    };

    const ledger: CustomerLedger = {
      ledger_id: `CUSTLED-${Date.now()}`,
      ...ledgerData,
      date: new Date().toISOString(),
    };

    const ledger_row = [
      "=ROW()",
      ledger.ledger_id,
      ledger.customer_id,
      ledger.document_id || "",
      ledger.date,
      ledger.date.split("T")[0],
      ledger.date,
      ledger.status,
      ledger.type || "",
      ,
      ,
      ,
      ledger.amount,
    ];

    const updateData = [
      {
        range: "Customers!A2",
        values: [row],
      },
      openingBalance &&
        openingBalance !== 0 && {
          range: "Customer_Ledgers!A2",
          values: [ledger_row],
        },
    ];

    const batchUpdateRes = await this.sheetsService.batchUpdateSheetData(
      this.spreadsheetId,
      updateData
    );

    return customer;
  }

  async getCustomers(): Promise<{
    statusInsights: Record<string, number>;
    customers: Customer[];
  }> {
    try {
      const data = await this.sheetsService.getSheetData(
        this.spreadsheetId,
        "ViewCustomers!A2:L"
      );
      if (!data || data.length === 0) {
        return { statusInsights: {}, customers: [] };
      }

      const statusObject = Object.fromEntries(data.slice(0, 2));

      const fetchedCustomers = data
        .slice(2)
        .map((row) => ({
          row_id: row[0] || "",
          id: row[1] || "",
          name: row[2] || "",
          email: row[3] || "",
          phone: row[4] || "",
          companyDetails: row[5] ? JSON.parse(row[5]) : null,
          billingAddress: row[6] ? JSON.parse(row[6]) : null,
          shippingAddress: row[7] ? JSON.parse(row[7]) : null,
          other: row[8] ? JSON.parse(row[8]) : null,
          balance: row[9] || 0,
          createdAt: row[10] || "",
          status: (row[11] as Customer["status"]) || "Active",
        }))
        .filter((customer) => customer.id); // Filter out empty rows

      return { statusInsights: statusObject, customers: fetchedCustomers };
    } catch (error) {
      console.error("Error getting customers:", error);
      return { statusInsights: {}, customers: [] };
    }
  }

  async updateCustomer(
    customerId: string,
    updates: Partial<Customer>
  ): Promise<Customer> {
    const customers = await this.getCustomers();
    const customerIndex = customers.customers.findIndex(
      (cust) => cust.id === customerId
    );

    if (customerIndex === -1) {
      throw new Error("Customer not found");
    }

    const updatedCustomer = {
      ...customers.customers[customerIndex],
      ...updates,
    };

    const row = [
      "=ROW()",
      updates.id,
      updates.name,
      updates.email,
      updates.phone,
      JSON.stringify(updates.companyDetails),
      JSON.stringify(updates.billingAddress),
      JSON.stringify(updates.shippingAddress),
      JSON.stringify(updates.other),
      ,
      updates.createdAt,
      updates.status,
    ];

    const rowNumber = updates?.row_id;
    await this.sheetsService.updateSheetData(
      this.spreadsheetId,
      `Customers!A${rowNumber}:L${rowNumber}`,
      [row]
    );

    return updatedCustomer;
  }

  async createCustomerLedger(
    ledgerData: Omit<CustomerLedger, "ledger_id" | "date" | "balance">
  ): Promise<null> {
    const ledger: CustomerLedger = {
      ledger_id: `CUSTLED-${Date.now()}`,
      ...ledgerData,
      date: new Date().toISOString(),
    };

    const row = [
      "=ROW()",
      ledger.ledger_id,
      ledger.customer_id,
      ledger.document_id || "",
      ledger.date,
      ledger.date.split("T")[0],
      ledger.date,
      ledger.status,
      ledger.type || "",
      ,
      ,
      ,
      ledger.amount,
    ];

    await this.sheetsService.appendToSheet(
      this.spreadsheetId,
      "Customer_Ledgers!A2",
      [row]
    );
    return null;
  }

  async getCustomerLedger(
    customerId: string,
    dateRange?: { from?: Date; to?: Date },
    orderType: "ASC" | "DESC" = "DESC",
    rowsPerPage = "20",
    page = "1",
    pendingOnly = false
  ): Promise<{ count: number; data: CustomerLedger[] }> {
    try {
      let dateFilter = "";

      if (dateRange?.from && dateRange?.to) {
        // Both dates
        const fromDate = dateRange.from.toLocaleDateString("en-CA");
        const toDate = dateRange.to.toLocaleDateString("en-CA");
        dateFilter = ` AND F >= date '${fromDate}' AND F <= date '${toDate}'`;
      } else if (dateRange?.from) {
        // Only from date
        const fromDate = dateRange.from.toLocaleDateString("en-CA");
        dateFilter = ` AND F = date '${fromDate}'`;
      } else if (dateRange?.to) {
        // Only to date
        const toDate = dateRange.to.toLocaleDateString("en-CA");
        dateFilter = ` AND F = date '${toDate}'`;
      }

      const query = `=QUERY(Customer_Ledgers!A2:N, "SELECT * WHERE C = '${customerId}'${dateFilter} ${
        pendingOnly ? "AND H = 'pending'" : ""
      } ORDER BY F ${orderType}, A ${orderType} LIMIT " & ${rowsPerPage} & " OFFSET " & ((${page} - 1) * ${rowsPerPage}), 0)`;

      const paginationQuery = `=QUERY(Customer_Ledgers!A2:N, "SELECT COUNT(A) WHERE C = '${customerId}'${dateFilter} ${
        pendingOnly ? "AND H = 'pending'" : ""
      }", 0)`;

      const updateData = [
        {
          range: "Customer_View_Ledgers!A1:J",
          values: [],
        },
        {
          range: "Customer_View_Ledgers!A3",
          values: [[query]],
        },
        {
          range: "Customer_View_Ledgers!A1",
          values: [[paginationQuery]],
        },
      ];

      const batchUpdateRes = await this.sheetsService.batchUpdateSheetData(
        this.spreadsheetId,
        updateData
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const data = await this.sheetsService.getSheetData(
        this.spreadsheetId,
        "Customer_View_Ledgers!A2:N"
      );
      if (!data || data.length === 0) {
        return { count: 0, data: [] };
      }

      const count = data[0][0] || 0;

      const queryData = data
        .slice(1)
        .map((row) => ({
          row_id: row[0] || "",
          ledger_id: row[1] || "",
          customer_id: row[2] || "",
          document_id: row[3] || "",
          date: row[4] || "",
          dateFormatted: row[5] || "",
          created_at: row[6] || "",
          status: row[7] || "",
          type: row[8] || "",
          paymentMode: row[9] || "",
          bank_account: row[10] ? JSON.parse(row[10]) : null,
          notes: row[11] || "",
          amount: row[12] || 0,
          balance: row[13] || 0,
        }))
        .filter((customer) => customer.customer_id); // Filter out empty rows

      return { count, data: queryData };
    } catch (error) {
      console.error("Error getting customer ledgers:", error);
      return { count: 0, data: [] }; // Return empty array instead of throwing
    }
  }

  async createTransaction(
    customer: Customer,
    amount: number,
    transactionType: "payIn" | "payOut",
    date: Date,
    paymentMode: string,
    bankAccount: any,
    notes: string
  ): Promise<boolean> {
    let ledgerData: Omit<CustomerLedger, "ledger_id" | "date">;

    ledgerData = {
      customer_id: customer.id,
      status: "paid",
      type: transactionType,
      document_id: "",
      amount: transactionType === "payOut" ? -amount : amount,
    };

    const ledger: CustomerLedger = {
      ledger_id: `CUSTLED-${Date.now()}`,
      ...ledgerData,
      date: new Date().toISOString(),
    };

    console.log(date);

    const ledger_row = [
      "=ROW()",
      ledger.ledger_id,
      ledger.customer_id,
      ledger.document_id || "",
      date.toISOString(),
      date.toLocaleDateString("en-CA"),
      ledger.date,
      ledger.status,
      ledger.type || "",
      paymentMode,
      bankAccount ? JSON.stringify(bankAccount) : "",
      notes || "",
      ledger.amount,
    ];

    // const sheetIds = await this.sheetsService.getSheetIdMap(this.spreadsheetId);

    // const requests = [
    //   {
    //     appendCells: {
    //       sheetId: sheetIds["Customer_Ledgers"],
    //       rows: [
    //         {
    //           values: ledger_row.map((val) => getUserEnteredValue(val)),
    //         },
    //       ],
    //       fields: "*",
    //     },
    //   },
    // ];

    // const batchUpdateRes = await this.sheetsService.batchUpdateSheet(
    //   this.spreadsheetId,
    //   requests
    // );

    await this.sheetsService.appendToSheet(
      this.spreadsheetId,
      "Customer_Ledgers!A2",
      [ledger_row]
    );

    return true;
  }

  async UpdateTransaction(
    date: Date,
    paymentMode: string,
    bankAccount: any,
    notes: string,
    customerLedger: CustomerLedger
  ): Promise<CustomerLedger> {
    console.log(date);

    const updated_ledger = {
      row_id: customerLedger.row_id,
      ledger_id: customerLedger.ledger_id,
      customer_id: customerLedger.customer_id,
      document_id: customerLedger.document_id,
      date: date.toISOString(),
      dateFormatted: date.toLocaleDateString("en-CA"),
      created_at: customerLedger.created_at,
      status: customerLedger.status,
      type: customerLedger.type,
      paymentMode: paymentMode,
      bank_account: bankAccount ? JSON.stringify(bankAccount) : "",
      notes: notes || "",
      amount: customerLedger.amount,
      balance: customerLedger.balance,
    };

    const ledger_row = [
      "=ROW()",
      customerLedger.ledger_id,
      customerLedger.customer_id,
      customerLedger.document_id || "",
      date.toISOString(),
      date.toLocaleDateString("en-CA"),
      customerLedger.created_at,
      customerLedger.status,
      customerLedger.type || "",
      paymentMode,
      bankAccount ? JSON.stringify(bankAccount) : "",
      notes || "",
      customerLedger.amount,
    ];

    await this.sheetsService.updateSheetData(
      this.spreadsheetId,
      `Customer_Ledgers!A${customerLedger.row_id}:M${customerLedger.row_id}`,
      [ledger_row]
    );

    return updated_ledger;
  }

  async deleteTransaction(rowId: number): Promise<boolean> {
    const sheetIds = await this.sheetsService.getSheetIdMap(this.spreadsheetId);

    await this.sheetsService.deleteRow(
      this.spreadsheetId,
      sheetIds["Customer_Ledgers"],
      rowId
    );

    return true;
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
