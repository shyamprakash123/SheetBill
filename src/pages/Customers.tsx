import React, { useState, useEffect, useCallback } from "react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvoiceStore } from "../store/invoice";
import { useAuthStore } from "../store/auth";
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
import Switch from "../components/ui/Switch";
import ModeSwitch from "../components/ui/ModeSwitch";
import OptionsPopup from "../components/ui/OptionsPopup";
import { Edit3, Eye, Trash2 } from "lucide-react";
import DefalultDueDaysComponent from "../components/ui/DefaultDueDaysComponent";

const initialCustomerState = {
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
  shippingAddress: {
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
  account: {
    balance: "",
    type: "debit",
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
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount || 0);
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
    isCopyCustomer = false,
    onCopyCustomer,
    accountType = "debit",
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

        {name === "balance" && value.trim() !== "" && (
          <p
            className={clsx(
              `absolute right-4 top-1/2 -translate-y-1/2 h-full px-6 text-base  ${
                accountType === "debit" ? "text-green-800" : "text-red-800"
              }  font-semibold rounded-r-lg items-center flex disabled:opacity-50 disabled:cursor-not-allowed`
            )}
          >
            {accountType === "debit"
              ? "Customer pays you "
              : "You pay the Customer "}
            {formatCurrency(value)}
          </p>
        )}
      </div>

      {isCopyCustomer && (
        <button type="button" onClick={onCopyCustomer}>
          <p className="text-sm font-semibold hover:text-blue-500">
            Copy to Customer Name?
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

const CustomerFormModal = React.memo(
  ({
    isOpen,
    onClose,
    onSubmit,
    initialCustomerData,
    isEditing,
    loading,
    errors,
  }) => {
    const [customer, setCustomer] = useState(initialCustomerData);
    const [sameAsBilling, setSameAsBilling] = useState(true);
    const [loadingGSTIN, setLoadingGSTIN] = useState(false);

    const handleFetchGSTIN = async () => {
      setLoadingGSTIN(true);
      try {
        const gstin = customer.companyDetails.gstin;

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

        // Update customer details with fetched data
        // setCustomer((prev) => ({
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

        setCustomer((prev) => {
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

        console.log(data);
      } catch (error) {
        console.error("Error fetching GSTIN details:", error);
      } finally {
        setLoadingGSTIN(false);
      }
    };

    useEffect(() => {
      if (isOpen) {
        setCustomer(initialCustomerData);
        const billing = JSON.stringify(initialCustomerData.billingAddress);
        const shipping = JSON.stringify(initialCustomerData.shippingAddress);
        setSameAsBilling(
          shipping === billing || !initialCustomerData.shippingAddress?.line1
        );
      }
    }, [isOpen, initialCustomerData]);

    useEffect(() => {
      const panFromGSTIN = extractPANFromGSTIN(customer.companyDetails.gstin);
      if (panFromGSTIN) {
        setCustomer((prev) => {
          return {
            ...prev,
            other: {
              ...prev.other,
              pan_no: panFromGSTIN,
            },
          };
        });
      }
    }, [customer.companyDetails.gstin]);

    // Stable change handlers
    const handleChange = useCallback((e) => {
      const { name, value, type, checked } = e.target;
      if (type === "checked") {
        setCustomer((prev) => ({
          ...prev,
          other: {
            ...prev.other,
            [name]: checked,
          },
        }));
      } else {
        setCustomer((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    }, []);

    const handleNestedChange = useCallback(
      (section) => (e) => {
        const { name, value, type, checked } = e.target;
        setCustomer((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            [name]: type === "button" ? checked : value,
          },
        }));
      },
      []
    );

    const handleOtherValueChange = (section, name, value) => {
      setCustomer((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value,
        },
      }));
    };

    const handleSwitchChange = (name, checked) => {
      setCustomer((prev) => ({
        ...prev,
        other: {
          ...prev.other,
          [name]: checked,
        },
      }));
    };

    const handleFormSubmit = useCallback(
      (e) => {
        e.preventDefault();
        const finalCustomerData = {
          ...customer,
          shippingAddress: sameAsBilling
            ? customer.billingAddress
            : customer.shippingAddress,
        };
        console.log(finalCustomerData);
        onSubmit(finalCustomerData);
      },
      [customer, sameAsBilling, onSubmit]
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
        title={isEditing ? "Edit Customer" : "Add New Customer"}
        size="xl"
      >
        <form
          onSubmit={handleFormSubmit}
          className="flex flex-col h-[80vh]  py-2"
        >
          <div className="flex-grow overflow-y-auto space-y-4 p-6 pt-2">
            {/* General Information Section */}
            <FormSection title="General Information">
              <FormInput
                label="Customer Name"
                name="name"
                value={customer.name}
                onChange={handleChange}
                placeholder="Enter customer name"
                required
                error={errors.name}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Email"
                  name="email"
                  type="email"
                  value={customer.email}
                  onChange={handleChange}
                  placeholder="customer@example.com"
                  error={errors.email}
                />
                <FormInput
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={customer.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  error={errors.phone}
                />
              </div>
            </FormSection>

            {/* Company Section */}
            <FormSection title="Company & Tax (Optional)">
              <FormInput
                label="Company Name"
                name="companyName"
                value={customer.companyDetails.companyName}
                onChange={handleCompanyChange}
                placeholder="e.g., Acme Corporation"
                isCopyCustomer={
                  customer?.companyDetails?.companyName?.trim() !== ""
                }
                onCopyCustomer={() => {
                  setCustomer((prev) => ({
                    ...prev,
                    name: customer.companyDetails.companyName,
                  }));
                }}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="GSTIN"
                  name="gstin"
                  type=""
                  value={customer.companyDetails.gstin}
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
                  value={customer.other.pan_no}
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
                  value={customer.billingAddress.line1}
                  onChange={handleBillingChange}
                  placeholder="Street, area"
                />
                <FormInput
                  label="Address Line 2"
                  name="line2"
                  value={customer.billingAddress.line2}
                  onChange={handleBillingChange}
                  placeholder="Apartment, suite, etc. (optional)"
                />
                <div className="pb-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                      label="City"
                      name="city"
                      value={customer.billingAddress.city}
                      onChange={handleBillingChange}
                      placeholder="e.g., Mumbai"
                    />
                    <StateDropdown
                      value={customer.billingAddress.state}
                      onChange={(e) =>
                        setCustomer((prev) => {
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
                      value={customer.billingAddress.pincode}
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
              <div className="flex items-center pt-4">
                <input
                  id="sameAsBilling"
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label
                  htmlFor="sameAsBilling"
                  className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                >
                  Shipping address is same as billing
                </label>
              </div>
              <AnimatePresence>
                {!sameAsBilling && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4"
                  >
                    <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">
                      Shipping Address
                    </h3>
                    <FormInput
                      label="Address Line 1"
                      name="line1"
                      value={customer.shippingAddress.line1}
                      onChange={handleShippingChange}
                      placeholder="Street, area"
                    />
                    <FormInput
                      label="Address Line 2"
                      name="line2"
                      value={customer.shippingAddress.line2}
                      onChange={handleShippingChange}
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormInput
                        label="City"
                        name="city"
                        value={customer.shippingAddress.city}
                        onChange={handleShippingChange}
                        placeholder="e.g., Delhi"
                      />
                      <StateDropdown
                        value={customer.shippingAddress.state}
                        onChange={(e) =>
                          setCustomer((prev) => {
                            return {
                              ...prev,
                              shippingAddress: {
                                ...prev.shippingAddress,
                                state: e,
                              },
                            };
                          })
                        }
                      />
                      <FormInput
                        label="Pincode"
                        name="pincode"
                        value={customer.shippingAddress.pincode}
                        onChange={handleShippingChange}
                        placeholder="e.g., 110001"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                      value={customer.account.balance}
                      onChange={handleAccountChange}
                      placeholder="e.g., ₹50000"
                      accountType={customer.account.type}
                    />
                  </div>
                  <ModeSwitch
                    value={customer.account.type}
                    onChange={(mode) =>
                      setCustomer((prev) => {
                        return {
                          ...prev,
                          account: {
                            ...prev.account,
                            type: mode,
                          },
                        };
                      })
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
                    value={customer.other.credit_limit}
                    onChange={handleOtherChange}
                    placeholder="e.g., ₹50000"
                  />
                  <DefalultDueDaysComponent
                    value={customer.other.default_due_date}
                    onChange={(val) =>
                      handleOtherValueChange("other", "default_due_date", val)
                    }
                  />
                  {/* <FormInput
                    label="Default Due Date (in days)"
                    name="default_due_date"
                    type="number"
                    value={customer.other.default_due_date}
                    onChange={handleOtherChange}
                    placeholder="e.g., 30"
                  /> */}
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Warning will be shown when customer is exceeding the credit
                  limit while creating invoice.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={customer.other.notes || ""}
                  onChange={handleOtherChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Any specific notes about the customer..."
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
                          checked={customer.other[taxType] || false}
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
              {isEditing ? "Update Customer" : "Add Customer"}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }
);

export default function Customers() {
  const { customers, fetchCustomers, createCustomer, updateCustomer, loading } =
    useInvoiceStore();
  const { profile } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [formData, setFormData] = useState(initialCustomerState);
  const [errors, setErrors] = useState({});

  const handleCopy = async (name: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${name} copied!`);
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
        await fetchCustomers();
      } catch (error) {
        console.error("Error fetching customers:", error);
        if (error.message?.includes("Google account")) {
          setShowGoogleAuth(true);
        }
      }
    };
    initData();
  }, [profile, fetchCustomers]);

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.name.trim()) newErrors.name = "Customer name is required.";
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

  const handleCreateCustomer = async (customerData) => {
    if (!validateForm(customerData)) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    if (!profile?.google_tokens) {
      setShowGoogleAuth(true);
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, customerData);
        toast.success("Customer updated successfully!");
      } else {
        await createCustomer(customerData);
        toast.success("Customer created successfully!");
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Failed to save customer");
    }
  };

  const handleEdit = (customer) => {
    console.log(customer);
    const customerData = {
      ...initialCustomerState,
      ...customer,
      billingAddress: {
        ...initialCustomerState.billingAddress,
        ...(customer.billingAddress || {}),
      },
      shippingAddress: {
        ...initialCustomerState.shippingAddress,
        ...(customer.shippingAddress || {}),
      },
      companyDetails: {
        ...initialCustomerState.companyDetails,
        ...(customer.companyDetails || {}),
      },
      account: { ...initialCustomerState.account, ...(customer.account || {}) },
      other: { ...initialCustomerState.other, ...(customer.other || {}) },
    };
    setFormData(customerData);
    setEditingCustomer(customer);
    setShowCreateModal(true);
    setErrors({});
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingCustomer(null);
    setFormData(initialCustomerState);
    setErrors({});
  };

  const handleGoogleAuthSuccess = async () => {
    setShowGoogleAuth(false);
    try {
      await fetchCustomers();
      toast.success("Google account connected! You can now manage customers.");
    } catch (error) {
      console.error("Error after Google auth:", error);
      toast.error("Connected to Google but had issues setting up spreadsheet.");
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      customer.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "Active").length;
  const inactiveCustomers = customers.filter(
    (c) => c.status === "Inactive"
  ).length;
  const customersWithGST = customers.filter(
    (c) => c.companyDetails?.gstin && c.companyDetails.gstin.trim()
  ).length;

  const stats = [
    {
      title: "Total Customers",
      value: totalCustomers.toString(),
      icon: UserGroupIcon,
      color: "bg-blue-500",
    },
    {
      title: "Active Customers",
      value: activeCustomers.toString(),
      icon: UserGroupIcon,
      color: "bg-green-500",
    },
    {
      title: "Inactive Customers",
      value: inactiveCustomers.toString(),
      icon: UserGroupIcon,
      color: "bg-red-500",
    },
    {
      title: "GST Registered",
      value: customersWithGST.toString(),
      icon: BuildingOffice2Icon,
      color: "bg-purple-500",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "debit":
        return "text-green-600 dark:text-green-400";
      case "credit":
        return "text-red-500 dark:text-red-400";
      default:
        return "text-gray-800 dark:text-gray-400";
    }
  };

  if (loading && !customers.length) {
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
              Customer Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View, create, and manage your customer database.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Customer
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
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <Button variant="outline" size="sm">
                <FunnelIcon className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </Card>
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Customers ({filteredCustomers.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Closing Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCustomers.map((customer, index) => {
                  const actions = [
                    {
                      label: "View",
                      icon: <Eye className="w-4 h-4" />,
                      onClick: () => alert("View"),
                    },
                    {
                      label: "Edit",
                      icon: <Edit3 className="w-4 h-4" />,
                      onClick: () => {
                        handleEdit(customer);
                      },
                    },
                    {
                      label: "Delete",
                      icon: <Trash2 className="w-4 h-4 text-red-500" />,
                      onClick: () => alert("Delete"),
                    },
                  ];

                  return (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4">
                            <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="text-base font-medium text-gray-900 dark:text-white">
                              {customer.companyDetails?.companyName ||
                                customer.name}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              {customer.companyDetails?.companyName
                                ? customer.name
                                : ""}{" "}
                              <div className="relative group inline-block">
                                <p
                                  className="hover:underline cursor-pointer hover:text-black"
                                  onClick={() =>
                                    handleCopy(
                                      "GSTIN",
                                      customer.companyDetails?.gstin
                                    )
                                  }
                                >
                                  {customer.companyDetails?.gstin || ""}
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
                          {customer.email && (
                            <div className="flex items-center mb-1">
                              <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.phone && (
                            <div className="flex items-center">
                              <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <p
                          className={`px-2 py-1 w-full text-base font-semibold tracking-wide text-right ${getStatusColor(
                            customer.account.type || "debit"
                          )}`}
                        >
                          {formatCurrency(customer.account.balance)}
                          <p className="text-[10px] font-medium">
                            {customer.account.type === "debit"
                              ? "You Pay↑"
                              : "You Collect↓"}
                          </p>
                        </p>
                      </td>
                      <td className="relative px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <OptionsPopup options={actions} />

                        {/* <div className="flex items-center space-x-2">
                        <button className="p-1 text-primary-600 hover:text-primary-900">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1 text-gray-600 hover:text-gray-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-red-600 hover:text-red-900">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div> */}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filterStatus !== "all"
                    ? "No customers match your filters."
                    : "No customers found. Add your first customer."}
                </p>
                {!searchTerm && filterStatus === "all" && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                  >
                    Add Customer
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="p-2 ml-4 flex space-x-4">
            <p className="bg-green-600 px-2  py-1 text-base text-white rounded-lg">
              You Pay ↑{" "}
              <span className="font-medium tracking-wide">
                {formatCurrency(5000)}
              </span>
            </p>
            <p className="bg-red-600 px-2  py-1 text-base text-white rounded-lg">
              You Collect ↓{" "}
              <span className="font-medium tracking-wide">
                {formatCurrency(10000)}
              </span>
            </p>
          </div>
        </Card>
      </div>

      <CustomerFormModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSubmit={handleCreateCustomer}
        initialCustomerData={editingCustomer ? formData : initialCustomerState}
        isEditing={!!editingCustomer}
        loading={loading}
        errors={errors}
      />

      <GoogleAuthModal
        isOpen={showGoogleAuth}
        onClose={() => setShowGoogleAuth(false)}
        onSuccess={handleGoogleAuthSuccess}
      />
    </>
  );
}
