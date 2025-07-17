import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { useSettingsStore } from "../../../store/settings";
import SettingsHeader from "../SettingsHeader";
import Card from "../../ui/Card";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../store/auth";

export default function UserProfileSection() {
  const { loading, errors, setLoading, setError } = useSettingsStore();
  const { profile, updateProfile } = useAuthStore();
  const [formData, setFormData] = useState(profile);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(profile);
    setHasChanges(hasChanges);
  }, [formData, profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading("userProfile", true);
    setError("userProfile", null);

    try {
      await updateProfile(formData);
      toast.success("User profile saved successfully!");
    } catch (error) {
      setError("userProfile", "Failed to save user profile");
      toast.error("Failed to save user profile");
    } finally {
      setLoading("userProfile", false);
    }
  };

  const handleReset = () => {
    setFormData(profile);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleInputChange("avatar", result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (errors.userProfile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error loading user profile</div>
          <button
            onClick={() => setError("userProfile", null)}
            className="text-primary-600 hover:text-primary-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <SettingsHeader
        title="User Profile"
        description="Manage your personal information and preferences"
        onSave={handleSave}
        onReset={handleReset}
        loading={loading.userProfile}
        hasChanges={hasChanges}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl space-y-6"
        >
          {/* Profile Picture */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Profile Picture
            </h3>
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                {formData.profile_img ? (
                  <img
                    src={formData.profile_img}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PhotoIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Upload Photo
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG up to 2MB
                </p>
              </div>
            </div>
          </Card>

          {/* Personal Information */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    handleInputChange("full_name", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 disabled:bg-gray-100 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+91-9876543210"
                />
              </div> */}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
