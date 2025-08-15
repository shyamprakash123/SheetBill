import React, { useState, useEffect, useCallback, useRef } from "react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvoiceStore } from "../store/invoice";
import { useAuthStore } from "../store/auth";
import {
  DatePicker,
  DateRange,
} from "../components/DatePickerComponent/DatePicker";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import GoogleAuthModal from "../components/GoogleAuthModal";
import toast from "react-hot-toast";
import clsx from "clsx";
import StateDropdown, { gstStates } from "../components/ui/StateDropDown";
import ModeSwitch from "../components/ui/ModeSwitch";
import OptionsPopup from "../components/ui/OptionsPopup";
import Avatar from "../components/Avatar";
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  FileTextIcon,
  Filter,
  MoreVertical,
  RefreshCw,
  Share,
  Trash2,
  X,
  XCircleIcon,
} from "lucide-react";
import DefalultDueDaysComponent from "../components/ui/DefaultDueDaysComponent";
import { Customer } from "../types/invoice";
import { CustomerLedger } from "../lib/backend-service";
import format from "date-fns/format";
import CustomDateRangePicker from "../components/ui/DateRangePicker";
import { Label } from "../components/DatePickerComponent/Label";
import {
  Switch,
  Switch as TremorSwitch,
} from "../components/DatePickerComponent/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/DatePickerComponent/Select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/DatePickerComponent/PopOver";
import TransactionDetailsDrawer from "../components/TransactionDetailsDrawer";
import DeleteDialog from "../components/ui/DeleteDialog";
import { useToast } from "../components/DatePickerComponent/lib/useToast";
import PaymentTransaction from "../components/PaymentTransaction";
import { Badge } from "../components/DatePickerComponent/Badge";

const initialVendorState = {
  name: "",
  email: "",
  phone: "",
  billingAddress: {
    line1: "",
    line2: "",
    pincode: "",
    city: "",
    state: "",
    country: "India",
  },
  companyDetails: {
    gstin: "",
    companyName: "",
  },
  other: {
    profile_img: "",
    pan_no: "",
    discount: "",
    credit_limit: "",
    notes: "",
    default_due_date: "",
    isDefaultTDS: false,
    isDefaultTCS: false,
    isDefaultRCM: false,
  },
  status: "Active",
};

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

const getStatusColor = (balance) => {
  if (balance > 0) {
    return "text-green-500 dark:text-green-400";
  } else if (balance < 0) {
    return "text-red-600 dark:text-red-400";
  } else {
    return "text-gray-800 dark:text-gray-400";
  }
};

const getLightStatusColor = (balance) => {
  if (balance > 0) {
    return "bg-green-50 dark:bg-green-50";
  } else if (balance < 0) {
    return "bg-red-50 dark:bg-red-50";
  } else {
    return "bg-gray-50 dark:bg-gray-50";
  }
};

function extractPANFromGSTIN(gstin) {
  const gstinRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (typeof gstin !== "string" || !gstinRegex.test(gstin)) {
    return null; // Invalid GSTIN
  }

  // Extract PAN (characters 3 to 12)
  return gstin.substring(2, 12);
}

// Move FormInput outside and memoize it
const FormInput = React.memo(
  ({
    label,
    name,
    value,
    onChange,
    placeholder,
    required,
    type = "text",
    error,
    showFetchButton = false,
    onFetch, // callback for fetch
    loading = false,
    isCopyVendor = false,
    onCopyVendor,
    accountType = "debit",
    onKeyDown,
    onPaste,
  }) => (
    <div className="mb-4">
      {/* Label */}
      <label
        className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${
          name === "phone" ? "pl-8" : ""
        }`}
      >
        {label} {required && "*"}
      </label>

      {/* Wrapper for relative positioning */}
      <div className="relative">
        {/* Prefix for phone number */}
        {name === "phone" && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            +91
          </span>
        )}

        {/* Input Field */}
        <input
          type={type}
          name={name}
          min={0}
          onKeyDown={onKeyDown ?? null}
          onPaste={onPaste ?? null}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${
            name === "phone" ? "pl-12" : "pl-3"
          } py-2 border ${
            error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          } rounded-lg shadow-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 ${
            error ? "focus:ring-red-500" : "focus:ring-primary-500"
          }`}
        />

        {/* Fetch button inside input box on the right */}
        {showFetchButton && (
          <button
            type="button"
            onClick={onFetch}
            disabled={loading}
            className={clsx(
              "absolute right-0 top-1/2 -translate-y-1/2 h-full px-6 text-sm bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 items-center flex disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            Fetch
          </button>
        )}

        {name === "balance" && value && (
          <p
            className={clsx(
              `absolute right-4 top-1/2 -translate-y-1/2 h-full px-6 text-base  ${
                accountType === "debit" ? "text-red-800" : "text-green-800"
              }  font-semibold rounded-r-lg items-center flex disabled:opacity-50 disabled:cursor-not-allowed`
            )}
          >
            {accountType === "debit"
              ? "Vendor pays you "
              : "You pay the Vendor "}
            {formatCurrency(value)}
          </p>
        )}
      </div>

      {isCopyVendor && (
        <button type="button" onClick={onCopyVendor}>
          <p className="text-sm font-semibold hover:text-blue-500">
            Copy to Vendor Name?
          </p>
        </button>
      )}

      {/* Error */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
);

// Move FormSection outside and memoize it
const FormSection = React.memo(({ title, children }) => (
  <fieldset className="space-y-4">
    <legend className="text-lg font-semibold text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700 w-full">
      {title}
    </legend>
    <div className="pt-2 px-2 grid gap-4">{children}</div>
  </fieldset>
));

const VendorFormModal = React.memo(
  ({
    isOpen,
    onClose,
    onSubmit,
    initialVendorData,
    isEditing,
    loading,
    errors,
  }) => {
    const [vendor, setVendor] = useState(initialVendorData);
    const [loadingGSTIN, setLoadingGSTIN] = useState(false);
    const [accountType, setAccountType] = useState("debit");

    const handleFetchGSTIN = async () => {
      setLoadingGSTIN(true);
      try {
        const gstin = vendor.companyDetails.gstin;

        // Replace with your actual API call
        // const apiHeaders = {
        //   "Content-Type": "application/json",
        //   "x-api-version": "2023-03-01", // Use the version specified by Cashfree docs
        //   // 'x-client-id': env.CASHFREE_CLIENT_ID,
        //   // 'x-client-secret': env.CASHFREE_CLIENT_SECRET,
        // };

        const response = await fetch(
          `https://withered-cherry-2d8e.shyamprakash9959.workers.dev`,
          {
            method: "POST",
            body: JSON.stringify({ GSTIN: gstin }),
          }
        );
        // const response = await fetch(
        //   "https://cors-anywhere.herokuapp.com/" +
        //     encodeURIComponent(
        //       "https://api.cashfree.com/verification/marketing/gstin"
        //     ),
        //   {
        //     method: "POST",
        //     body: JSON.stringify({ GSTIN: gstin }),
        //   }
        // );

        const data = await response.json();

        // Update vendor details with fetched data
        // setVendor((prev) => ({
        //   ...prev,
        //   companyDetails: {
        //     ...prev.companyDetails,
        //     ...data, // Ensure this matches your structure
        //   },
        // }));

        const line2Parts = [
          data.principal_place_split_address?.street,
          data.principal_place_split_address?.district,
        ].filter(Boolean); // removes undefined, null, ""

        const matchedState = gstStates.find(
          (s) => s.name === data.principal_place_split_address?.state
        );

        setVendor((prev) => {
          return {
            ...prev,
            companyDetails: {
              ...prev.companyDetails,
              companyName:
                data?.trade_name_of_business ?? data?.legal_name_of_business,
            },
            billingAddress: {
              ...prev.billingAddress,
              line1: data.principal_place_split_address?.building_number,
              line2: line2Parts.join(", "),
              city: data.principal_place_split_address?.location,
              state: matchedState ? JSON.stringify(matchedState) : null,
              pincode: data.principal_place_split_address?.pincode,
            },
          };
        });
      } catch (error) {
        console.error("Error fetching GSTIN details:", error);
      } finally {
        setLoadingGSTIN(false);
      }
    };

    useEffect(() => {
      if (isOpen) {
        setVendor(initialVendorData);
      }
    }, [isOpen, initialVendorData]);

    useEffect(() => {
      const panFromGSTIN = extractPANFromGSTIN(vendor.companyDetails.gstin);
      if (panFromGSTIN) {
        setVendor((prev) => {
          return {
            ...prev,
            other: {
              ...prev.other,
              pan_no: panFromGSTIN,
            },
          };
        });
      }
    }, [vendor.companyDetails.gstin]);

    // Stable change handlers
    const handleChange = useCallback((e) => {
      const { name, value, type, checked } = e.target;
      if (type === "checked") {
        setVendor((prev) => ({
          ...prev,
          other: {
            ...prev.other,
            [name]: checked,
          },
        }));
      } else {
        setVendor((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    }, []);

    const handleNestedChange = useCallback(
      (section) => (e) => {
        const { name, value, type, checked } = e.target;

        const cleanedValue =
          type === "button" ? checked : value.replace(/[+-]/g, "");

        setVendor((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            [name]: cleanedValue,
          },
        }));
      },
      []
    );

    const handleOtherValueChange = (section, name, value) => {
      setVendor((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value,
        },
      }));
    };

    const handleSwitchChange = (name, checked) => {
      setVendor((prev) => ({
        ...prev,
        other: {
          ...prev.other,
          [name]: checked,
        },
      }));
    };

    const blockPlusMinus = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "+" || e.key === "-") {
        e.preventDefault();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      const paste = e.clipboardData.getData("text");
      if (/[+-]/.test(paste)) {
        e.preventDefault();
      }
    };

    const handleFormSubmit = useCallback(
      (e) => {
        e.preventDefault();
        const finalVendorData = {
          ...vendor,
          accountType: accountType,
        };
        onSubmit(finalVendorData);
      },
      [vendor, onSubmit]
    );

    // Create stable handlers for nested changes
    const handleBillingChange = useMemo(
      () => handleNestedChange("billingAddress"),
      [handleNestedChange]
    );
    const handleShippingChange = useMemo(
      () => handleNestedChange("shippingAddress"),
      [handleNestedChange]
    );
    const handleCompanyChange = useMemo(
      () => handleNestedChange("companyDetails"),
      [handleNestedChange]
    );
    const handleAccountChange = useMemo(
      () => handleNestedChange("account"),
      [handleNestedChange]
    );
    const handleOtherChange = useMemo(
      () => handleNestedChange("other"),
      [handleNestedChange]
    );

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? "Edit Vendor" : "Add New Vendor"}
        size="xl"
      >
        <form
          onSubmit={handleFormSubmit}
          className="flex flex-col h-[80vh] py-2"
        >
          <div className="flex-grow overflow-y-auto space-y-4 p-6 pt-2">
            {/* General Information Section */}
            <FormSection title="General Information">
              <FormInput
                label="Vendor Name"
                name="name"
                value={vendor.name}
                onChange={handleChange}
                placeholder="Enter vendor name"
                required
                error={errors.name}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Email"
                  name="email"
                  type="email"
                  value={vendor.email}
                  onChange={handleChange}
                  placeholder="vendor@example.com"
                  error={errors.email}
                />
                <FormInput
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={vendor.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  error={errors.phone}
                  onKeyDown={blockPlusMinus}
                  onPaste={handlePaste}
                />
              </div>
            </FormSection>

            {/* Company Section */}
            <FormSection title="Company & Tax (Optional)">
              <FormInput
                label="Company Name"
                name="companyName"
                value={vendor.companyDetails.companyName}
                onChange={handleCompanyChange}
                placeholder="e.g., Acme Corporation"
                isCopyVendor={
                  vendor?.companyDetails?.companyName?.trim() !== ""
                }
                onCopyVendor={() => {
                  setVendor((prev) => ({
                    ...prev,
                    name: vendor.companyDetails.companyName,
                  }));
                }}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="GSTIN"
                  name="gstin"
                  type=""
                  value={vendor.companyDetails.gstin}
                  onChange={handleCompanyChange}
                  placeholder="e.g., 27AABCU9603R1ZX"
                  error={errors.gstin}
                  showFetchButton={true}
                  onFetch={handleFetchGSTIN}
                  loading={loadingGSTIN}
                />
                <FormInput
                  label="PAN Number"
                  name="pan_no"
                  value={vendor.other.pan_no}
                  onChange={handleOtherChange}
                  placeholder="e.g., ABCDE1234F"
                  error={errors.pan_no}
                />
              </div>
            </FormSection>

            {/* Address Section */}
            <FormSection title="Address Details">
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">
                  Billing Address
                </h3>
                <FormInput
                  label="Address Line 1"
                  name="line1"
                  required
                  value={vendor.billingAddress.line1}
                  onChange={handleBillingChange}
                  placeholder="Street, area"
                />
                <FormInput
                  label="Address Line 2"
                  name="line2"
                  value={vendor.billingAddress.line2}
                  onChange={handleBillingChange}
                  placeholder="Apartment, suite, etc. (optional)"
                />
                <div className="pb-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                      label="City"
                      name="city"
                      value={vendor.billingAddress.city}
                      onChange={handleBillingChange}
                      placeholder="e.g., Mumbai"
                    />
                    <StateDropdown
                      value={vendor.billingAddress.state}
                      onChange={(e) =>
                        setVendor((prev) => {
                          return {
                            ...prev,
                            billingAddress: {
                              ...prev.billingAddress,
                              state: JSON.stringify(e),
                            },
                          };
                        })
                      }
                    />
                    <FormInput
                      label="Pincode"
                      name="pincode"
                      value={vendor.billingAddress.pincode}
                      onChange={handleBillingChange}
                      placeholder="e.g., 400001"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Billing State (like 36-Telangana) is responsible for
                    deciding CGST + SGST/UTGST or IGST calculation on the
                    invoice. Please ignore this, if you do not have GST.
                  </p>
                </div>
              </div>
            </FormSection>

            {/* Advanced Section */}
            <FormSection title="Advanced Settings">
              {!isEditing && (
                <div className="flex space-x-8">
                  <div className="flex-1">
                    <FormInput
                      label="Opening Balance"
                      name="balance"
                      type="number"
                      value={vendor.balance}
                      onChange={handleChange}
                      placeholder="e.g., ₹50000"
                      accountType={accountType}
                      onKeyDown={blockPlusMinus}
                      onPaste={handlePaste}
                    />
                  </div>
                  <ModeSwitch
                    value={accountType}
                    onChange={(mode) =>
                      setAccountType((prev) =>
                        prev === "debit" ? "credit" : "debit"
                      )
                    }
                  />
                </div>
              )}
              <div className="pb-0 mb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Credit Limit"
                    name="credit_limit"
                    type="number"
                    value={vendor.other.credit_limit}
                    onChange={handleOtherChange}
                    placeholder="e.g., ₹50000"
                    onKeyDown={blockPlusMinus}
                    onPaste={handlePaste}
                  />
                  <DefalultDueDaysComponent
                    value={vendor.other.default_due_date}
                    onChange={(val) =>
                      handleOtherValueChange("other", "default_due_date", val)
                    }
                  />
                  {/* <FormInput
                    label="Default Due Date (in days)"
                    name="default_due_date"
                    type="number"
                    value={vendor.other.default_due_date}
                    onChange={handleOtherChange}
                    placeholder="e.g., 30"
                  /> */}
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Warning will be shown when vendor is exceeding the credit
                  limit while creating invoice.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={vendor.other.notes || ""}
                  onChange={handleOtherChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Any specific notes about the vendor..."
                />
              </div>
              <div className="space-y-2 pt-2 pb-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Tax Defaults
                </label>
                <div className="flex items-center space-x-6">
                  {["isDefaultTDS", "isDefaultTCS", "isDefaultRCM"].map(
                    (taxType) => (
                      <div key={taxType} className="flex items-center">
                        <Switch
                          label={taxType.replace("isDefault", "")}
                          checked={vendor.other[taxType] || false}
                          onChange={(checked) =>
                            handleSwitchChange(taxType, checked)
                          }
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            </FormSection>
          </div>

          {/* Modal Footer */}
          <div className="flex-shrink-0 flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={loading}>
              {isEditing ? "Update Vendor" : "Add Vendor"}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }
);

const LedgerModal = React.memo(
  ({ status, onClose, handleTransactionModalOpen }) => {
    const rowsOption = [
      {
        value: "20",
        label: "20",
      },
      {
        value: "50",
        label: "50",
      },
      {
        value: "100",
        label: "100",
      },
      {
        value: "150",
        label: "150",
      },
    ];

    const statusToVariant = {
      pending: "warning", // yellow
      "partially paid": "default", // choose neutral or create custom if needed
      paid: "success", // green
      failed: "error", // red (if needed)
    };

    const [showPendingInvoices, setShowPendingInvoices] = useState(false);
    const [ledgerData, setLedgerData] = useState<CustomerLedger[]>([]);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
      undefined
    );

    const { toast } = useToast();

    const [transactionDetailsModal, setTransactionDetailsModal] = useState<{
      isOpen: boolean;
      vendor: Customer | null;
      transactionType: any;
      vendorLedger?: CustomerLedger | null;
    }>({
      isOpen: false,
      vendor: null,
      transactionType: null,
      vendorLedger: null,
    });

    const [rowsPerPage, setRowsPerPage] = useState("20");
    const [currentPage, setCurrentPage] = useState("1");
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [orderType, setOrderType] = useState<"ASC" | "DESC">("DESC");
    const [loading, setLoading] = useState(false);

    const [deleteDialog, setDeleteDialog] = useState<{
      isOpen: boolean;
      onConfirm: () => void;
      itemName: string | null;
    }>({
      isOpen: false,
      onConfirm: () => {},
      itemName: null,
    });

    const { fetchVendorLedger, deleteVendorTransaction } = useInvoiceStore();

    const fetchData = async () => {
      try {
        setLoading(true);
        const { count, data: vendorLedgers } = await fetchVendorLedger(
          status.vendor.id,
          dateRange,
          orderType,
          rowsPerPage,
          currentPage,
          showPendingInvoices
        );
        setLedgerData(vendorLedgers);
        setTotalCount(count);
        setTotalPages(Math.ceil(count / parseInt(rowsPerPage)));
        console.log(vendorLedgers);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch vendor ledger:", error);
        setLoading(false);
      }
    };

    const handleUpdatedLedger = (updatedLedger: CustomerLedger) => {
      setLedgerData((prev) =>
        prev.map((ledger) =>
          ledger.ledger_id === updatedLedger.ledger_id ? updatedLedger : ledger
        )
      );
    };

    useEffect(() => {
      // Only run the fetch logic if the ID is present.
      if (status.vendor?.id) {
        fetchData();
      }
    }, [
      status.vendor?.id,
      dateRange,
      orderType,
      rowsPerPage,
      currentPage,
      showPendingInvoices,
    ]);

    const handleOnOrderTypeChange = () => {
      setOrderType((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    };

    const handleDeleteTransaction = async (row_id: number) => {
      try {
        setLoading(true);
        await deleteVendorTransaction(row_id);
        setDeleteDialog({ isOpen: false, onConfirm: () => {}, itemName: null });
        toast({
          title: "Success",
          description: "Transaction deleted successfully.",
          variant: "success",
          duration: 3000,
        });

        await fetchData(); // Refresh data after deletion
      } catch (error) {
        console.error("Failed to delete transaction:", error);
      }
    };

    const handleTransactionDeleteConfirm = (ledger: CustomerLedger) => {
      setDeleteDialog({
        isOpen: true,
        onConfirm: () => handleDeleteTransaction(ledger.row_id),
        itemName: ledger.ledger_id,
      });
    };

    return (
      <>
        <Modal
          isOpen={status.isOpen}
          onClose={() => {
            setLedgerData([]);
            onClose();
          }}
          title={
            status.vendor?.companyDetails.companyName || status.vendor?.name
          }
          size="xxl"
        >
          <div className="bg-gray-50 h-[80vh] rounded-xl flex flex-col">
            {/* Main Content */}
            <div className="px-6 py-4 flex-1 flex flex-col overflow-hidden">
              {/* Company Info Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={
                        status.vendor?.companyDetails.companyName ||
                        status.vendor?.name
                      }
                    />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {status.vendor?.companyDetails.companyName ||
                          status.vendor?.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {status.vendor?.name}{" "}
                        <span>{status.vendor?.phone}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">
                          {status.vendor?.balance !== 0 &&
                            (status.vendor?.balance > 0
                              ? "YOU PAY"
                              : "YOU COLLECT")}
                        </span>
                        <p
                          className={`flex px-2 py-1  text-lg font-semibold tracking-wide text-right ${getStatusColor(
                            status.vendor?.balance
                          )}`}
                        >
                          {formatCurrency(Math.abs(status.vendor?.balance))}
                        </p>
                        <button
                          onClick={() => fetchData()}
                          disabled={loading}
                          className={`px-2 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <RefreshCw
                            size={16}
                            className={`text-gray-500 hover:text-gray-600 ${
                              loading ? "animate-spin" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                      <Share size={16} />
                      Share
                    </button>
                    <div className="flex items-center">
                      <button className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-l-lg hover:bg-purple-100">
                        <FileText size={16} />
                        View PDF
                      </button>
                      <button className="px-2 py-2 bg-purple-50 text-purple-700 rounded-r-lg hover:bg-purple-100 border-l border-purple-200">
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Range and Filters */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CustomDateRangePicker
                      dateRange={dateRange}
                      setDateRange={setDateRange}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <TremorSwitch
                      id="r1"
                      checked={showPendingInvoices}
                      onCheckedChange={setShowPendingInvoices}
                    />
                    <Label htmlFor="r1">Show Pending Transactions</Label>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-y-auto flex-1">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Id #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div
                            className="flex items-center gap-1 cursor-pointer"
                            onClick={handleOnOrderTypeChange}
                          >
                            Date / Created Time
                            {orderType === "ASC" ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronUp size={14} />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mode
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Closing Balance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loading ? (
                        // Render 6 skeleton rows
                        Array.from({ length: 6 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4">
                              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                              <div className="h-3 bg-gray-100 rounded w-16"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                              <div className="h-3 bg-gray-100 rounded w-14"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-5 bg-gray-200 rounded w-16"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-5 bg-gray-200 rounded w-14"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 bg-gray-200 rounded w-12"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 bg-gray-200 rounded w-12"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-5 bg-gray-200 rounded w-20"></div>
                            </td>
                          </tr>
                        ))
                      ) : ledgerData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center ">
                            <div className="flex justify-center items-center">
                              <XCircleIcon className="inline-block w-5 h-5 mr-2 text-red-400" />
                              <p className="text-base font-semibold">
                                No data available
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        ledgerData.map((ledger, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50"
                            onClick={() => {
                              if (
                                ledger.type === "payIn" ||
                                ledger.type === "payOut"
                              )
                                setTransactionDetailsModal({
                                  isOpen: true,
                                  vendor: status.vendor,
                                  transactionType: ledger.type,
                                  vendorLedger: ledger,
                                });
                            }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {ledger.document_id || ledger.ledger_id}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {ledger.type}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {format(new Date(ledger.date), "dd-MM-yyyy")}
                              </div>
                              <div className="text-sm text-gray-500">
                                {format(new Date(ledger.date), "d MMM yy")}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {ledger.status && (
                                <Badge
                                  variant={
                                    statusToVariant[ledger.status] || "neutral"
                                  }
                                >
                                  {ledger.status}
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {ledger.paymentMode && (
                                <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                  {ledger.paymentMode}
                                </span>
                              )}
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap ${
                                ledger.amount < 0
                                  ? "bg-red-50/60"
                                  : "bg-green-50/60"
                              }`}
                            >
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(ledger.amount)}
                              </div>
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap ${
                                ledger.balance !== 0
                                  ? ledger.balance < 0
                                    ? "bg-red-50"
                                    : "bg-green-50"
                                  : "bg-white"
                              }`}
                            >
                              <div
                                className={`text-sm font-semibold ${
                                  ledger.balance === 0
                                    ? "text-gray-900"
                                    : ledger.balance < 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {formatCurrency(Math.abs(ledger.balance))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {ledger.ledger_id &&
                                ledger.status !== "opening balance" && (
                                  <div className="flex items-center justify-end gap-2">
                                    {ledger.status === "pending" && (
                                      <button className="text-red-500 hover:text-red-700">
                                        <Trash2 size={16} />
                                      </button>
                                    )}
                                    {(ledger.type === "payIn" ||
                                      ledger.type === "payOut") && (
                                      <button
                                        className="flex text-yellow-800 hover:text-yellow-900 bg-yellow-500/10 px-2 py-1 rounded items-center"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTransactionModalOpen(
                                            status.vendor,
                                            ledger.type,
                                            (updatedLedger: CustomerLedger) => {
                                              handleUpdatedLedger(
                                                updatedLedger
                                              );
                                              toast({
                                                title: `${ledger.type} Success`,
                                                description:
                                                  "Transaction Updated successfully.",
                                                variant: "success",
                                                duration: 3000,
                                              });
                                            },
                                            ledger
                                          );
                                        }}
                                      >
                                        <Edit size={16} />
                                        <span className="text-sm ml-2">
                                          Edit
                                        </span>
                                      </button>
                                    )}
                                    <button
                                      className="text-red-500 hover:text-red-700 bg-blue-50 px-1 py-1 rounded"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTransactionDeleteConfirm(ledger);
                                      }}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                    <button
                                      className="flex text-gray-800 hover:text-gray-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded items-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTransactionDetailsModal({
                                          isOpen: true,
                                          vendor: status.vendor,
                                          transactionType: ledger.type,
                                          vendorLedger: ledger,
                                        });
                                      }}
                                    >
                                      <Eye size={16} />
                                      <span className="text-sm ml-2">View</span>
                                    </button>
                                    <button className="text-gray-800 hover:text-gray-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded items-center">
                                      <ExternalLink size={16} />
                                    </button>
                                  </div>
                                )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Actions and Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    onClick={() =>
                      handleTransactionModalOpen(status.vendor, "payIn", () => {
                        toast({
                          title: "PayIn Success",
                          description: "Transaction created successfully.",
                          variant: "success",
                          duration: 3000,
                        });
                        fetchData();
                      })
                    }
                  >
                    <span className="text-lg">↓</span>
                    You Got
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    onClick={() =>
                      handleTransactionModalOpen(
                        status.vendor,
                        "payOut",
                        () => {
                          toast({
                            title: "PayOut Success",
                            description: "Transaction created successfully.",
                            variant: "success",
                            duration: 3000,
                          });
                          fetchData();
                        }
                      )
                    }
                  >
                    <span className="text-lg">↑</span>
                    You Gave
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {/* Prev Button */}
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50  disabled:cursor-not-allowed"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.max(parseInt(p) - 1, 1).toString()
                      )
                    }
                    disabled={loading || parseInt(currentPage) === 1}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Current Page */}
                  <span className="px-3 py-1 bg-blue-600 text-white rounded">
                    {totalPages > 0 ? currentPage : 0} / {totalPages}
                  </span>

                  {/* Next Button */}
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(parseInt(p) + 1, totalPages).toString()
                      )
                    }
                    disabled={
                      loading ||
                      parseInt(currentPage) === totalPages ||
                      totalPages === 0
                    }
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Rows per page */}
                  <div className="flex items-center gap-2 ml-4">
                    <Select
                      value={rowsPerPage}
                      onValueChange={(value) => {
                        setRowsPerPage(value);
                        setCurrentPage("1"); // reset to first page when size changes
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger id="size-disabled">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {rowsOption.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <TransactionDetailsDrawer
            isOpen={transactionDetailsModal.isOpen}
            onOpenChange={(open) => {
              setTransactionDetailsModal((prev) => ({ ...prev, isOpen: open }));
            }}
            transactionType={transactionDetailsModal.transactionType}
            customer={transactionDetailsModal.vendor}
            customerLedger={transactionDetailsModal.vendorLedger}
          />
        </Modal>
        <DeleteDialog
          open={deleteDialog.isOpen}
          onClose={() =>
            setDeleteDialog({
              isOpen: false,
              onConfirm: () => {},
              itemName: null,
            })
          }
          onConfirm={deleteDialog.onConfirm}
          itemName={deleteDialog.itemName}
          loading={loading}
        />
      </>
    );
  }
);

export default function Vendors() {
  const { vendors, fetchVendors, createVendor, updateVendor, loading } =
    useInvoiceStore();
  const { profile } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLedgerModal, setLedgerModal] = useState<{
    isOpen: boolean;
    vendor: Customer | null;
  }>({ isOpen: false, vendor: null });
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [formData, setFormData] = useState(initialVendorState);
  const [errors, setErrors] = useState({});
  const [transactionModal, setTransactionModal] = useState<{
    isOpen: boolean;
    vendor: Customer | null;
    transactionType: "payIn" | "payOut" | null;
    onSuccess?: () => void;
    ledger?: CustomerLedger;
    userType: "customer" | "vendor";
  }>({
    isOpen: false,
    vendor: null,
    transactionType: null,
    onSuccess: () => {},
    ledger: undefined,
    userType: "vendor",
  });

  const handleTransactionModalOpenChange = (open: boolean) => {
    setTransactionModal({
      isOpen: open,
      vendor: null,
      transactionType: null,
      onSuccess: () => {},
      ledger: undefined,
      userType: "vendor",
    });
  };

  const { toast } = useToast();

  const handleTransactionModalOpen = (
    vendor: Customer,
    transactionType: "payIn" | "payOut",
    onSuccess?: () => void,
    ledger?: CustomerLedger
  ) => {
    setTransactionModal({
      isOpen: true,
      vendor,
      transactionType,
      onSuccess,
      ledger,
      userType: "vendor",
    });
  };

  const handleCopy = async (name: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Success",
        description: `${name} copied!`,
        variant: "success",
        duration: 3000,
      });
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      if (!profile?.google_tokens) {
        setShowGoogleAuth(true);
        return;
      }
      try {
        await fetchVendors();
      } catch (error) {
        console.error("Error fetching Vendors:", error);
        if (error.message?.includes("Google account")) {
          setShowGoogleAuth(true);
        }
      }
    };
    initData();
  }, [profile, fetchVendors]);

  useEffect(() => {
    if (!showLedgerModal) return;

    setLedgerModal((prev) => {
      const matchedVendor = vendors.data.find((c) => c.id === prev.vendor?.id);

      // If vendor is the same, don't trigger a state update
      if (!matchedVendor || matchedVendor === prev.vendor) {
        return prev;
      }

      return {
        ...prev,
        vendor: matchedVendor,
      };
    });
  }, [vendors, showLedgerModal]);

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.name.trim()) newErrors.name = "Vendor name is required.";
    if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = "Email address is invalid.";
    }
    if (
      data.phone &&
      !/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/.test(data.phone)
    ) {
      newErrors.phone = "Phone number is invalid.";
    }
    if (
      data.companyDetails.gstin &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        data.companyDetails.gstin
      )
    ) {
      newErrors.gstin = "GSTIN is invalid.";
    }
    if (
      data.other.pan_no &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.other.pan_no)
    ) {
      newErrors.pan_no = "PAN number is invalid.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateVendor = async (vendorData) => {
    if (!validateForm(vendorData)) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    if (!profile?.google_tokens) {
      setShowGoogleAuth(true);
      return;
    }

    try {
      if (editingVendor) {
        await updateVendor(editingVendor.id, vendorData);
        toast({
          title: "Success",
          description: "Vendor updated successfully.",
          variant: "success",
          duration: 3000,
        });
      } else {
        await createVendor(vendorData);
        toast({
          title: "Success",
          description: "Vendor created successfully.",
          variant: "success",
          duration: 3000,
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast({
        title: "Failed",
        description: "Failed to save vendor",
        variant: "error",
        duration: 3000,
      });
    }
  };

  const handleEdit = (vendor) => {
    console.log(vendor);
    const vendorData = {
      ...initialVendorState,
      ...vendor,
      billingAddress: {
        ...initialVendorState.billingAddress,
        ...(vendor.billingAddress || {}),
      },
      companyDetails: {
        ...initialVendorState.companyDetails,
        ...(vendor.companyDetails || {}),
      },
      account: { ...initialVendorState.account, ...(vendor.account || {}) },
      other: { ...initialVendorState.other, ...(vendor.other || {}) },
    };
    setFormData(vendorData);
    setEditingVendor(vendor);
    setShowCreateModal(true);
    setErrors({});
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingVendor(null);
    setFormData(initialVendorState);
    setErrors({});
  };

  const handleLedgerCloseModal = () => {
    setLedgerModal({ isOpen: false, vendor: null });
  };

  const handleGoogleAuthSuccess = async () => {
    setShowGoogleAuth(false);
    try {
      await fetchVendors();
      toast({
        title: "Success",
        description: "Google account connected! You can now manage vendors.",
        variant: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error after Google auth:", error);
      toast({
        title: "Failed",
        description:
          "Connected to Google but had issues setting up spreadsheet.",
        variant: "error",
        duration: 3000,
      });
    }
  };

  const filteredVendors = vendors.data.filter((vendor) => {
    const matchesSearch =
      vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor?.companyDetails?.companyName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      vendor.phone?.includes(searchTerm) ||
      vendor.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      vendor.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalVendors = vendors.data.length;
  const activeVendors = vendors.data.filter(
    (c) => c.status === "Active"
  ).length;
  const inactiveVendors = vendors.data.filter(
    (c) => c.status === "Inactive"
  ).length;
  const vendorsWithGST = vendors.data.filter(
    (c) => c.companyDetails?.gstin && c.companyDetails.gstin.trim()
  ).length;

  const stats = [
    {
      title: "Total Vendors",
      value: totalVendors.toString(),
      icon: UserGroupIcon,
      color: "bg-blue-500",
    },
    {
      title: "Active Vendors",
      value: activeVendors.toString(),
      icon: UserGroupIcon,
      color: "bg-green-500",
    },
    {
      title: "Inactive Vendors",
      value: inactiveVendors.toString(),
      icon: UserGroupIcon,
      color: "bg-red-500",
    },
    {
      title: "GST Registered",
      value: vendorsWithGST.toString(),
      icon: BuildingOffice2Icon,
      color: "bg-purple-500",
    },
  ];

  const statusFilterData = [
    {
      value: "all",
      label: "All Status",
    },
    {
      value: "active",
      label: "Active",
    },
    {
      value: "inactive",
      label: "Inactive",
    },
  ];

  if (loading && !vendors.data.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Vendor Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View, create, and manage your vendor database.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: "Success",
                  description: "Transaction deleted successfully.",
                  variant: "success",
                  duration: 3000,
                });
              }}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hover className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, company, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {statusFilterData.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Vendors ({filteredVendors.length})
            </h3>
          </div>
          <div className="bg-white border border-gray-200 overflow-hidden flex-1 flex flex-col max-h-[calc(100vh-200px)]">
            <div className="overflow-y-auto flex-1 ">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Closing Balance
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredVendors.map((vendor, index) => {
                    const actions = [
                      {
                        label: "Ledger",
                        icon: (
                          <FileTextIcon className="w-6 h-6 text-blue-600" />
                        ),
                        onClick: () =>
                          setLedgerModal({ isOpen: true, vendor: vendor }),
                      },
                      {
                        label: "You Got",
                        icon: (
                          <ArrowDownCircleIcon className="w-6 h-6 text-green-600" />
                        ),
                        onClick: () =>
                          handleTransactionModalOpen(vendor, "payIn", () => {
                            toast({
                              title: "PayIn Success",
                              description: "Transaction created successfully.",
                              variant: "success",
                              duration: 3000,
                            });
                          }),
                      },
                      {
                        label: "You Gave",
                        icon: (
                          <ArrowUpCircleIcon className="w-6 h-6 text-red-600" />
                        ),
                        onClick: () =>
                          handleTransactionModalOpen(vendor, "payOut", () => {
                            toast({
                              title: "PayOut Success",
                              description: "Transaction created successfully.",
                              variant: "success",
                              duration: 3000,
                            });
                          }),
                      },
                      {
                        label: "Edit",
                        icon: <Edit3 className="w-6 h-6 text-teal-600" />,
                        onClick: () => {
                          handleEdit(vendor);
                        },
                      },
                      {
                        label: "Delete",
                        icon: <Trash2 className="w-6 h-6 text-red-500" />,
                        onClick: () => alert("Delete"),
                      },
                    ];

                    return (
                      <motion.tr
                        key={vendor.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() =>
                          setLedgerModal({ isOpen: true, vendor: vendor })
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4">
                              <Avatar
                                name={
                                  vendor?.companyDetails.companyName ||
                                  vendor?.name
                                }
                                colour="blue"
                              />
                            </div>
                            <div>
                              <div className="text-base font-medium text-gray-900 dark:text-white">
                                {vendor.companyDetails?.companyName ||
                                  vendor.name}
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                {vendor.companyDetails?.companyName
                                  ? vendor.name
                                  : ""}{" "}
                                <div className="relative group inline-block">
                                  <p
                                    className="hover:underline cursor-pointer hover:text-black"
                                    onClick={() =>
                                      handleCopy(
                                        "GSTIN",
                                        vendor.companyDetails?.gstin
                                      )
                                    }
                                  >
                                    {vendor.companyDetails?.gstin || ""}
                                  </p>

                                  {/* Tooltip */}
                                  <div
                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1
                  bg-gray-700 text-white text-base px-3 py-1 rounded opacity-0 group-hover:opacity-100
                  transition-opacity duration-200 z-10 pointer-events-none"
                                  >
                                    Click to copy
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-700 rotate-45"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {vendor.email && (
                              <div className="flex items-center mb-1">
                                <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                                {vendor.email}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {vendor.phone && (
                              <div className="flex items-center">
                                <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                                {vendor.phone}
                              </div>
                            )}
                          </div>
                        </td>

                        <td
                          className={`px-6 py-4 whitespace-nowrap ${getLightStatusColor(
                            vendor?.balance
                          )}`}
                        >
                          <p
                            className={`px-2 py-1 w-full text-base font-semibold tracking-wide text-right ${getStatusColor(
                              vendor?.balance
                            )}`}
                          >
                            {formatCurrency(Math.abs(vendor.balance))}
                            <p className="text-[10px] font-medium">
                              {vendor.balance !== 0 &&
                                (vendor.balance > 0
                                  ? "You Pay↑"
                                  : "You Collect↓")}
                            </p>
                          </p>
                        </td>
                        <td className="text-right px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="hover:bg-gray-200 rounded-full p-2"
                              >
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0" align="end">
                              <div className="flex flex-col gap-4">
                                <div className="space-y-1">
                                  <ul>
                                    {actions.map((option, i) => (
                                      <li
                                        key={i}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          option.onClick();
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer transition"
                                      >
                                        {option.icon}
                                        {option.label}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredVendors.length === 0 && (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm || filterStatus !== "all"
                      ? "No vendors match your filters."
                      : "No vendors found. Add your first vendor."}
                  </p>
                  {!searchTerm && filterStatus === "all" && (
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4"
                    >
                      Add Vendor
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="p-2 ml-4 flex space-x-4 sticky bottom-0">
            <p className="bg-green-600 px-2  py-1 text-base text-white rounded-lg">
              You Pay ↑{" "}
              <span className="font-medium tracking-wide">
                {formatCurrency(vendors.statusInsights.credit)}
              </span>
            </p>
            <p className="bg-red-600 px-2  py-1 text-base text-white rounded-lg">
              You Collect ↓{" "}
              <span className="font-medium tracking-wide">
                {formatCurrency(Math.abs(vendors.statusInsights.debit))}
              </span>
            </p>
          </div>
        </Card>
      </div>

      <VendorFormModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSubmit={handleCreateVendor}
        initialVendorData={editingVendor ? formData : initialVendorState}
        isEditing={!!editingVendor}
        loading={loading}
        errors={errors}
      />

      <LedgerModal
        status={showLedgerModal}
        onClose={handleLedgerCloseModal}
        handleTransactionModalOpen={handleTransactionModalOpen}
      />

      <PaymentTransaction
        isOpen={transactionModal.isOpen}
        onOpenChange={handleTransactionModalOpenChange}
        transactionType={transactionModal.transactionType}
        customer={transactionModal.vendor}
        onSuccess={transactionModal.onSuccess}
        ledger={transactionModal.ledger}
        userType={transactionModal.userType}
      />

      <GoogleAuthModal
        isOpen={showGoogleAuth}
        onClose={() => setShowGoogleAuth(false)}
        onSuccess={handleGoogleAuthSuccess}
      />
    </>
  );
}
