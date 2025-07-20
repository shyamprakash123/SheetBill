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
} from "../lib/backend-service";
import { googleSheetsSupabaseService } from "../lib/google-sheets-supabase";
import { supabaseGoogleAuth } from "../lib/supabase-google-auth";
import { useAuthStore } from "./auth";

interface InvoiceState {
  service: InvoiceService | null;
  invoices: Invoice[];
  customers: Customer[];
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
  customers: [],
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
      const customers = await service.getCustomers();
      set({ customers });
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
      const customer = await service.createCustomer(customerData);
      set((state) => ({ customers: [customer, ...state.customers] }));
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
        customers: state.customers.map((cust) =>
          cust.id === id ? updatedCustomer : cust
        ),
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
