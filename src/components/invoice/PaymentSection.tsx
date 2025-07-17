import React from "react";
import { BanknotesIcon, PlusIcon } from "@heroicons/react/24/outline";
import { BankAccount } from "../../types/invoice";
import SearchableDropdown from "../ui/SearchableDropdown";
import Button from "../ui/Button";

interface PaymentSectionProps {
  bankAccount?: BankAccount;
  bankAccounts: BankAccount[];
  markedAsPaid: boolean;
  paymentNotes?: string;
  onBankAccountChange: (bankAccount?: BankAccount) => void;
  onMarkedAsPaidChange: (markedAsPaid: boolean) => void;
  onPaymentNotesChange: (notes: string) => void;
  onAddBankAccount?: () => void;
}

export default function PaymentSection({
  bankAccount,
  bankAccounts,
  markedAsPaid,
  paymentNotes,
  onBankAccountChange,
  onMarkedAsPaidChange,
  onPaymentNotesChange,
  onAddBankAccount,
}: PaymentSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
        <BanknotesIcon className="h-5 w-5 mr-2" />
        Payment & Bank Information
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Account Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Bank Account
          </label>
          <SearchableDropdown
            options={bankAccounts}
            value={bankAccount}
            onChange={onBankAccountChange}
            placeholder="Select bank account"
            displayKey="name"
            onAddNew={onAddBankAccount}
            addNewLabel="Add New Bank Account"
          />
          {bankAccount && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-900 dark:text-gray-100">
                <div className="font-medium">{bankAccount.name}</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Account: {bankAccount.accountNumber}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  IFSC: {bankAccount.ifsc} | Branch: {bankAccount.branch}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              id="marked-paid"
              checked={markedAsPaid}
              onChange={(e) => onMarkedAsPaidChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="marked-paid"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Mark as Fully Paid
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Notes
            </label>
            <textarea
              value={paymentNotes || ""}
              onChange={(e) => onPaymentNotesChange(e.target.value)}
              placeholder="Add payment instructions, terms, or notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
