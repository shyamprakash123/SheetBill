import React, { useState } from "react";
import {
  Banknote,
  PlusIcon,
  TrashIcon,
  CreditCardIcon,
  Banknote as CashIcon,
} from "lucide-react";
import { PaymentMode, BankAccount } from "../../types/payments";
import SearchableDropdown from "../ui/SearchableDropdown";

interface PaymentSectionProps {
  bankAccount?: BankAccount;
  bankAccounts: BankAccount[];
  markedAsPaid: boolean;
  paymentNotes?: string;
  paymentModes: PaymentMode[];
  totalAmount: number;
  onBankAccountChange: (bankAccount?: BankAccount) => void;
  onMarkedAsPaidChange: (markedAsPaid: boolean) => void;
  onPaymentNotesChange: (notes: string) => void;
  onPaymentModesChange: (paymentModes: PaymentMode[]) => void;
  onAddBankAccount?: () => void;
  errors?: Record<string, string>;
}

const PAYMENT_METHODS = [
  { value: "UPI", label: "UPI", icon: "📱" },
  { value: "CASH", label: "Cash", icon: "💵" },
  { value: "CARD", label: "Card", icon: "💳" },
  { value: "NET_BANKING", label: "Net Banking", icon: "🏦" },
  { value: "CHEQUE", label: "Cheque", icon: "📝" },
  { value: "EMI", label: "EMI", icon: "📊" },
] as const;

export default function PaymentSection({
  bankAccount,
  bankAccounts,
  markedAsPaid,
  paymentNotes,
  paymentModes,
  totalAmount,
  onBankAccountChange,
  onMarkedAsPaidChange,
  onPaymentNotesChange,
  onPaymentModesChange,
  onAddBankAccount,
  errors = {},
}: PaymentSectionProps) {
  const addPaymentMode = () => {
    const newPaymentMode: PaymentMode = {
      id: Date.now().toString(),
      notes: "",
      amount: 0,
      paymentMethod: "UPI",
    };
    onPaymentModesChange([...paymentModes, newPaymentMode]);
  };

  const updatePaymentMode = (id: string, updates: Partial<PaymentMode>) => {
    const updatedModes = paymentModes.map((mode) =>
      mode.id === id ? { ...mode, ...updates } : mode
    );
    onPaymentModesChange(updatedModes);
  };

  const removePaymentMode = (id: string) => {
    const updatedModes = paymentModes.filter((mode) => mode.id !== id);
    onPaymentModesChange(updatedModes);
  };

  const handleMarkedAsPaidChange = (checked: boolean) => {
    onMarkedAsPaidChange(checked);
    if (checked) {
      // Reset split payments when marked as fully paid
      onPaymentModesChange([]);
    }
  };

  const totalPaidAmount = paymentModes.reduce(
    (sum, mode) => sum + mode.amount,
    0
  );
  const remainingAmount = totalAmount - totalPaidAmount;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
        <CashIcon className="h-5 w-5 mr-2" />
        Payment & Bank Information
      </h2>

      <div className="space-y-6">
        {/* Bank Account Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Bank Account
          </label>
          <SearchableDropdown
            options={bankAccounts}
            value={bankAccount}
            onChange={(entity) => {
              onBankAccountChange(entity);
            }}
            placeholder="Select bank account"
            displayKey="name"
            onAddNew={onAddBankAccount}
            addNewLabel="Add New Bank"
            icon={CashIcon}
            onRemoveOption={() => onBankAccountChange(null)}
          />
          {/* <div className="relative">
            <select
              value={bankAccount?.id || ""}
              onChange={(e) => {
                const selected = bankAccounts.find(
                  (acc) => acc.id === e.target.value
                );
                onBankAccountChange(selected);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            >
              <option value="">Select bank account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.accountNumber}
                </option>
              ))}
            </select>
          </div> */}
          {bankAccount && bankAccount.id !== "cash" && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-900">
                <div className="font-medium">
                  {bankAccount.others?.bank_name}
                </div>
                <div className="text-gray-600">Account: {bankAccount.id}</div>
                <div className="text-gray-600">
                  IFSC: {bankAccount.others?.bank_ifscCode} | Branch:{" "}
                  {bankAccount.others?.bank_branch}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="marked-paid"
            checked={markedAsPaid}
            onChange={(e) => handleMarkedAsPaidChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="marked-paid"
            className="text-sm font-medium text-gray-700"
          >
            Mark as Fully Paid
          </label>
        </div>

        {/* Payment Modes Section */}
        {!markedAsPaid && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900">
                Payment Modes
              </h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={addPaymentMode}
                  className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Payment
                </button>
              </div>
            </div>

            {/* Payment Summary */}
            {paymentModes.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-medium text-green-600">
                    ₹{totalPaidAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-1 mt-1">
                  <span className="text-gray-600">Remaining:</span>
                  <span
                    className={`font-medium ${
                      remainingAmount > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    ₹{remainingAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Mode List */}
            <div className="space-y-4">
              {paymentModes.map((mode, index) => (
                <div
                  key={mode.id}
                  className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 shadow-sm bg-white dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Payment Mode #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removePaymentMode(mode.id)}
                      className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Notes
                        <span
                          className="text-gray-400 ml-1"
                          title="Remarks about the payment such as UTR, advance note, etc."
                        >
                          (?)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={mode.notes}
                        onChange={(e) =>
                          updatePaymentMode(mode.id, { notes: e.target.value })
                        }
                        placeholder="e.g., UTR ref, Advance, etc."
                        className="w-full px-3 py-2 text-sm border rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Amount <span className="text-gray-400">(₹)</span>
                        {errors[`payment_${index}_amount`] && (
                          <span className="text-red-500 text-xs ml-2">
                            {errors[`payment_${index}_amount`]}
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="1"
                        min={0}
                        value={mode.amount || ""}
                        onChange={(e) =>
                          updatePaymentMode(mode.id, {
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                          errors[`payment_${index}_amount`]
                            ? "border-red-300 dark:border-red-600 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                        }`}
                      />
                      {/* <input
                        type="text"
                        value={mode.amount}
                        onChange={(e) =>
                          updatePaymentMode(mode.id, {
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                        min="0"
                        className="w-full px-3 py-2 text-sm border rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                      /> */}
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Payment Method
                        {errors[`payment_${index}_method`] && (
                          <span className="text-red-500 text-xs ml-2">
                            {errors[`payment_${index}_method`]}
                          </span>
                        )}
                      </label>
                      <select
                        value={mode.paymentMethod}
                        onChange={(e) =>
                          updatePaymentMode(mode.id, {
                            paymentMethod: e.target
                              .value as PaymentMode["paymentMethod"],
                          })
                        }
                        className={`w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 bg-white dark:text-white ${
                          errors[`payment_${index}_method`]
                            ? "border-red-300 dark:border-red-600"
                            : "border-gray-300"
                        }`}
                      >
                        <option disabled value="">
                          Select Method
                        </option>
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General Payment Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Notes
          </label>
          <textarea
            value={paymentNotes || ""}
            onChange={(e) => onPaymentNotesChange(e.target.value)}
            placeholder="Add payment instructions, terms, or notes..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
