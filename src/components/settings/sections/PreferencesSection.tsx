import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSettingsStore } from "../../../store/settings";
import SettingsHeader from "../SettingsHeader";
import Card from "../../ui/Card";
import toast from "react-hot-toast";
import { useInvoiceStore } from "../../../store/invoice";
import { DefaultDueDaysField } from "../../ui/DefaultDueDaysComponent";
import {
  PrefixSettings,
  PrefixSettingsForm,
} from "../../SubComponents/PrefixSettings";
import AdditionalCharges from "./AdditionalCharges";

function validatePrefixSettings(data: PrefixSettings): {
  isValid: boolean;
  errors: Partial<Record<keyof PrefixSettings, string>>;
} {
  const errors: Partial<Record<keyof PrefixSettings, string>> = {};

  const prefixRegex = /^[A-Z0-9_-]{1,10}$/i; // letters, numbers, dashes, underscores, max 10

  if (!data.invoice_prefix.trim()) {
    errors.invoice_prefix = "Invoice prefix is required";
  } else if (!prefixRegex.test(data.invoice_prefix)) {
    errors.invoice_prefix = "Invalid invoice prefix format";
  }

  if (!data.credit_prefix.trim()) {
    errors.credit_prefix = "Credit note prefix is required";
  } else if (!prefixRegex.test(data.credit_prefix)) {
    errors.credit_prefix = "Invalid credit note prefix format";
  }

  if (!data.purchase_prefix.trim()) {
    errors.purchase_prefix = "Purchase prefix is required";
  } else if (!prefixRegex.test(data.purchase_prefix)) {
    errors.purchase_prefix = "Invalid purchase prefix format";
  }

  if (!data.expenses_prefix.trim()) {
    errors.expenses_prefix = "Expense prefix is required";
  } else if (!prefixRegex.test(data.expenses_prefix)) {
    errors.expenses_prefix = "Invalid expense prefix format";
  }

  if (!data.quotations_prefix.trim()) {
    errors.quotations_prefix = "Quotation prefix is required";
  } else if (!prefixRegex.test(data.quotations_prefix)) {
    errors.quotations_prefix = "Invalid quotation prefix format";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export default function PreferencesSection() {
  const { settings, updatePreferences, loading, fetchAllSettings } =
    useInvoiceStore();
  const [formData, setFormData] = useState(settings.preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const initData = async () => {
      try {
        if (settings) return;
        const fetchedSettings = await fetchAllSettings();
        setFormData(fetchedSettings.preferences);
      } catch (error) {
        console.error("Error initializing sales data:", error);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    setHasChanges(
      JSON.stringify(formData) !== JSON.stringify(settings.preferences)
    );
  }, [formData, settings.preferences]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // setLoading("preferences", true);
    // setError("preferences", null);
    // console.log(formData);
    // return;
    try {
      const { isValid, errors } = validatePrefixSettings(formData);
      if (!isValid) {
        setErrors(errors);
        return;
      }
      await updatePreferences(formData);
      toast.success("Preferences saved successfully!");
    } catch (error) {
      // setError("preferences", "Failed to save preferences");
      toast.error("Failed to save preferences");
    } finally {
      // setLoading("preferences", false);
    }
  };

  const handleReset = () => {
    setFormData(settings.preferences);
    setErrors({});
  };

  return (
    <div className="flex-1 flex flex-col">
      <SettingsHeader
        title="Preferences"
        description="Control default settings for invoices and communication"
        onSave={handleSave}
        onReset={handleReset}
        loading={loading}
        hasChanges={hasChanges}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-flow-row grid-row-1 md:grid-row-2 md:gap-4"
        >
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Invoice Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Round Off
                </label>
                <select
                  value={formData.roundoff}
                  onChange={(e) =>
                    handleInputChange("roundoff", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="false">No</option>
                  <option value="true">YES</option>
                </select>
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Due Days
                </label>
                <select
                  value={formData.defaultDueDays ?? ""}
                  onChange={(e) =>
                    handleInputChange("defaultDueDays", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select Due Days</option>
                  <option value={0}>Same Day</option>
                  <option value={7}>7 Days</option>
                  <option value={15}>15 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                </select>
              </div> */}
              <DefaultDueDaysField
                value={formData.defaultDueDays}
                onChange={(val) => handleInputChange("defaultDueDays", val)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount Type
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) =>
                    handleInputChange("discountType", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="none">None</option>
                  <option value="flat">Flat</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Invoice Prefix
            </h3>
            <PrefixSettingsForm
              value={formData}
              onChange={(updated) =>
                setFormData((prev) => ({ ...prev, ...updated }))
              }
              errors={errors}
            />
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Additional Charges
            </h3>
            <AdditionalCharges
              value={formData.additionalCharges || "[]"}
              onChange={(value) =>
                handleInputChange("additionalCharges", value)
              }
            />
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Email Templates
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Subject
                </label>
                <input
                  type="text"
                  value={formData.emailSubject || ""}
                  onChange={(e) =>
                    handleInputChange("emailSubject", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Invoice from Your Company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Body
                </label>
                <textarea
                  rows={4}
                  value={formData.emailBody || ""}
                  onChange={(e) =>
                    handleInputChange("emailBody", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Dear customer, please find the invoice attached."
                />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
