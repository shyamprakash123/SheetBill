import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSettingsStore } from "../../../store/settings";
import SettingsHeader from "../SettingsHeader";
import Card from "../../ui/Card";
import toast from "react-hot-toast";
import { useInvoiceStore } from "../../../store/invoice";

export default function NotesTermsSection() {
  const { settings, updateNotesTerms, fetchAllSettings, loading } =
    useInvoiceStore();
  const [formData, setFormData] = useState(settings.notesTerms);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        if (settings) return;
        const fetchedSettings = await fetchAllSettings();
        setFormData(fetchedSettings.notesTerms);
        console.log("Settings", settings);
      } catch (error) {
        console.error("Error initializing sales data:", error);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    const hasChanges =
      JSON.stringify(formData) !== JSON.stringify(settings.notesTerms);
    setHasChanges(hasChanges);
  }, [formData, settings.notesTerms]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // setLoading("notesTerms", true);
    // setError("notesTerms", null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateNotesTerms(formData);
      toast.success("Notes & Terms saved successfully!");
    } catch (error) {
      // setError("notesTerms", "Failed to save Notes & Terms");
      toast.error("Failed to save Notes & Terms");
    } finally {
      // setLoading("notesTerms", false);
    }
  };

  function formatLabel(section: string) {
    return section
      .replace(/_/g, " ")
      .replace(
        /\w\S*/g,
        (txt) => txt[0].toUpperCase() + txt.slice(1).toLowerCase()
      );
  }

  const handleReset = () => {
    setFormData(settings.notesTerms);
  };

  const sections = [
    "invoice_notes",
    "sales_return_notes",
    "purchase_notes",
    "purchase_return_notes",
    "purchase_order_notes",
    "quotation_notes",
    "delivery_notes",
    "proforma_notes",
  ];

  return (
    <div className="flex-1 flex flex-col">
      <SettingsHeader
        title="Notes & Terms"
        description="Set default notes and terms for your documents"
        onSave={handleSave}
        onReset={handleReset}
        loading={loading}
        hasChanges={hasChanges}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {sections.map((section) => (
            <Card key={section}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                {formatLabel(section)}
              </h3>
              <textarea
                rows={3}
                value={formData[section] || ""}
                onChange={(e) => handleInputChange(section, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              ></textarea>
            </Card>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
