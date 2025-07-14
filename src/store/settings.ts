import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompanyDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  pan: string;
  logo?: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string;
  department: string;
}

export interface GeneralSettings {
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
  fiscalYear: string;
}

export interface Preferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  autoSave: boolean;
  darkMode: boolean;
  compactView: boolean;
}

export interface ThermalPrintSettings {
  printerName: string;
  paperSize: string;
  printDensity: string;
  autocut: boolean;
  cashDrawer: boolean;
  headerText: string;
  footerText: string;
}

export interface Signatures {
  authorizedSignatory1: string;
  authorizedSignatory2: string;
  signature1?: string;
  signature2?: string;
  companyStamp?: string;
}

export interface NotesTerms {
  invoiceNotes: string;
  quotationNotes: string;
  paymentTerms: string;
  deliveryTerms: string;
  warrantyTerms: string;
}

export interface BankDetails {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  branchName: string;
  isDefault: boolean;
}

export interface SettingsState {
  companyDetails: CompanyDetails;
  userProfile: UserProfile;
  generalSettings: GeneralSettings;
  preferences: Preferences;
  thermalPrintSettings: ThermalPrintSettings;
  signatures: Signatures;
  notesTerms: NotesTerms;
  banks: BankDetails[];

  // Loading states
  loading: { [key: string]: boolean };
  errors: { [key: string]: string | null };

  // Actions
  updateCompanyDetails: (details: Partial<CompanyDetails>) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  updatePreferences: (preferences: Partial<Preferences>) => void;
  updateThermalPrintSettings: (settings: Partial<ThermalPrintSettings>) => void;
  updateSignatures: (signatures: Partial<Signatures>) => void;
  updateNotesTerms: (notesTerms: Partial<NotesTerms>) => void;
  addBank: (bank: Omit<BankDetails, "id">) => void;
  updateBank: (id: string, bank: Partial<BankDetails>) => void;
  removeBank: (id: string) => void;
  setLoading: (section: string, loading: boolean) => void;
  setError: (section: string, error: string | null) => void;
  resetSection: (section: string) => void;
}

const defaultCompanyDetails: CompanyDetails = {
  name: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  phone: "",
  email: "",
  website: "",
  gstin: "",
  pan: "",
};

const defaultUserProfile: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  department: "",
};

const defaultGeneralSettings: GeneralSettings = {
  timezone: "Asia/Kolkata",
  dateFormat: "DD/MM/YYYY",
  currency: "INR",
  language: "en",
  fiscalYear: "April-March",
};

const defaultPreferences: Preferences = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  autoSave: true,
  darkMode: false,
  compactView: false,
};

const defaultThermalPrintSettings: ThermalPrintSettings = {
  printerName: "",
  paperSize: "80mm",
  printDensity: "Medium",
  autocut: true,
  cashDrawer: false,
  headerText: "",
  footerText: "",
};

const defaultSignatures: Signatures = {
  authorizedSignatory1: "",
  authorizedSignatory2: "",
};

const defaultNotesTerms: NotesTerms = {
  invoiceNotes: "",
  quotationNotes: "",
  paymentTerms: "",
  deliveryTerms: "",
  warrantyTerms: "",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      companyDetails: defaultCompanyDetails,
      userProfile: defaultUserProfile,
      generalSettings: defaultGeneralSettings,
      preferences: defaultPreferences,
      thermalPrintSettings: defaultThermalPrintSettings,
      signatures: defaultSignatures,
      notesTerms: defaultNotesTerms,
      banks: [],
      loading: {},
      errors: {},

      updateCompanyDetails: (details) =>
        set((state) => ({
          companyDetails: { ...state.companyDetails, ...details },
        })),

      updateUserProfile: (profile) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...profile },
        })),

      updateGeneralSettings: (settings) =>
        set((state) => ({
          generalSettings: { ...state.generalSettings, ...settings },
        })),

      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),

      updateThermalPrintSettings: (settings) =>
        set((state) => ({
          thermalPrintSettings: { ...state.thermalPrintSettings, ...settings },
        })),

      updateSignatures: (signatures) =>
        set((state) => ({
          signatures: { ...state.signatures, ...signatures },
        })),

      updateNotesTerms: (notesTerms) =>
        set((state) => ({
          notesTerms: { ...state.notesTerms, ...notesTerms },
        })),

      addBank: (bank) =>
        set((state) => ({
          banks: [...state.banks, { ...bank, id: Date.now().toString() }],
        })),

      updateBank: (id, bank) =>
        set((state) => ({
          banks: state.banks.map((b) => (b.id === id ? { ...b, ...bank } : b)),
        })),

      removeBank: (id) =>
        set((state) => ({
          banks: state.banks.filter((b) => b.id !== id),
        })),

      setLoading: (section, loading) =>
        set((state) => ({
          loading: { ...state.loading, [section]: loading },
        })),

      setError: (section, error) =>
        set((state) => ({
          errors: { ...state.errors, [section]: error },
        })),

      resetSection: (section) => {
        const defaults = {
          companyDetails: defaultCompanyDetails,
          userProfile: defaultUserProfile,
          generalSettings: defaultGeneralSettings,
          preferences: defaultPreferences,
          thermalPrintSettings: defaultThermalPrintSettings,
          signatures: defaultSignatures,
          notesTerms: defaultNotesTerms,
        };

        if (defaults[section as keyof typeof defaults]) {
          set((state) => ({
            [section]: defaults[section as keyof typeof defaults],
          }));
        }
      },
    }),
    {
      name: "settings-storage",
    }
  )
);
