import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusIcon,
  TrashIcon,
  UserIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import {
  Invoice,
  InvoiceItem,
  Customer,
  Product,
} from "../lib/backend-service";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import { format } from "date-fns";

interface InvoiceFormProps {
  invoice?: Invoice;
  customers: Customer[];
  products: Product[];
  onSave: (
    invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function InvoiceForm({
  invoice,
  customers,
  products,
  onSave,
  onCancel,
  loading = false,
}: InvoiceFormProps) {
  const [formData, setFormData] = useState({
    customerId: invoice?.customerId || "",
    customerName: invoice?.customerName || "",
    customerEmail: invoice?.customerEmail || "",
    customerPhone: invoice?.customerPhone || "",
    customerAddress: invoice?.customerAddress || "",
    customerGSTIN: invoice?.customerGSTIN || "",
    date: invoice?.date || format(new Date(), "yyyy-MM-dd"),
    dueDate:
      invoice?.dueDate ||
      format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    status: invoice?.status || ("Draft" as const),
    notes: invoice?.notes || "",
    paymentTerms: invoice?.paymentTerms || "Net 30",
    items: invoice?.items || ([] as InvoiceItem[]),
  });

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = formData.items.reduce(
    (sum, item) => sum + item.taxAmount,
    0
  );
  const total = subtotal + taxAmount;

  const handleCustomerSelect = (customer: Customer) => {
    setFormData((prev) => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerGSTIN: customer.gstin || "",
    }));
    setShowCustomerModal(false);
  };

  const handleAddItem = (product: Product) => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      description: product.description,
      quantity: 1,
      rate: product.price,
      amount: product.price,
      taxRate: product.taxRate,
      taxAmount: (product.price * product.taxRate) / 100,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setShowProductModal(false);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any
  ) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate amounts when quantity or rate changes
    if (field === "quantity" || field === "rate") {
      const item = updatedItems[index];
      item.amount = item.quantity * item.rate;
      item.taxAmount = (item.amount * item.taxRate) / 100;
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      alert("Please add at least one item to the invoice");
      return;
    }

    await onSave({
      ...formData,
      subtotal,
      taxAmount,
      total,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {invoice ? "Edit Invoice" : "Create New Invoice"}
          </h2>
          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {invoice ? "Update Invoice" : "Create Invoice"}
            </Button>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerName: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerEmail: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  setFormData((prev) => ({
                    ...prev,
                    customerPhone: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  setFormData((prev) => ({
                    ...prev,
                    customerGSTIN: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                rows={3}
                value={formData.customerAddress}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerAddress: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Invoice Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invoice Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
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
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as any,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Items
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
              <p>No items added yet. Click "Add Item" to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Item
                    </th>
                    <th className="text-center py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Qty
                    </th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Rate
                    </th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Amount
                    </th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tax
                    </th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      <td className="py-3">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.productName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.description}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center">
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
                          className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </td>
                      <td className="py-3 text-right">
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
                          className="w-24 px-2 py-1 text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </td>
                      <td className="py-3 text-right text-gray-900 dark:text-white">
                        ₹{item.amount.toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-gray-900 dark:text-white">
                        ₹{item.taxAmount.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900 dark:text-white">
                        ₹{(item.amount + item.taxAmount).toFixed(2)}
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          {formData.items.length > 0 && (
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                  <span className="text-gray-900 dark:text-white">
                    ₹{taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Additional Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Terms
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentTerms: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes or terms..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Customer Selection Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Select Customer"
        size="lg"
      >
        <div className="space-y-4">
          {customers?.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No customers found. Please add customers first.
            </p>
          ) : (
            customers?.map((customer) => (
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
        title="Add Product"
        size="lg"
      >
        <div className="space-y-4">
          {products?.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No products found. Please add products first.
            </p>
          ) : (
            products?.map((product) => (
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
                      ₹{product.price}
                    </p>
                  </div>
                  <Button size="sm">Add</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
