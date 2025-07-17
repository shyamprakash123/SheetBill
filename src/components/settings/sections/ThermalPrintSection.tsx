// ThermalPrintSettingsSection.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSettingsStore } from "../../../store/settings";
import SettingsHeader from "../SettingsHeader";
import Card from "../../ui/Card";
import toast from "react-hot-toast";

export default function ThermalPrintSettingsSection() {
  const {
    thermalPrintSettings,
    updateThermalPrintSettings,
    loading,
    errors,
    setLoading,
    setError,
  } = useSettingsStore();
  const [formData, setFormData] = useState(thermalPrintSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(thermalPrintSettings);
  }, [thermalPrintSettings]);

  useEffect(() => {
    const changed =
      JSON.stringify(formData) !== JSON.stringify(thermalPrintSettings);
    setHasChanges(changed);
  }, [formData, thermalPrintSettings]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading("thermalSettings", true);
    setError("thermalSettings", null);

    try {
      await updateThermalPrintSettings(formData);
      toast.success("Thermal print settings saved!");
    } catch (error) {
      setError("thermalSettings", "Failed to save");
      toast.error("Failed to save thermal settings");
    } finally {
      setLoading("thermalSettings", false);
    }
  };

  const handleReset = () => setFormData(thermalPrintSettings);

  return (
    <div className="flex-1 flex flex-col">
      <SettingsHeader
        title="Thermal Print Settings"
        description="Configure appearance and info for thermal print"
        onSave={handleSave}
        onReset={handleReset}
        loading={loading.thermalSettings}
        hasChanges={hasChanges}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 max-w-3xl"
        >
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.terms || ""}
                onChange={(e) => handleInputChange("terms", e.target.value)}
                placeholder="Terms & Conditions"
                className="input"
              />
              <input
                type="text"
                value={formData.companyDetails || ""}
                onChange={(e) =>
                  handleInputChange("companyDetails", e.target.value)
                }
                placeholder="Company Details"
                className="input"
              />
              <label>
                <input
                  type="checkbox"
                  checked={formData.showItemDescription}
                  onChange={(e) =>
                    handleInputChange("showItemDescription", e.target.checked)
                  }
                />{" "}
                Show Item Description
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.showHSN}
                  onChange={(e) =>
                    handleInputChange("showHSN", e.target.checked)
                  }
                />{" "}
                Show HSN/SAC
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.showCashReceived}
                  onChange={(e) =>
                    handleInputChange("showCashReceived", e.target.checked)
                  }
                />{" "}
                Show Cash Received
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.showLogo}
                  onChange={(e) =>
                    handleInputChange("showLogo", e.target.checked)
                  }
                />{" "}
                Show Company Logo
              </label>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
