import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  CreditCard,
  Smartphone,
  DollarSign,
  Plus,
  Trash2,
  Star,
  StarOff,
} from "lucide-react";
import SettingsHeader from "../SettingsHeader";
import Card from "../../ui/Card";
import toast from "react-hot-toast";
import { useInvoiceStore } from "../../../store/invoice";

interface BankAccount {
  id: string;
  bank_name: string;
  bank_branch: string;
  bank_accountHolderName: string;
  bank_accountNumber: string;
  bank_ifscCode: string;
  bank_openingBalance: string;
  bank_upi: string;
  isDefault: boolean;
}

export default function BanksSection() {
  const { settings, updateBank, fetchAllSettings, loading } = useInvoiceStore();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        if (settings) {
          // Parse existing banks data or initialize with empty array
          const existingBanks = settings.banks
            ? JSON.parse(settings.banks.banks)
            : [];
          setBankAccounts(existingBanks);
          return;
        }
        const fetchedSettings = await fetchAllSettings();
        const existingBanks = fetchedSettings.banks
          ? JSON.parse(fetchedSettings.banks.banks)
          : [];
        setBankAccounts(existingBanks);
      } catch (error) {
        console.error("Error initializing banks data:", error);
        setBankAccounts([]);
      }
    };
    initData();
  }, [settings, fetchAllSettings]);

  useEffect(() => {
    const currentBanksString = settings.banks || "[]";
    const formDataString = JSON.stringify(bankAccounts);
    setHasChanges(formDataString !== currentBanksString);
  }, [bankAccounts, settings.banks]);

  const handleInputChange = (
    id: string,
    field: keyof BankAccount,
    value: string | boolean
  ) => {
    setBankAccounts((prev) =>
      prev.map((bank) => (bank.id === id ? { ...bank, [field]: value } : bank))
    );
  };

  const handleSave = async () => {
    try {
      const banksString = JSON.stringify(bankAccounts);
      await updateBank({ banks: banksString });
      toast.success("Bank accounts saved successfully!");
    } catch (error) {
      toast.error("Failed to save bank accounts");
    }
  };

  const handleReset = () => {
    const existingBanks = settings.banks ? JSON.parse(settings.banks) : [];
    setBankAccounts(existingBanks);
  };

  const addBankAccount = () => {
    const newBank: BankAccount = {
      id: Date.now().toString(),
      bank_name: "",
      bank_branch: "",
      bank_accountHolderName: "",
      bank_accountNumber: "",
      bank_ifscCode: "",
      bank_openingBalance: "0",
      bank_upi: "",
      isDefault: bankAccounts.length === 0, // First bank is default
    };
    setBankAccounts((prev) => [...prev, newBank]);
  };

  const removeBankAccount = (id: string) => {
    setBankAccounts((prev) => {
      const filtered = prev.filter((bank) => bank.id !== id);
      // If we removed the default bank, make the first remaining bank default
      if (filtered.length > 0 && !filtered.some((bank) => bank.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const setDefaultBank = (id: string) => {
    setBankAccounts((prev) =>
      prev.map((bank) => ({
        ...bank,
        isDefault: bank.id === id,
      }))
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <SettingsHeader
        title="Bank Accounts"
        description="Manage your bank accounts and payment details"
        onSave={handleSave}
        onReset={handleReset}
        loading={loading}
        hasChanges={hasChanges}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Add Bank Button */}
          <div className="mb-6">
            <button
              onClick={addBankAccount}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Bank Account
            </button>
          </div>

          {/* Bank Accounts List */}
          <div className="space-y-6">
            <AnimatePresence>
              {bankAccounts.map((bank, index) => (
                <motion.div
                  key={bank.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="overflow-hidden border-l-4 border-l-blue-500">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                              <span>Bank Account {index + 1}</span>
                              {bank.isDefault && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                                  <Star className="w-3 h-3 mr-1" />
                                  Default
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {bank.bank_name ||
                                "Configure your bank account information"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!bank.isDefault && (
                            <button
                              onClick={() => setDefaultBank(bank.id)}
                              className="p-2 text-gray-400 hover:text-yellow-500 transition-colors duration-200"
                              title="Set as default"
                            >
                              <StarOff className="w-4 h-4" />
                            </button>
                          )}
                          {bankAccounts.length > 1 && (
                            <button
                              onClick={() => removeBankAccount(bank.id)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                              title="Remove bank account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Bank Information Section */}
                      <div className="mb-8">
                        <div className="flex items-center space-x-2 mb-4">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <h4 className="text-md font-medium text-gray-900 dark:text-white">
                            Bank Information
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Bank Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="e.g., State Bank of India"
                                value={bank.bank_name}
                                onChange={(e) =>
                                  handleInputChange(
                                    bank.id,
                                    "bank_name",
                                    e.target.value
                                  )
                                }
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Branch Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Main Branch, Downtown"
                              value={bank.bank_branch}
                              onChange={(e) =>
                                handleInputChange(
                                  bank.id,
                                  "bank_branch",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Account Details Section */}
                      <div className="mb-8">
                        <div className="flex items-center space-x-2 mb-4">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <h4 className="text-md font-medium text-gray-900 dark:text-white">
                            Account Details
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Account Holder Name{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Full name as per bank records"
                              value={bank.bank_accountHolderName}
                              onChange={(e) =>
                                handleInputChange(
                                  bank.id,
                                  "bank_accountHolderName",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Account Number{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Enter account number"
                              value={bank.bank_accountNumber}
                              onChange={(e) =>
                                handleInputChange(
                                  bank.id,
                                  "bank_accountNumber",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              IFSC Code <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., SBIN0001234"
                              value={bank.bank_ifscCode}
                              onChange={(e) =>
                                handleInputChange(
                                  bank.id,
                                  "bank_ifscCode",
                                  e.target.value.toUpperCase()
                                )
                              }
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200 font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Opening Balance
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                placeholder="0.00"
                                value={bank.bank_openingBalance}
                                onChange={(e) =>
                                  handleInputChange(
                                    bank.id,
                                    "bank_openingBalance",
                                    e.target.value
                                  )
                                }
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* UPI Details Section */}
                      <div>
                        <div className="flex items-center space-x-2 mb-4">
                          <Smartphone className="w-4 h-4 text-gray-500" />
                          <h4 className="text-md font-medium text-gray-900 dark:text-white">
                            UPI Details
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              UPI ID
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., yourname@paytm, 9876543210@upi"
                              value={bank.bank_upi}
                              onChange={(e) =>
                                handleInputChange(
                                  bank.id,
                                  "bank_upi",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {bankAccounts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No bank accounts added
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Add your first bank account to get started with payments and
                transactions.
              </p>
              <button
                onClick={addBankAccount}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Bank Account
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
