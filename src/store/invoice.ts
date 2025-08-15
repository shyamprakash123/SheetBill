import { create } from "zustand";
import {
  InvoiceService,
  Invoice,
  Customer,
  Product,
  Settings,
  CompanyDetails,
  UserProfile,
  Preferences,
  ThermalPrintSettings,
  SignatureSettings,
  NotesAndTerms,
  BankDetails,
  CustomerLedger,
} from "../lib/backend-service";
import { googleSheetsSupabaseService } from "../lib/google-sheets-supabase";
import { supabaseGoogleAuth } from "../lib/supabase-google-auth";
import { useAuthStore } from "./auth";

interface InvoiceState {
  service: InvoiceService | null;
  invoices: Invoice[];
  customers: { statusInsights: Record<string, number>; data: Customer[] };
  vendors: { statusInsights: Record<string, number>; data: Customer[] };
  customer_ledgers: CustomerLedger[];
  products: Product[];
  settings: Settings;
  loading: boolean;
  error: string | null;

  // Actions
  initializeService: () => Promise<void>;

  // Invoice operations
  fetchInvoices: () => Promise<void>;
  createInvoice: (
    invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">
  ) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoiceById: (id: string) => Promise<Invoice | null>;

  // Customer operations
  fetchCustomers: () => Promise<void>;
  createCustomer: (
    customer: Omit<Customer, "id" | "createdAt">
  ) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<Customer>;
  fetchCustomerLedger: (
    customer_id: string,
    dateRange?: { from?: Date; to?: Date },
    orderType?: "ASC" | "DESC",
    rowsPerPage?: string,
    currentPage?: string,
    pendingOnly?: boolean
  ) => Promise<{ count: number; data: CustomerLedger[] }>;
  createCustomerTransaction: (
    customer: Customer,
    amount: number,
    transactionType: "payIn" | "payOut",
    date: Date,
    paymentMode: string,
    bankAccount: any,
    notes: string
  ) => Promise<boolean>;
  updateCustomerTransaction: (
    date: Date,
    paymentMode: string,
    bankAccount: any,
    notes: string,
    customerLedger: CustomerLedger
  ) => Promise<CustomerLedger>;
  deleteCustomerTransaction: (rowId: number) => Promise<boolean>;

  // Vendor operations
  fetchVendors: () => Promise<void>;
  createVendor: (
    vendor: Omit<Customer, "id" | "createdAt">
  ) => Promise<Customer>;
  updateVendor: (id: string, updates: Partial<Customer>) => Promise<Customer>;
  fetchVendorLedger: (
    vendor_id: string,
    dateRange?: { from?: Date; to?: Date },
    orderType?: "ASC" | "DESC",
    rowsPerPage?: string,
    currentPage?: string,
    pendingOnly?: boolean
  ) => Promise<{ count: number; data: CustomerLedger[] }>;
  createVendorTransaction: (
    vendor: Customer,
    amount: number,
    transactionType: "payIn" | "payOut",
    date: Date,
    paymentMode: string,
    bankAccount: any,
    notes: string
  ) => Promise<boolean>;
  updateVendorTransaction: (
    date: Date,
    paymentMode: string,
    bankAccount: any,
    notes: string,
    vendorLedger: CustomerLedger
  ) => Promise<CustomerLedger>;
  deleteVendorTransaction: (rowId: number) => Promise<boolean>;

  // Product operations
  fetchProducts: () => Promise<void>;
  createProduct: (
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;

  // Settings operations
  updateCompanyDetails: (details: Partial<CompanyDetails>) => Promise<boolean>;
  fetchAllSettings: () => Promise<Settings>;
  // updateUserProfile: (profile: Partial<UserProfile>) => void;
  updatePreferences: (preferences: Partial<Preferences>) => void;
  // updateThermalPrintSettings: (settings: Partial<ThermalPrintSettings>) => void;
  updateSignatures: (signatures: Partial<SignatureSettings>) => void;
  updateNotesTerms: (notesTerms: Partial<NotesAndTerms>) => void;
  // addBank: (bank: Omit<BankDetails, "id">) => void;
  updateBank: (bank: Partial<BankDetails>) => void;
  // removeBank: (id: string) => void;
  // setLoading: (section: string, loading: boolean) => void;
  // setError: (section: string, error: string | null) => void;
  // resetSection: (section: string) => void;

  // Search operations
  searchInvoices: (query: string) => Promise<Invoice[]>;
  searchCustomers: (query: string) => Promise<Customer[]>;
  searchProducts: (query: string) => Promise<Product[]>;

  // Analytics
  getInvoiceStats: () => Promise<any>;

  clearError: () => void;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  service: null,
  invoices: [],
  customers: { statusInsights: {}, data: [] },
  vendors: { statusInsights: {}, data: [] },
  products: [],
  settings: {
    companyDetails: {},
    userProfile: {},
    preferences: {},
    thermalPrintSettings: {},
    signatures: {},
    notesTerms: [],
    banks: [],
  },
  loading: false,
  error: null,

  initializeService: async () => {
    const { profile, getGoogleTokens } = useAuthStore.getState();

    const tokens = await getGoogleTokens();
    // const tokens = profile.google_tokens;

    if (!tokens || !tokens.access_token) {
      throw new Error("Google account not connected");
    }

    // If no spreadsheet ID, create one
    if (!profile.google_sheet_id) {
      try {
        const spreadsheetId =
          await googleSheetsSupabaseService.createUserSpreadsheet(
            profile.email
          );

        // Update profile with new spreadsheet ID
        const { updateProfile } = useAuthStore.getState();
        await updateProfile({ google_sheet_id: spreadsheetId });

        // Update local profile reference
        profile.google_sheet_id = spreadsheetId;
      } catch (error) {
        console.error("Error creating spreadsheet:", error);
        set({
          error:
            "Failed to create spreadsheet. You can still use the app with limited functionality.",
        });
        return; // Don't throw, allow app to continue
      }
    }

    try {
      // Create service instance
      const service = new InvoiceService("", profile.google_sheet_id); // Access token handled by supabase service
      set({ service });

      // Fetch initial data with error handling
      try {
        await Promise.all([
          get().fetchInvoices(),
          get().fetchCustomers(),
          get().fetchVendors(),
          get().fetchProducts(),
        ]);
      } catch (dataError) {
        console.warn("Error fetching initial data:", dataError);
        // Don't throw, service is still usable
      }
    } catch (error) {
      console.error("Error initializing invoice service:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize service",
      });
      // Don't throw, allow app to continue with limited functionality
    }
  },

  fetchInvoices: async () => {
    const { service } = get();
    if (!service) return;

    set({ loading: true, error: null });
    try {
      const invoices = await service.getInvoices();
      set({ invoices });
    } catch (error) {
      console.error("Error fetching invoices:", error);
      set({ error: "Failed to fetch invoices" });
    } finally {
      set({ loading: false });
    }
  },

  createInvoice: async (invoiceData) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });
    try {
      const invoice = await service.createInvoice(invoiceData);
      set((state) => ({ invoices: [invoice, ...state.invoices] }));
      return invoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      set({ error: "Failed to create invoice" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateInvoice: async (id, updates) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });
    try {
      const updatedInvoice = await service.updateInvoice(id, updates);
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? updatedInvoice : inv
        ),
      }));
      return updatedInvoice;
    } catch (error) {
      console.error("Error updating invoice:", error);
      set({ error: "Failed to update invoice" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteInvoice: async (id) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });
    try {
      await service.deleteInvoice(id);
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting invoice:", error);
      set({ error: "Failed to delete invoice" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getInvoiceById: async (id) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    try {
      return await service.getInvoiceById(id);
    } catch (error) {
      console.error("Error getting invoice:", error);
      throw error;
    }
  },

  fetchCustomers: async () => {
    const { service } = get();
    if (!service) return;

    set({ loading: true, error: null });
    try {
      const { statusInsights, customers } = await service.getCustomers();
      set({ customers: { statusInsights, data: customers } });
    } catch (error) {
      console.error("Error fetching customers:", error);
      set({ error: "Failed to fetch customers" });
    } finally {
      set({ loading: false });
    }
  },

  createCustomer: async (customerData) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });
    try {
      const { customer, openingBalance } = await service.createCustomer(
        customerData
      );

      const initialBalance = openingBalance || 0;
      const updatedCustomer = {
        ...customer,
        balance: initialBalance,
      };

      set((state) => {
        const updatedData = [updatedCustomer, ...state.customers.data];

        const credit = updatedData
          .filter((cust) => cust.balance > 0)
          .reduce((sum, cust) => sum + Math.abs(cust.balance), 0);

        const debit = updatedData
          .filter((cust) => cust.balance < 0)
          .reduce((sum, cust) => sum + cust.balance, 0);

        return {
          customers: {
            ...state.customers,
            data: updatedData,
            statusInsights: {
              credit,
              debit,
            },
          },
        };
      });

      return customer;
    } catch (error) {
      console.error("Error creating customer:", error);
      set({ error: "Failed to create customer" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateCustomer: async (id, updates) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });
    try {
      const updatedCustomer = await service.updateCustomer(id, updates);
      set((state) => ({
        ...state,
        customers: {
          ...state.customers,
          data: state.customers.data.map((cust) =>
            cust.id === id ? updatedCustomer : cust
          ),
        },
      }));
      return updatedCustomer;
    } catch (error) {
      console.error("Error updating customer:", error);
      set({ error: "Failed to update customer" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchCustomerLedger: async (
    customerId: string,
    dateRange?: { from?: Date; to?: Date },
    orderType: "ASC" | "DESC" = "DESC",
    rowsPerPage = "20",
    page = "1",
    pendingOnly = false
  ) => {
    const { service } = get();
    if (!service) return;

    set({ loading: true, error: null });
    try {
      const { count, data } = await service.getCustomerLedger(
        customerId,
        dateRange,
        orderType,
        rowsPerPage,
        page,
        pendingOnly
      );
      return { count, data };
      // set({ customers });
    } catch (error) {
      console.error("Error fetching customer ledgers:", error);
      set({ error: "Failed to fetch customer ledgers" });
    } finally {
      set({ loading: false });
    }
  },

  createCustomerTransaction: async (
    customer: Customer,
    amount: number,
    transactionType: "payIn" | "payOut",
    date: Date,
    paymentMode: string,
    bankAccount: any,
    notes: string
  ) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });
    try {
      const success = await service.createCustomerTransaction(
        customer,
        amount,
        transactionType,
        date,
        paymentMode,
        bankAccount,
        notes
      );
      set((state) => {
        const updatedData = state.customers.data.map((cust) =>
          cust.id === customer.id
            ? {
                ...cust,
                balance:
                  transactionType === "payIn"
                    ? cust.balance + amount
                    : cust.balance - amount,
              }
            : cust
        );

        const credit = updatedData
          .filter((cust) => cust.balance > 0)
          .reduce((sum, cust) => sum + Math.abs(cust.balance), 0);

        const debit = updatedData
          .filter((cust) => cust.balance < 0)
          .reduce((sum, cust) => sum + cust.balance, 0);

        return {
          customers: {
            ...state.customers,
            data: updatedData,
            statusInsights: {
              credit,
              debit,
            },
          },
        };
      });

      return success;
    } catch (error) {
      console.error("Error creating transaction:", error);
      set({ error: "Failed to create transaction" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateCustomerTransaction: async (
    date: Date,
    paymentMode: string,
    bankAccount: any,
    notes: string,
    customerLedger: CustomerLedger
  ) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });
    try {
      const updatedLedger = await service.UpdateCustomerTransaction(
        date,
        paymentMode,
        bankAccount,
        notes,
        customerLedger
      );

      return updatedLedger;
    } catch (error) {
      console.error("Error creating transaction:", error);
      set({ error: "Failed to create transaction" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteCustomerTransaction: async (rowId) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");
    set({ loading: true, error: null });
    try {
      const success = await service.deleteCustomerTransaction(rowId);
      return success;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      set({ error: "Failed to delete transaction" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  fetchVendors: async () => {
    const { service } = get();
    if (!service) return;

    set({ loading: true, error: null });
    try {
      const { statusInsights, vendors } = await service.getVendors();
      set({ vendors: { statusInsights, data: vendors } });
    } catch (error) {
      console.error("Error fetching vendors:", error);
      set({ error: "Failed to fetch vendors" });
    } finally {
      set({ loading: false });
    }
  },

  createVendor: async (vendorData) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });
    try {
      const { vendor, openingBalance } = await service.createVendor(vendorData);

      const initialBalance = openingBalance || 0;
      const updatedVendor = {
        ...vendor,
        balance: initialBalance,
      };

      set((state) => {
        const updatedData = [updatedVendor, ...state.vendors.data];

        const credit = updatedData
          .filter((vendor) => vendor.balance > 0)
          .reduce((sum, vendor) => sum + Math.abs(vendor.balance), 0);

        const debit = updatedData
          .filter((vendor) => vendor.balance < 0)
          .reduce((sum, vendor) => sum + vendor.balance, 0);

        return {
          vendors: {
            ...state.vendors,
            data: updatedData,
            statusInsights: {
              credit,
              debit,
            },
          },
        };
      });

      return vendor;
    } catch (error) {
      console.error("Error creating vendor:", error);
      set({ error: "Failed to create vendor" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateVendor: async (id, updates) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });
    try {
      const updatedVendor = await service.updateVendor(id, updates);
      set((state) => ({
        ...state,
        vendors: {
          ...state.vendors,
          data: state.vendors.data.map((vend) =>
            vend.id === id ? updatedVendor : vend
          ),
        },
      }));
      return updatedVendor;
    } catch (error) {
      console.error("Error updating vendor:", error);
      set({ error: "Failed to update vendor" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchVendorLedger: async (
    vendorId: string,
    dateRange?: { from?: Date; to?: Date },
    orderType: "ASC" | "DESC" = "DESC",
    rowsPerPage = "20",
    page = "1",
    pendingOnly = false
  ) => {
    const { service } = get();
    if (!service) return;

    set({ loading: true, error: null });
    try {
      const { count, data } = await service.getVendorLedger(
        vendorId,
        dateRange,
        orderType,
        rowsPerPage,
        page,
        pendingOnly
      );
      return { count, data };
    } catch (error) {
      console.error("Error fetching vendor ledgers:", error);
      set({ error: "Failed to fetch vendor ledgers" });
    } finally {
      set({ loading: false });
    }
  },

  createVendorTransaction: async (
    vendor: Customer,
    amount: number,
    transactionType: "payIn" | "payOut",
    date: Date,
    paymentMode: string,
    bankAccount: any,
    notes: string
  ) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });
    try {
      const success = await service.createVendorTransaction(
        vendor,
        amount,
        transactionType,
        date,
        paymentMode,
        bankAccount,
        notes
      );
      set((state) => {
        const updatedData = state.vendors.data.map((vend) =>
          vend.id === vendor.id
            ? {
                ...vend,
                balance:
                  transactionType === "payIn"
                    ? vend.balance + amount
                    : vend.balance - amount,
              }
            : vend
        );

        const credit = updatedData
          .filter((vend) => vend.balance > 0)
          .reduce((sum, vend) => sum + Math.abs(vend.balance), 0);

        const debit = updatedData
          .filter((vend) => vend.balance < 0)
          .reduce((sum, vend) => sum + vend.balance, 0);

        return {
          vendors: {
            ...state.vendors,
            data: updatedData,
            statusInsights: {
              credit,
              debit,
            },
          },
        };
      });

      return success;
    } catch (error) {
      console.error("Error creating transaction:", error);
      set({ error: "Failed to create transaction" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateVendorTransaction: async (
    date: Date,
    paymentMode: string,
    bankAccount: any,
    notes: string,
    vendorLedger: CustomerLedger
  ) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });
    try {
      const updatedLedger = await service.UpdateVendorTransaction(
        date,
        paymentMode,
        bankAccount,
        notes,
        vendorLedger
      );

      return updatedLedger;
    } catch (error) {
      console.error("Error creating transaction:", error);
      set({ error: "Failed to create transaction" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteVendorTransaction: async (rowId) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");
    set({ loading: true, error: null });
    try {
      const success = await service.deleteVendorTransaction(rowId);
      return success;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      set({ error: "Failed to delete transaction" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  fetchProducts: async () => {
    const { service } = get();
    if (!service) return;

    set({ loading: true, error: null });
    try {
      const products = await service.getProducts();
      set({ products });
    } catch (error) {
      console.error("Error fetching products:", error);
      set({ error: "Failed to fetch products" });
    } finally {
      set({ loading: false });
    }
  },

  createProduct: async (productData) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });
    try {
      const product = await service.createProduct(productData);
      set((state) => ({ products: [product, ...state.products] }));
      return product;
    } catch (error) {
      console.error("Error creating product:", error);
      set({ error: "Failed to create product" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateProduct: async (id, updates) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });
    try {
      const updatedProduct = await service.updateProduct(id, updates);
      set((state) => ({
        products: state.products.map((prod) =>
          prod.id === id ? updatedProduct : prod
        ),
      }));
      return updatedProduct;
    } catch (error) {
      console.error("Error updating product:", error);
      set({ error: "Failed to update product" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateCompanyDetails: async (details) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });

    try {
      await service.updateSection("companyDetails", details);
      set((state) => ({
        settings: {
          ...state.settings,
          companyDetails: {
            ...state.settings.companyDetails,
            ...details,
          },
        },
      }));
    } catch (error) {
      console.error("Error updating product:", error);
      set({ error: "Failed to update product" });
      throw error;
    } finally {
      set({ loading: false });
      return true;
    }
  },

  fetchAllSettings: async () => {
    const { service } = get();

    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });

    try {
      const settings = await service.getAllSettings();
      set((state) => ({
        settings: {
          ...state.settings,
          ...settings,
        },
      }));
      return settings;
    } catch (error) {
      console.error("Error fetching settings:", error);
      set({ error: "Failed to fetch settings" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePreferences: async (details) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });

    try {
      await service.updateSection("preferences", details);
      set((state) => ({
        settings: {
          ...state.settings,
          preferences: {
            ...state.settings.preferences,
            ...details,
          },
        },
      }));
    } catch (error) {
      console.error("Error updating preferences:", error);
      set({ error: "Failed to update preferrences" });
      throw error;
    } finally {
      set({ loading: false });
      return true;
    }
  },

  updateSignatures: async (details) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });

    try {
      await service.updateSection("signatures", details);
      set((state) => ({
        settings: {
          ...state.settings,
          signatures: {
            ...state.settings.signatures,
            ...details,
          },
        },
      }));
    } catch (error) {
      console.error("Error updating sigatures:", error);
      set({ error: "Failed to update signatures" });
      throw error;
    } finally {
      set({ loading: false });
      return true;
    }
  },

  updateNotesTerms: async (details) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });

    try {
      await service.updateSection("notesTerms", details);
      set((state) => ({
        settings: {
          ...state.settings,
          notesTerms: {
            ...state.settings.notesTerms,
            ...details,
          },
        },
      }));
    } catch (error) {
      console.error("Error updating NotesTerms:", error);
      set({ error: "Failed to update NotesTerms" });
      throw error;
    } finally {
      set({ loading: false });
      return true;
    }
  },

  updateBank: async (details) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    set({ loading: true, error: null });

    try {
      await service.updateSection("banks", details);
      set((state) => ({
        settings: {
          ...state.settings,
          banks: {
            ...state.settings.banks,
            ...details,
          },
        },
      }));
    } catch (error) {
      console.error("Error updating NotesTerms:", error);
      set({ error: "Failed to update NotesTerms" });
      throw error;
    } finally {
      set({ loading: false });
      return true;
    }
  },

  searchInvoices: async (query) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    try {
      return await service.searchInvoices(query);
    } catch (error) {
      console.error("Error searching invoices:", error);
      throw error;
    }
  },

  searchCustomers: async (query) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    try {
      return await service.searchCustomers(query);
    } catch (error) {
      console.error("Error searching customers:", error);
      throw error;
    }
  },

  searchProducts: async (query) => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    try {
      return await service.searchProducts(query);
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  },

  getInvoiceStats: async () => {
    const { service } = get();
    if (!service) throw new Error("Service not initialized");

    try {
      return await service.getInvoiceStats();
    } catch (error) {
      console.error("Error getting invoice stats:", error);
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
