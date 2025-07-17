// SignaturesSection.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSettingsStore } from "../../../store/settings";
import SettingsHeader from "../SettingsHeader";
import Card from "../../ui/Card";
import toast from "react-hot-toast";
import { GoogleDriveService } from "../../../lib/google-drive";
import { useInvoiceStore } from "../../../store/invoice";
import { useAuthStore } from "../../../store/auth";

export default function SignaturesSection() {
  const { getGoogleTokens } = useAuthStore();
  const { settings, updateSignatures, fetchAllSettings, loading } =
    useInvoiceStore();
  const [formData, setFormData] = useState(settings.signatures);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        if (settings) return;
        const fetchedSettings = await fetchAllSettings();
        setFormData(fetchedSettings.signatures);
      } catch (error) {
        console.error("Error initializing sales data:", error);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    setHasChanges(
      JSON.stringify(formData) !== JSON.stringify(settings.signatures)
    );
  }, [formData, settings.signatures]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // const handleAdd = () => {
  //   setFormData([...formData, { name: "", image: "" }]);
  // };

  // const handleRemove = (index: number) => {
  //   setFormData(formData.filter((_, i) => i !== index));
  // };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.error("No file selected");
      return;
    }

    try {
      const googleTokens = await getGoogleTokens(); // include refresh logic
      const drive = new GoogleDriveService(googleTokens.access_token);

      const uploadedFile = await drive.uploadFile(file, {
        name: file.name,
        // parents: ["<FOLDER_ID>"], // optional
      });

      // Optional: Make it public
      await drive.makeFilePublic(uploadedFile.id);

      const publicLink = uploadedFile.webViewLink;
      console.log("Logo Link", publicLink);

      if (publicLink) handleInputChange("image", publicLink);

      // Optional: Write to spreadsheet
      // await writeToSpreadsheet({ name: file.name, url: publicLink });
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  function getImageUrl(url: string): string | null {
    if (!url) return null;
    const regex = /\/d\/([a-zA-Z0-9_-]{10,})/;
    const match = url.match(regex);
    const fileId = match ? match[1] : null;
    // return `https://drive.google.com/file/d/${fileId}/preview`;
    return `https://drive.google.com/thumbnail?id=${fileId}`;
    // return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  const handleSave = async () => {
    // setLoading("signatures", true);
    // setError("signatures", null);
    try {
      await updateSignatures(formData);
      toast.success("Signatures saved!");
    } catch {
      // setError("signatures", "Failed to save");
      toast.error("Error saving signatures");
    } finally {
      // setLoading("signatures", false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <SettingsHeader
        title="Signatures"
        description="Add or update authorized signatures"
        onSave={handleSave}
        onReset={() => setFormData(settings.signatures)}
        loading={loading}
        hasChanges={hasChanges}
      />

      <div className="p-6 space-y-6">
        <Card>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Upload Signature</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Upload
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                PNG, JPG up to 2MB
              </p>
              {formData.image && (
                <img
                  src={getImageUrl(formData.image)}
                  alt="Your Image Alt Text"
                />
              )}
            </div>
          </div>
          {/* <button
              onClick={() => handleRemove(index)}
              className="text-red-600 text-sm mt-2 hover:underline"
            >
              Remove
            </button> */}
        </Card>
        {/* <button
          onClick={handleAdd}
          className="text-primary-600 font-medium hover:underline"
        >
          + Add Signature
        </button> */}
      </div>
    </div>
  );
}
