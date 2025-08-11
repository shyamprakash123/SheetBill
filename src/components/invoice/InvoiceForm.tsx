import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, number } from "framer-motion";
import {
  CalendarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  DocumentIcon,
  BanknotesIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  XMarkIcon,
  PaperClipIcon,
  PrinterIcon,
  DocumentDuplicateIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  InvoiceFormProps,
  InvoiceFormData,
  InvoiceItem,
  DocumentType,
  BankAccount,
  Signature,
  Product,
} from "../../types/invoice";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import SearchableDropdown from "../ui/SearchableDropdown";
// import DatePicker from "../ui/DatePicker";
import ProductSearch from "./ProductSearch";
import ItemTable from "./ItemTable";
import NotesSection from "./NotesSection";
import SummarySection from "./SummarySection";
import PaymentSection from "./PaymentSection";
import AttachmentSection from "./AttachmentSection";
import { useAuthStore } from "../../store/auth";
import { useInvoiceStore } from "../../store/invoice";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { ChevronDown, Truck } from "lucide-react";
import {
  BankDetails,
  CompanyDetails,
  Customer,
} from "../../lib/backend-service";
import DatePicker from "../ui/DatePicker";
import toast from "react-hot-toast";

const documentTypeLabels: Record<DocumentType, string> = {
  "sales-invoice": "Sales Invoice",
  "credit-note": "Credit Note",
  "debit-note": "Debit Note",
  purchase: "Purchase Invoice",
  quotation: "Quotation",
  "sales-return": "Sales Return",
  "purchase-return": "Purchase Return",
  "purchase-order": "Purchase Order",
  "delivery-challan": "Delivery Challan",
  "proforma-invoice": "Proforma Invoice",
};

const documentNotesType: Record<DocumentType, string> = {
  "sales-invoice": "invoice_notes",
  "credit-note": "Credit Note",
  "debit-note": "Debit Note",
  purchase: "purchase_notes",
  quotation: "quotation_notes",
  "sales-return": "sales_return_notes",
  "purchase-return": "purchase_return_notes",
  "purchase-order": "purchase_order_notes",
  "delivery-challan": "delivery_notes",
  "proforma-invoice": "proforma_notes",
};

const documentPrefixType: Record<DocumentType, string> = {
  "sales-invoice": "invoice_prefix",
  "credit-note": "credit_prefix",
  "debit-note": "Debit Note",
  purchase: "purchase_prefix",
  quotation: "quotations_prefix",
  "sales-return": "Sales Return",
  "purchase-return": "Purchase Return",
  "purchase-order": "Purchase Order",
  "delivery-challan": "Delivery Challan",
  "proforma-invoice": "Proforma Invoice",
};

const customerBasedTypes: DocumentType[] = [
  "sales-invoice",
  "credit-note",
  "proforma-invoice",
  "quotation",
  "sales-return",
  "delivery-challan",
];

const vendorBasedTypes: DocumentType[] = [
  "purchase",
  "debit-note",
  "purchase-order",
  "purchase-return",
];

const documentTypes: DocumentType[] = [
  "sales-invoice",
  "credit-note",
  "debit-note",
  "purchase",
  "quotation",
  "sales-return",
  "purchase-return",
  "purchase-order",
  "delivery-challan",
  "proforma-invoice",
];

function getFullShippingAddress(details: CompanyDetails[]): string {
  const parts = [
    details.shipping_address?.trim(),
    details.shipping_city?.trim(),
    details.shipping_state?.trim(),
    details.shipping_pincode,
    details.shipping_country?.trim(),
  ];

  // Filter out empty values and join with commas
  const address = parts.filter(Boolean).join(", ");

  return [
    {
      value: address,
      id: "addr",
    },
  ];
}

function formatCustomerList(customers: Customer[]): string {
  return customers.map((customer, index) => {
    const { id, name, companyDetails, phone, email, ...other } = customer;

    return {
      value: `${name}`,
      description: `${
        companyDetails.gstin ? `GSTIN: ${companyDetails.gstin}` : null
      }`,
      gstin: companyDetails.gstin,
      phone,
      email,
      id: id,
      balance: formatCurrency(other?.account?.balance),
      other,
    };
  });
}

function formatBanksList(banks: BankDetails[]): string {
  const parsedBanks = JSON.parse(banks.banks);
  const mappedBanks = parsedBanks.map((bank, index) => {
    const { bank_name, bank_accountNumber, ...others } = bank;
    return { value: `${bank_name}`, id: bank_accountNumber, others };
  });
  return [...mappedBanks, { value: "Cash", id: "cash" }];
}

function formatCustomerAddress(
  selectedCustomer: Partial<Customer>,
  customers: Partial<Customer>[]
): string {
  if (selectedCustomer) {
    return customers.map((customer, index) => {
      if (customer.id === selectedCustomer.id) {
        const { id, line1, line2, city, state } = customer?.shippingAddress;
        return {
          value: `${line1} , ${line2} \n ${city} \n ${JSON.parse(state).name}`,
          id: 1,
        };
      } else {
        return null;
      }
    });
  } else {
    return null;
  }
}

function getCustomerShippingAddress(
  selectedCustomer: Partial<Customer>,
  customers: Partial<Customer>[]
): string | null {
  if (!selectedCustomer?.id) return null;

  const customer = customers.find((c) => c.id === selectedCustomer.id);

  if (!customer) return null;

  const { id, line1, line2, city, state } = customer?.shippingAddress;
  return {
    value: `${line1} , ${line2} \n ${city} \n ${JSON.parse(state).name}`,
    id: 1,
  };
}

const formatCurrency = (amount) => {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  });

  // Get an array of the formatted parts (e.g., [{type: 'currency', value: '₹'}, {type: 'integer', value: '50,000'}])
  const parts = formatter.formatToParts(amount || 0);

  // Find the currency symbol and add a space, then join the parts back together
  return parts
    .map((part) => {
      if (part.type === "currency") {
        return `${part.value} `; // Add the space here
      }
      return part.value;
    })
    .join("");
};

function formatProductsList(products: Product[]): string {
  return products.map((product, index) => {
    const {
      id,
      name,
      description,
      price,
      taxRate,
      unit,
      category,
      hsnCode,
      stock,
    } = product;

    return {
      value: `${name}`,
      id: id,
      price: price,
      unit: unit,
      category: category,
      hsnCode: hsnCode,
      stock: stock,
      taxRate: taxRate,
    };
  });
}

export default function InvoiceForm() {
  const navigate = useNavigate();

  const { invoice_type } = useParams<{ invoice_type: DocumentType }>();
  const documentType = invoice_type;

  const {
    customers,
    products,
    createInvoice,
    updateInvoice,
    fetchCustomers,
    fetchProducts,
    loading,
    settings,
    updateCompanyDetails,
    fetchAllSettings,
  } = useInvoiceStore();

  const [formData, setFormData] = useState<InvoiceFormData>({
    documentType: "sales-invoice",
    invoiceType: "regular",
    invoiceNumber: "",
    invoicePrefix: getDefaultPrefix(documentType),
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: settings?.preferences?.defaultDueDays
      ? (() => {
          const days = parseInt(settings.preferences.defaultDueDays || "0", 10);
          const due = new Date();
          due.setDate(due.getDate() + days);
          return due.toISOString().split("T")[0];
        })()
      : undefined,
    bankAccount: settings?.banks
      ? (() => {
          const defaultBank = JSON.parse(settings.banks.banks).find(
            (bank) => bank.isDefault
          );
          if (!defaultBank) return null;

          const { bank_name, bank_accountNumber, ...others } = defaultBank;
          return {
            value: bank_name,
            id: bank_accountNumber,
            others,
          };
        })()
      : null,
    additionalCharges: settings?.preferences
      ? (() => {
          const defaultCharges = JSON.parse(
            settings.preferences.additionalCharges
          ).map((charge) => {
            if (charge.isDefault) {
              const { id, name, price, isDefault } = charge;
              return {
                value: name,
                id: id,
                price: price,
                isDefault: isDefault,
              };
            }
            return null;
          });
          return defaultCharges;
        })()
      : [],
    paymentModes: [],
    items: [],
    globalDiscount: { type: "percentage", value: 0 },
    notes: settings?.notesTerms?.[documentNotesType[documentType]]
      ? {
          value: "Default Note",
          id: "notes",
          note: settings?.notesTerms?.[documentNotesType[documentType]],
        }
      : {
          value: "Custom",
          id: "custom",
          note: "",
        },
    tds: { enabled: false, rate: 0, amount: 0 },
    tdsUnderGst: { enabled: false, rate: 0, amount: 0 },
    tcs: { enabled: false, rate: 0, amount: 0 },
    extraDiscount: 0,
    markedAsPaid: false,
    attachments: [],
  });

  const { profile } = useAuthStore();

  const [addresses, setAddress] = useState<any[]>(
    settings ? getFullShippingAddress(settings.companyDetails) : []
  );
  const vendors: any[] = [];

  const [showAdditionalCharges, setShowAdditionalCharges] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCustomPrefix, setIsCustomPrefix] = useState(
    !["SI-", "INV-", "BILL-"].includes(formData.invoicePrefix)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const prefix = formData.invoicePrefix;
    const currentNumber = formData.invoiceNumber;

    const isPrefixMismatch = currentNumber && !currentNumber.startsWith(prefix);

    if (!currentNumber || isPrefixMismatch) {
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");

      const newInvoiceNumber = `${new Date().getFullYear()}${random}`;

      setFormData((prev) => ({
        ...prev,
        invoiceNumber: newInvoiceNumber,
      }));
    }

    const initData = async () => {
      try {
        // if (settings) return;
        const fetchedSettings = await fetchAllSettings();
        setAddress(getFullShippingAddress(fetchedSettings.companyDetails));
      } catch (error) {
        console.error("Error initializing sales data:", error);
      }
    };
    initData();
  }, []);

  function onAddBankAccount() {
    navigate("/app/settings?subtab=financial&tab=banks");
  }

  // Notify parent of changes
  // useEffect(() => {
  //   onChange?.(formData);
  // }, [formData, onChange]);

  function getDefaultPrefix(type: DocumentType): string {
    const prefixes: Record<DocumentType, string> = {
      "sales-invoice": "SI-",
      "credit-note": "CN-",
      "debit-note": "DN-",
      purchase: "PI-",
      quotation: "QT-",
      "sales-return": "SR-",
      "purchase-return": "PR-",
      "purchase-order": "PO-",
      "delivery-challan": "DC-",
      "proforma-invoice": "PF-",
    };
    return prefixes[type];
  }

  const updateFormData = (updates: Partial<InvoiceFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = "Invoice number is required";
    }

    if (!formData.invoiceDate) {
      newErrors.invoiceDate = "Invoice date is required";
    }

    if (isCustomerBased && !formData.customer) {
      newErrors.customer = "Customer is required";
    }

    if (isVendorBased && !formData.vendor) {
      newErrors.vendor = "Vendor is required";
    }

    if (formData.items.length === 0) {
      newErrors.items = "At least one item is required";
    }

    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = "Quantity must be greater than 0";
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        newErrors[`item_${index}_price`] = "Unit price must be greater than 0";
      }
    });

    // Payment modes validation if not marked as paid
    if (!formData.markedAsPaid && formData.paymentModes.length > 0) {
      const totalPaid = formData.paymentModes.reduce(
        (sum, mode) => sum + mode.amount,
        0
      );
      const totalAmount = calculateTotals().total;

      formData.paymentModes.forEach((mode, index) => {
        if (!mode.amount || mode.amount <= 0) {
          newErrors[`payment_${index}_amount`] =
            "Payment amount must be greater than 0";
        }
        if (!mode.paymentMethod) {
          newErrors[`payment_${index}_method`] = "Payment method is required";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addItem = (product: any, quantity: number = 1) => {
    // Clear any existing item errors
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach((key) => {
      if (key.startsWith("item_") || key === "items") {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      product,
      quantity,
      unitPrice: product.price,
      discount: { type: "percentage", value: 0 },
      taxAmount: (product.price * quantity * product.taxRate) / 100,
      total:
        product.price * quantity +
        (product.price * quantity * product.taxRate) / 100,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setProductSearchQuery("");
  };

  const updateItem = (itemId: string, updates: Partial<InvoiceItem>) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
          // Recalculate totals
          const baseAmount = updatedItem.quantity * updatedItem.unitPrice;
          const discountAmount =
            updatedItem.discount.type === "percentage"
              ? (baseAmount * updatedItem.discount.value) / 100
              : updatedItem.discount.value;
          const discountedAmount = baseAmount - discountAmount;
          updatedItem.taxAmount =
            (discountedAmount * updatedItem.product.taxRate) / 100;
          updatedItem.total = discountedAmount + updatedItem.taxAmount;
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const removeItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  const handleDragEnd = (result: { oldIndex: number; newIndex: number }) => {
    const { oldIndex, newIndex } = result;

    const items = Array.from(formData.items);
    const [reorderedItem] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, reorderedItem);

    setFormData((prev) => ({ ...prev, items }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const itemDiscounts = formData.items.reduce((sum, item) => {
      const baseAmount = item.quantity * item.unitPrice;
      return (
        sum +
        (item.discount.type === "percentage"
          ? (baseAmount * item.discount.value) / 100
          : item.discount.value)
      );
    }, 0);

    const globalDiscountAmount =
      formData.globalDiscount.type === "percentage"
        ? (subtotal * formData.globalDiscount.value) / 100
        : formData.globalDiscount.value;

    const discountedSubtotal = subtotal - itemDiscounts - globalDiscountAmount;
    const taxAmount = formData.items.reduce(
      (sum, item) => sum + item.taxAmount,
      0
    );
    const additionalChargesTotal = formData.additionalCharges.reduce(
      (sum, charge) => sum + charge.price,
      0
    );

    let total =
      discountedSubtotal +
      taxAmount +
      additionalChargesTotal -
      formData.extraDiscount;

    // Apply TDS, TCS
    if (formData.tds.enabled) {
      total -= formData.tds.amount;
    }
    if (formData.tdsUnderGst.enabled) {
      total -= formData.tdsUnderGst.amount;
    }
    if (formData.tcs.enabled) {
      total += formData.tcs.amount;
    }

    // Round off
    const roundedTotal = formData.roundOff ? Math.round(total) : total;
    const roundOffAmount = roundedTotal - total;

    return {
      subtotal,
      totalDiscount:
        itemDiscounts + globalDiscountAmount + formData.extraDiscount,
      taxAmount,
      additionalChargesTotal,
      total: roundedTotal,
      roundOffAmount,
    };
  };

  const handleSubmit = async (action: "draft" | "save" | "save-print") => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const totals = calculateTotals();

      // Prepare invoice data for submission
      const invoiceData = {
        ...formData,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        status: action === "draft" ? "Draft" : "Sent",
        customerName: isCustomerBased
          ? formData.customer?.value
          : formData.vendor?.value,
        customerId: isCustomerBased
          ? formData.customer?.id
          : formData.vendor?.id,
      };

      console.log(invoiceData);

      await createInvoice(invoiceData);

      toast.success(
        action === "draft"
          ? "Invoice saved as draft"
          : "Invoice created successfully"
      );

      // Navigate back to sales page
      // navigate("/app/sales");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotals();
  const isCustomerBased = customerBasedTypes.includes(documentType);
  const isVendorBased = vendorBasedTypes.includes(documentType);

  function onAddAddress(): void {
    throw new Error("Function not implemented.");
  }

  function onAddCustomer(): void {
    throw new Error("Function not implemented.");
  }

  function onAddVendor(): void {
    throw new Error("Function not implemented.");
  }

  function onAddProduct(): void {
    throw new Error("Function not implemented.");
  }

  function onAddSignature(): void {
    throw new Error("Function not implemented.");
  }

  const predefinedPrefixes = ["SI-", "INV-", "BILL-"];

  const handlePrefixChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;

    if (val === "custom") {
      setIsCustomPrefix(true);
      updateFormData({
        invoicePrefix: "",
      });
    } else {
      setIsCustomPrefix(false);
      updateFormData({
        invoicePrefix: val,
      });
    }
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <button
          onClick={() => navigate(-1)}
          className={clsx(
            "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-gray-100"
          )}
        >
          <ChevronLeftIcon className={`h-4 w-4 mr-2`} />
          <span className="text-gray-600 text-md">Back</span>
        </button>
        <div className="flex items-center  mb-6">
          <div className="flex flex-1 ">
            <h1 className="flex text-2xl items-center font-bold text-gray-900 dark:text-white mr-12">
              {documentTypeLabels[documentType]}
            </h1>
            {/* Dispatch From Address */}
            <div className="w-64">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isCustomerBased ? "Dispatch From" : "Shipping From"}
              </label>
              <SearchableDropdown
                options={addresses}
                value={formData.dispatchFromAddress}
                onChange={(address) => {
                  updateFormData({ dispatchFromAddress: address });
                }}
                placeholder="Select dispatch address"
                displayKey="name"
                onAddNew={() =>
                  navigate("/app/settings?subtab=profile&tab=company-details")
                }
                addNewLabel="Add New Address"
                onRemoveOption={() =>
                  updateFormData({ dispatchFromAddress: null })
                }
                isCustomValue={true}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={formData.invoiceType}
              onChange={(e) =>
                updateFormData({ invoiceType: e.target.value as any })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="regular">Regular Invoice</option>
              <option value="bill-of-supply">Bill of Supply</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invoice Number
              {errors.invoiceNumber && (
                <span className="text-red-500 text-xs ml-2">
                  <ExclamationTriangleIcon className="h-3 w-3 inline mr-1" />
                  {errors.invoiceNumber}
                </span>
              )}
            </label>
            <>
              <div className="flex">
                <div className="flex flex-col">
                  {!isCustomPrefix ? (
                    <select
                      value={formData.invoicePrefix}
                      onChange={handlePrefixChange}
                      className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {settings.preferences?.[
                        documentPrefixType[documentType]
                      ] && (
                        <option
                          key="prefix"
                          value={
                            settings.preferences?.[
                              documentPrefixType[documentType]
                            ]
                          }
                        >
                          {
                            settings.preferences?.[
                              documentPrefixType[documentType]
                            ]
                          }
                        </option>
                      )}

                      <option value="custom">Custom</option>
                    </select>
                  ) : (
                    <div className="relative w-32">
                      <input
                        type="text"
                        value={formData.invoicePrefix}
                        onChange={(e) =>
                          updateFormData({
                            invoicePrefix: e.target.value.toUpperCase(),
                          })
                        }
                        className="uppercase w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Custom"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomPrefix(false)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                        title="Switch to dropdown"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    updateFormData({
                      invoiceNumber: e.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                  className={`flex-1 w-0 px-3 py-2 border border-l-0 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                    errors.invoiceNumber
                      ? "border-red-300 dark:border-red-600 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  }`}
                  placeholder="202400001"
                />
              </div>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Preview:{" "}
                <span className="font-mono">
                  {formData.invoicePrefix + formData.invoiceNumber}
                </span>
              </div>
            </>
          </div>

          {/* Customer/Vendor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isCustomerBased ? "Customer" : "Vendor"}
              {(isCustomerBased ? errors.customer : errors.vendor) && (
                <span className="text-red-500 text-xs ml-2">
                  <ExclamationTriangleIcon className="h-3 w-3 inline mr-1" />
                  {isCustomerBased ? errors.customer : errors.vendor}
                </span>
              )}
            </label>
            <SearchableDropdown
              options={
                isCustomerBased ? formatCustomerList(customers.data) : vendors
              }
              value={isCustomerBased ? formData.customer : formData.vendor}
              onChange={(entity) => {
                if (errors.customer || errors.vendor) {
                  setErrors((prev) => {
                    const { customer, vendor, ...others } = prev;
                    return {
                      ...others,
                    };
                  });
                }
                updateFormData(
                  isCustomerBased
                    ? {
                        customer: entity,
                        shipping: getCustomerShippingAddress(
                          entity,
                          customers.data
                        ),
                      }
                    : { vendor: entity }
                );
              }}
              placeholder={`Select ${isCustomerBased ? "customer" : "vendor"}`}
              displayKey="name"
              onAddNew={isCustomerBased ? onAddCustomer : onAddVendor}
              addNewLabel={`Add New ${isCustomerBased ? "Customer" : "Vendor"}`}
              icon={isCustomerBased ? UserIcon : BuildingOfficeIcon}
              onRemoveOption={() =>
                isCustomerBased
                  ? updateFormData({ customer: null })
                  : updateFormData({ vendor: null })
              }
              isCustomValue={true}
              error={isCustomerBased ? !!errors.customer : !!errors.vendor}
            />
          </div>

          {/* Shipping Address Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isCustomerBased ? "Shipping Address" : "Dispatch Address"}
            </label>
            <SearchableDropdown
              options={
                isCustomerBased
                  ? formatCustomerAddress(formData.customer, customers.data)
                  : vendors
              }
              value={isCustomerBased ? formData.shipping : formData.vendor}
              onChange={(entity) =>
                updateFormData(
                  isCustomerBased ? { shipping: entity } : { vendor: entity }
                )
              }
              placeholder={`Select ${
                isCustomerBased ? "shipping" : "dispatch"
              }`}
              displayKey="shipping"
              onAddNew={isCustomerBased ? onAddCustomer : onAddVendor}
              addNewLabel={`Add New ${
                isCustomerBased ? "Shipping" : "Dispatch"
              }`}
              icon={Truck}
              onRemoveOption={() =>
                isCustomerBased
                  ? updateFormData({ shipping: null })
                  : updateFormData({ vendor: null })
              }
              isCustomValue={true}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          {/* Invoice Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invoice Date
              {errors.invoiceDate && (
                <span className="text-red-500 text-xs ml-2">
                  <ExclamationTriangleIcon className="h-3 w-3 inline mr-1" />
                  {errors.invoiceDate}
                </span>
              )}
            </label>
            <DatePicker
              value={formData.invoiceDate}
              onChange={(date) => updateFormData({ invoiceDate: date })}
              error={!!errors.invoiceDate}
            />
          </div>

          {/* Due Date */}
          {!["quotation", "delivery-challan"].includes(documentType) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <DatePicker
                value={formData.dueDate || ""}
                onChange={(date) => updateFormData({ dueDate: date })}
                min={formData.invoiceDate ?? undefined}
              />
            </div>
          )}

          {/* Supplier Invoice Fields for Purchase */}
          {isVendorBased && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supplier Invoice Date
                </label>
                <DatePicker
                  value={formData.supplierInvoiceDate || ""}
                  onChange={(date) =>
                    updateFormData({ supplierInvoiceDate: date })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supplier Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.supplierInvoiceNumber || ""}
                  onChange={(e) =>
                    updateFormData({ supplierInvoiceNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter supplier invoice number"
                />
              </div>
            </>
          )}

          {/* Reference */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reference
            </label>
            <input
              type="text"
              value={formData.reference || ""}
              onChange={(e) => updateFormData({ reference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Reference, e.g. Sales, Shipment Number etc..."
            />
          </div>
        </div>
      </div>

      {/* Product Search & Add */}
      <ProductSearch
        products={formatProductsList(products)}
        searchQuery={productSearchQuery}
        onSearchChange={setProductSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onAddProduct={addItem}
        onAddNewProduct={onAddProduct}
        error={errors.items}
      />

      {/* Items Table */}
      <ItemTable
        items={formData.items}
        onUpdateItem={updateItem}
        onRemoveItem={removeItem}
        onDragEnd={handleDragEnd}
        globalDiscount={formData.globalDiscount}
        onGlobalDiscountChange={(discount) =>
          updateFormData({ globalDiscount: discount })
        }
        additionalCharges={formData.additionalCharges}
        onAdditionalChargesChange={(charges) =>
          updateFormData({ additionalCharges: charges })
        }
        additionalChargesOptions={
          settings?.preferences?.additionalCharges
            ? JSON.parse(settings.preferences.additionalCharges).map(
                (charge) => {
                  const { id, name, price, isDefault } = charge;
                  return {
                    value: name,
                    id: id,
                    price: price,
                    isDefault: isDefault,
                  };
                }
              )
            : []
        }
        showAdditionalCharges={showAdditionalCharges}
        onToggleAdditionalCharges={setShowAdditionalCharges}
        errors={errors}
      />

      {/* Summary Section */}
      <SummarySection
        totals={totals}
        tds={formData.tds}
        tdsUnderGst={formData.tdsUnderGst}
        tcs={formData.tcs}
        extraDiscount={formData.extraDiscount}
        roundOff={
          typeof settings?.preferences?.roundoff === "string"
            ? settings.preferences.roundoff === "true"
            : !!settings?.preferences?.roundoff
        }
        onTdsChange={(tds) => updateFormData({ tds })}
        onTdsUnderGstChange={(tdsUnderGst) => updateFormData({ tdsUnderGst })}
        onTcsChange={(tcs) => updateFormData({ tcs })}
        onExtraDiscountChange={(extraDiscount) =>
          updateFormData({ extraDiscount })
        }
      />

      {/* Payment & Bank Info */}
      {/* <PaymentSection
        bankAccount={formData.bankAccount}
        bankAccounts={bankAccounts}
        markedAsPaid={formData.markedAsPaid}
        paymentNotes={formData.paymentNotes}
        onBankAccountChange={(bankAccount) => updateFormData({ bankAccount })}
        onMarkedAsPaidChange={(markedAsPaid) =>
          updateFormData({ markedAsPaid })
        }
        onPaymentNotesChange={(paymentNotes) =>
          updateFormData({ paymentNotes })
        }
        onAddBankAccount={onAddBankAccount}
        paymentModes={[]}
      /> */}

      <PaymentSection
        bankAccount={formData.bankAccount}
        bankAccounts={formatBanksList(settings.banks)}
        markedAsPaid={formData.markedAsPaid}
        paymentNotes={formData.paymentNotes}
        paymentModes={formData.paymentModes}
        totalAmount={totals.total}
        onBankAccountChange={(bankAccount) => updateFormData({ bankAccount })}
        onMarkedAsPaidChange={(markedAsPaid) =>
          updateFormData({ markedAsPaid })
        }
        onPaymentNotesChange={(paymentNotes) =>
          updateFormData({ paymentNotes })
        }
        onPaymentModesChange={(paymentModes) =>
          updateFormData({ paymentModes })
        }
        onAddBankAccount={onAddBankAccount}
        errors={errors}
      />

      {/* Notes Section */}
      <NotesSection
        notes={formData.notes}
        onNotesChange={(notes) => updateFormData({ notes })}
        savedNotes={
          settings?.notesTerms?.[documentNotesType[documentType]]
            ? [
                {
                  value: "Default Note",
                  id: "notes",
                  note: settings?.notesTerms?.[documentNotesType[documentType]],
                },
              ]
            : []
        }
      />

      {/* Attachments */}
      <AttachmentSection
        attachments={formData.attachments}
        onAttachmentsChange={(attachments) => updateFormData({ attachments })}
        signature={formData.signature}
        signatures={settings.signatures ?? null}
        onSignatureChange={(signature) => updateFormData({ signature })}
        onAddSignature={() =>
          navigate("/app/settings?subtab=content&tab=signatures")
        }
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col space-y-2"
        >
          <Button
            onClick={() => handleSubmit("draft")}
            disabled={isSubmitting}
            variant="outline"
            className="shadow-lg backdrop-blur-3xl opacity-90"
          >
            <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit("save")}
            disabled={isSubmitting}
            className="shadow-lg"
          >
            <DocumentIcon className="h-5 w-5 mr-2" />
            Save
          </Button>
          <Button
            onClick={() => handleSubmit("save-print")}
            disabled={isSubmitting}
            variant="primary"
            className="shadow-lg"
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            Save & Print
          </Button>
        </motion.div>
      </div>

      {/* Total in Words */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Amount in Words:</span>{" "}
          {numberToWords(totals.total)} Only
        </p>

        {/* Display validation errors summary */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center mb-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                Please fix the following errors:
              </span>
            </div>
            <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to convert number to words (simplified)
function numberToWords(num: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n < 10) return ones[n];
    else if (n < 20) return teens[n - 10];
    else return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }

  function convertNumber(n: number): string {
    if (n === 0) return "";

    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const hundred = Math.floor((n % 1000) / 100);
    const rest = n % 100;

    let result = "";

    if (crore) result += convertTwoDigits(crore) + " Crore ";
    if (lakh) result += convertTwoDigits(lakh) + " Lakh ";
    if (thousand) result += convertTwoDigits(thousand) + " Thousand ";
    if (hundred) result += ones[hundred] + " Hundred ";
    if (rest) result += (result ? "and " : "") + convertTwoDigits(rest);

    return result.trim();
  }

  if (num === 0) return "Zero Rupees";

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = "";
  if (rupees) result += convertNumber(rupees) + " Rupees";
  if (paise)
    result += (result ? " and " : "") + convertNumber(paise) + " Paise";

  return result;
}
