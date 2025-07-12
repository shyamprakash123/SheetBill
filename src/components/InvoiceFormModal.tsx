import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useInvoiceStore } from "../store/invoice";
import { useAuthStore } from "../store/auth";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import GoogleAuthModal from "./GoogleAuthModal";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface InvoiceItem {
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

interface InvoiceFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerGSTIN: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  notes: string;
  paymentTerms: string;
}

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: any;
}

export default function InvoiceFormModal({
  isOpen,
  onClose,
  invoice,
}: InvoiceFormModalProps) {
  const {
    customers,
    products,
    createInvoice,
    updateInvoice,
    fetchCustomers,
    fetchProducts,
    loading,
  } = useInvoiceStore();

  const { profile } = useAuthStore();
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<InvoiceFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerGSTIN: "",
    date: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      "yyyy-MM-dd"
    ),
    items: [],
    notes: "",
    paymentTerms: "Net 30",
  });

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gstin: "",
  });

  useEffect(() => {
    if (isOpen && profile?.google_tokens) {
      fetchCustomers();
      fetchProducts();
    }
  }, [isOpen, profile]);

  useEffect(() => {
    if (invoice) {
      setFormData({
        customerName: invoice.customerName || "",
        customerEmail: invoice.customerEmail || "",
        customerPhone: invoice.customerPhone || "",
        customerAddress: invoice.customerAddress || "",
        customerGSTIN: invoice.customerGSTIN || "",
        date: invoice.date || format(new Date(), "yyyy-MM-dd"),
        dueDate:
          invoice.dueDate ||
          format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        items: invoice.items || [],
        notes: invoice.notes || "",
        paymentTerms: invoice.paymentTerms || "Net 30",
      });
    }
  }, [invoice]);

  const generateInvoiceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `INV-${format(new Date(), "yyyyMM")}-${random}`;
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = formData.items.reduce(
      (sum, item) => sum + item.taxAmount,
      0
    );
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleCustomerSelect = (customer: any) => {
    setFormData((prev) => ({
      ...prev,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerGSTIN: customer.gstin || "",
    }));
    setShowCustomerModal(false);
    setHasChanges(true);
  };

  const handleAddItem = (product: any) => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      description: product.description,
      quantity: 1,
      rate: product.price,
      amount: product.price,
      taxRate: parseFloat(product.taxRate) || 18,
      taxAmount: (product.price * (parseFloat(product.taxRate) || 18)) / 100,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setShowProductModal(false);
    setHasChanges(true);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any
  ) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === "quantity" || field === "rate") {
      const item = updatedItems[index];
      item.amount = item.quantity * item.rate;
      item.taxAmount = (item.amount * item.taxRate) / 100;
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }));
    setHasChanges(true);
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Check if Google account is connected
    if (!profile?.google_tokens) {
      setShowGoogleAuth(true);
      return;
    }

    // Validation
    if (!formData.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (formData.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    try {
      const { subtotal, taxAmount, total } = calculateTotals();

      const invoiceData = {
        id: invoice?.id || generateInvoiceNumber(),
        customerId: "",
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        customerGSTIN: formData.customerGSTIN,
        date: formData.date,
        dueDate: formData.dueDate,
        subtotal,
        taxAmount,
        total,
        status: "Draft" as const,
        items: formData.items,
        notes: formData.notes,
        paymentTerms: formData.paymentTerms,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (invoice) {
        await updateInvoice(invoice.id, invoiceData);
        toast.success("Invoice updated successfully!");
      } else {
        await createInvoice(invoiceData);
        toast.success("Invoice created successfully!");
      }

      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice");
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleDiscardConfirm = () => {
    setHasChanges(false);
    setShowDiscardConfirm(false);
    onClose();
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-6xl bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {invoice ? "Edit Invoice" : "Create New Invoice"}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                  <div className="p-6 space-y-8">
                    {/* Invoice Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left Column - Customer & Invoice Info */}
                      <div className="space-y-6">
                        {/* Invoice Number & Dates */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Invoice Details
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Invoice Number
                              </label>
                              <input
                                type="text"
                                value={invoice?.id || generateInvoiceNumber()}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Invoice Date *
                                </label>
                                <input
                                  type="date"
                                  required
                                  value={formData.date}
                                  onChange={(e) =>
                                    handleInputChange("date", e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Due Date *
                                </label>
                                <input
                                  type="date"
                                  required
                                  value={formData.dueDate}
                                  onChange={(e) =>
                                    handleInputChange("dueDate", e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Customer Information
                            </h3>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCustomerModal(true)}
                            >
                              <UserIcon className="h-4 w-4 mr-2" />
                              Select Customer
                            </Button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Customer Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.customerName}
                                onChange={(e) =>
                                  handleInputChange(
                                    "customerName",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Enter customer name"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Email
                                </label>
                                <input
                                  type="email"
                                  value={formData.customerEmail}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "customerEmail",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  placeholder="customer@example.com"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Phone
                                </label>
                                <input
                                  type="tel"
                                  value={formData.customerPhone}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "customerPhone",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  placeholder="+91-9876543210"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Billing Address
                              </label>
                              <textarea
                                rows={3}
                                value={formData.customerAddress}
                                onChange={(e) =>
                                  handleInputChange(
                                    "customerAddress",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Enter billing address"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                GSTIN
                              </label>
                              <input
                                type="text"
                                value={formData.customerGSTIN}
                                onChange={(e) =>
                                  handleInputChange(
                                    "customerGSTIN",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g., 27AABCU9603R1ZX"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Items */}
                      <div className="space-y-6">
                        {/* Line Items */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Line Items
                            </h3>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowProductModal(true)}
                            >
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Add Item
                            </Button>
                          </div>

                          {formData.items.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              <CubeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>
                                No items added yet. Click "Add Item" to get
                                started.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {formData.items.map((item, index) => (
                                <div
                                  key={item.id}
                                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900 dark:text-white">
                                        {item.productName}
                                      </h4>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {item.description}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveItem(index)}
                                      className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Quantity
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          handleItemChange(
                                            index,
                                            "quantity",
                                            parseInt(e.target.value) || 1
                                          )
                                        }
                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Rate (₹)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={item.rate}
                                        onChange={(e) =>
                                          handleItemChange(
                                            index,
                                            "rate",
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Total
                                      </label>
                                      <div className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">
                                        ₹
                                        {(item.amount + item.taxAmount).toFixed(
                                          2
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Tax ({item.taxRate}%): ₹
                                    {item.taxAmount.toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Totals */}
                          {formData.items.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Subtotal:
                                  </span>
                                  <span className="text-gray-900 dark:text-white">
                                    ₹{subtotal.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Tax:
                                  </span>
                                  <span className="text-gray-900 dark:text-white">
                                    ₹{taxAmount.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-600 pt-2">
                                  <span className="text-gray-900 dark:text-white">
                                    Total:
                                  </span>
                                  <span className="text-primary-600 dark:text-primary-400">
                                    ₹{total.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Additional Information */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Additional Information
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Payment Terms
                              </label>
                              <select
                                value={formData.paymentTerms}
                                onChange={(e) =>
                                  handleInputChange(
                                    "paymentTerms",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="Net 15">Net 15</option>
                                <option value="Net 30">Net 30</option>
                                <option value="Net 45">Net 45</option>
                                <option value="Net 60">Net 60</option>
                                <option value="Due on Receipt">
                                  Due on Receipt
                                </option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Notes/Terms
                              </label>
                              <textarea
                                rows={3}
                                value={formData.notes}
                                onChange={(e) =>
                                  handleInputChange("notes", e.target.value)
                                }
                                placeholder="Additional notes or terms..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    loading={loading}
                    disabled={
                      !formData.customerName.trim() ||
                      formData.items.length === 0
                    }
                  >
                    {invoice ? "Update Invoice" : "Save Invoice"}
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Selection Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Select Customer"
        size="lg"
      >
        <div className="space-y-4">
          {customers.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No customers found. Add a new customer below.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Add New Customer
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="email"
                      placeholder="Email"
                      value={newCustomer.email}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={newCustomer.phone}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (newCustomer.name.trim()) {
                        handleCustomerSelect(newCustomer);
                        setNewCustomer({
                          name: "",
                          email: "",
                          phone: "",
                          address: "",
                          gstin: "",
                        });
                      }
                    }}
                    className="w-full"
                    disabled={!newCustomer.name.trim()}
                  >
                    Add & Select Customer
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            customers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => handleCustomerSelect(customer)}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {customer.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {customer.email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {customer.phone}
                    </p>
                  </div>
                  <Button size="sm">Select</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Product Selection Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="Add Product/Service"
        size="lg"
      >
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-8">
              <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No products found. Please add products in the Inventory section
                first.
              </p>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                onClick={() => handleAddItem(product)}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.description}
                    </p>
                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      ₹{product.price} • Tax: {product.taxRate || "18%"}
                    </p>
                  </div>
                  <Button size="sm">Add</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Discard Confirmation Modal */}
      <Modal
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        title="Discard Changes"
      >
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-900 dark:text-white">
              Are you sure you want to discard this invoice? All unsaved changes
              will be lost.
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowDiscardConfirm(false)}
          >
            Keep Editing
          </Button>
          <Button variant="danger" onClick={handleDiscardConfirm}>
            Discard Changes
          </Button>
        </div>
      </Modal>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={showGoogleAuth}
        onClose={() => setShowGoogleAuth(false)}
        onSuccess={() => {
          setShowGoogleAuth(false);
          toast.success("Google account connected! You can now save invoices.");
        }}
      />
    </>
  );
}
