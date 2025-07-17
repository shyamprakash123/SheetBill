export type DocumentType = 
  | 'sales-invoice'
  | 'credit-note'
  | 'debit-note'
  | 'purchase'
  | 'quotation'
  | 'sales-return'
  | 'purchase-return'
  | 'purchase-order'
  | 'delivery-challan'
  | 'proforma-invoice';

export type InvoiceType = 'regular' | 'bill-of-supply';

export interface Address {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: Address;
  gstin?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: Address;
  gstin?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  price: number;
  taxRate: number;
  hsnCode?: string;
}

export interface InvoiceItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: {
    type: 'percentage' | 'amount';
    value: number;
  };
  taxAmount: number;
  total: number;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
}

export interface Signature {
  id: string;
  name: string;
  imageUrl: string;
}

export interface InvoiceFormData {
  documentType: DocumentType;
  invoiceType: InvoiceType;
  invoiceNumber: string;
  invoicePrefix: string;
  dispatchFromAddress?: Address;
  customer?: Customer;
  vendor?: Vendor;
  invoiceDate: string;
  dueDate?: string;
  supplierInvoiceDate?: string;
  supplierInvoiceNumber?: string;
  reference?: string;
  items: InvoiceItem[];
  globalDiscount: {
    type: 'percentage' | 'amount';
    value: number;
  };
  additionalCharges: Array<{
    id: string;
    name: string;
    amount: number;
  }>;
  notes: string;
  tds: {
    enabled: boolean;
    rate: number;
    amount: number;
  };
  tdsUnderGst: {
    enabled: boolean;
    rate: number;
    amount: number;
  };
  tcs: {
    enabled: boolean;
    rate: number;
    amount: number;
  };
  extraDiscount: number;
  roundOff: boolean;
  bankAccount?: BankAccount;
  markedAsPaid: boolean;
  paymentNotes?: string;
  signature?: Signature;
  attachments: File[];
}

export interface InvoiceFormProps {
  documentType: DocumentType;
  defaultValues?: Partial<InvoiceFormData>;
  addresses?: Address[];
  customers?: Customer[];
  vendors?: Vendor[];
  products?: Product[];
  bankAccounts?: BankAccount[];
  signatures?: Signature[];
  noteTemplates?: string[];
  onChange?: (data: InvoiceFormData) => void;
  onSubmit?: (data: InvoiceFormData, action: 'draft' | 'save' | 'save-print') => void;
  onAddCustomer?: () => void;
  onAddVendor?: () => void;
  onAddProduct?: () => void;
  onAddAddress?: () => void;
  onAddBankAccount?: () => void;
  onAddSignature?: () => void;
}