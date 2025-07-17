import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSettingsStore } from "../../../store/settings";
import SettingsHeader from "../SettingsHeader";
import Card from "../../ui/Card";
import toast from "react-hot-toast";
import { useInvoiceStore } from "../../../store/invoice";

export default function BanksSection() {
  const { settings, updateBank, fetchAllSettings, loading } = useInvoiceStore();
  const [formData, setFormData] = useState(settings.banks || []);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        if (settings) return;
        const fetchedSettings = await fetchAllSettings();
        setFormData(fetchedSettings.banks);
      } catch (error) {
        console.error("Error initializing sales data:", error);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    setHasChanges(JSON.stringify(formData) !== JSON.stringify(settings.banks));
  }, [formData, settings.banks]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // setLoading("banks", true);
    // setError("banks", null);

    try {
      await updateBank(formData);
      toast.success("Bank details saved successfully!");
    } catch (error) {
      // setError("banks", "Failed to save bank details");
      toast.error("Failed to save bank details");
    } finally {
      // setLoading("banks", false);
    }
  };

  const handleReset = () => {
    setFormData(settings.banks);
  };

  // const addBank = () => {
  //   setFormData([
  //     ...formData,
  //     {
  //       holderName: "",
  //       accountNumber: "",
  //       ifsc: "",
  //       branch: "",
  //       upi: "",
  //       upiNumber: "",
  //       openingBalance: "",
  //       default: false,
  //     },
  //   ]);
  // };

  return (
    <div className="flex-1 flex flex-col">
      <SettingsHeader
        title="Banks"
        description="Manage your bank and payment details"
        onSave={handleSave}
        onReset={handleReset}
        loading={loading}
        hasChanges={hasChanges}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Bank
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Holder Name"
                value={formData.bank_accountHolderName}
                onChange={(e) =>
                  handleInputChange("bank_accountHolderName", e.target.value)
                }
                className="input"
              />
              <input
                type="text"
                placeholder="Account Number"
                value={formData.bank_accountNumber}
                onChange={(e) =>
                  handleInputChange("bank_accountNumber", e.target.value)
                }
                className="input"
              />
              <input
                type="text"
                placeholder="IFSC Code"
                value={formData.bank_ifscCode}
                onChange={(e) =>
                  handleInputChange("bank_ifscCode", e.target.value)
                }
                className="input"
              />
              <input
                type="text"
                placeholder="Branch Name"
                value={formData.bank_branch}
                onChange={(e) =>
                  handleInputChange("bank_branch", e.target.value)
                }
                className="input"
              />
              <input
                type="text"
                placeholder="UPI ID"
                value={formData.bank_upi}
                onChange={(e) => handleInputChange("bank_upi", e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Opening Balance"
                value={formData.bank_openingBalance}
                onChange={(e) =>
                  handleInputChange("openingBalance", e.target.value)
                }
                className="input"
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
