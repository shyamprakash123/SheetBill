import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SettingsHeader from "../SettingsHeader";
import Card from "../../ui/Card";
import toast from "react-hot-toast";
import { useInvoiceStore } from "../../../store/invoice";
import { useAuthStore } from "../../../store/auth";
import { GoogleDriveService } from "../../../lib/google-drive";
import { CompanyDetails } from "../../../lib/backend-service";

export default function CompanyDetailsSection() {
  const { settings, updateCompanyDetails, loading, fetchAllSettings } =
    useInvoiceStore();
  const { getGoogleTokens } = useAuthStore.getState();
  const [formData, setFormData] = useState(settings.companyDetails);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});
  const [sameAsBilling, setSameAsBilling] = useState(false);

  function validateCompanyDetails(details: CompanyDetails): {
    valid: boolean;
    errors: Partial<Record<keyof CompanyDetails, string>>;
  } {
    const errors: Partial<Record<keyof CompanyDetails, string>> = {};

    // GSTIN and PAN
    if (
      details.gstin.trim() &&
      !details.gstin.match(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/
      )
    )
      errors.gstin = "Invalid GSTIN format";
    if (details.pan.trim() && !details.pan.match(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/))
      errors.pan = "Invalid PAN format";

    // Email and phone
    if (!details.email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/))
      errors.email = "Invalid email address";
    if (!details.phone.match(/^\d{10}$/))
      errors.phone = "Invalid phone number (10 digits)";

    // Website
    if (
      details.website.trim() &&
      !details.website.match(/^https?:\/\/[\w.-]+\.[a-z]{2,}$/i)
    )
      errors.website = "Invalid website URL";

    // Helper: check if any billing field is filled
    const isBillingFilled =
      details.billing_address.trim() ||
      details.billing_city.trim() ||
      details.billing_state.trim() ||
      details.billing_pincode.trim();

    if (isBillingFilled) {
      if (!details.billing_address.trim())
        errors.billing_address = "Billing address is required";
      if (!details.billing_city.trim())
        errors.billing_city = "Billing city is required";
      if (!details.billing_state.trim())
        errors.billing_state = "Billing state is required";
      if (!details.billing_pincode.match(/^\d{6}$/))
        errors.billing_pincode = "Billing pincode must be 6 digits";
      if (!details.billing_country.trim())
        errors.billing_country = "Billing country is required";
    }

    // Helper: check if any shipping field is filled
    const isShippingFilled =
      details.shipping_address.trim() ||
      details.shipping_city.trim() ||
      details.shipping_state.trim() ||
      details.shipping_pincode.trim();

    if (isShippingFilled) {
      if (!details.shipping_address.trim())
        errors.shipping_address = "Shipping address is required";
      if (!details.shipping_city.trim())
        errors.shipping_city = "Shipping city is required";
      if (!details.shipping_state.trim())
        errors.shipping_state = "Shipping state is required";
      if (!details.shipping_pincode.match(/^\d{6}$/))
        errors.shipping_pincode = "Shipping pincode must be 6 digits";
      if (!details.shipping_country.trim())
        errors.shipping_country = "Shipping country is required";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  useEffect(() => {
    const initData = async () => {
      try {
        if (settings) return;
        const fetchedSettings = await fetchAllSettings();
        setFormData(fetchedSettings.companyDetails);
        console.log("Settings", settings);
      } catch (error) {
        console.error("Error initializing sales data:", error);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    const hasChanges =
      JSON.stringify(formData) !== JSON.stringify(settings.companyDetails);
    setHasChanges(hasChanges);
  }, [formData, settings.companyDetails]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const { valid, errors } = validateCompanyDetails(formData);
      if (!valid) {
        setErrors(errors);
        return;
      }
      setErrors({});
      await updateCompanyDetails(formData);
      toast.success("Company details saved successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Failed to save company details");
    }
  };

  const handleReset = () => {
    setFormData(settings.companyDetails);
    setErrors({});
  };

  function handleSameAsBillingChange(checked: boolean) {
    setSameAsBilling(checked);

    if (checked) {
      setFormData((prev: CompanyDetails) => ({
        ...prev,
        shipping_address: prev.billing_address,
        shipping_city: prev.billing_city,
        shipping_state: prev.billing_state,
        shipping_pincode: prev.billing_pincode,
        shipping_country: prev.billing_country,
      }));
    }
  }

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

      if (publicLink) handleInputChange("logo", publicLink);

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

  // const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       const result = e.target?.result as string;
  //       handleInputChange("logo", result);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  //   if (errors.companyDetails) {
  //     return (
  //       <div className="flex-1 flex items-center justify-center">
  //         <div className="text-center">
  //           <div className="text-red-500 mb-4">Error loading company details</div>
  //           <button
  //             onClick={() => setError("companyDetails", null)}
  //             className="text-primary-600 hover:text-primary-700"
  //           >
  //             Try again
  //           </button>
  //         </div>
  //       </div>
  //     );
  //   }

  return (
    <div>
      <SettingsHeader
        title="Company Details"
        description="Manage your company information and branding"
        onSave={handleSave}
        onReset={handleReset}
        loading={loading}
        hasChanges={hasChanges}
      />

      <div className="overflow-y-auto p-0 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-flow-row grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Company Logo */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Company Logo
            </h3>
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                {/* {formData.logo ? (
                  <img
                    src={getImageUrl(formData.logo)}
                    alt="Company Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <iframe
                    src={getImageUrl(formData.logo)}
                    width="300"
                    height="300"
                  ></iframe>
                  <PhotoIcon className="h-8 w-8 text-gray-400" />
                )} */}

                <img
                  src={getImageUrl(formData.logo)}
                  alt="Your Image Alt Text"
                ></img>
                {/* <img
                  src={getImageUrl(formData.logo)}
                  alt="Company Logo"
                  className="w-full h-full object-cover"
                /> */}
                {/* <iframe
                  src={getImageUrl(formData.logo)}
                  className="scale-40 origin-top-left w-[800px] h-[600px] border-none"
                ></iframe> */}
              </div>
              <div>
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
                  Upload Logo
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG up to 2MB
                </p>
              </div>
            </div>
          </Card>

          {/* Basic Information */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter company name"
                />
                {errors.name && (
                  <span className="text-red-500 text-sm">{errors.name}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="company@example.com"
                />
                {errors.email && (
                  <span className="text-red-500 text-sm">{errors.email}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+91-9876543210"
                />
                {errors.phone && (
                  <span className="text-red-500 text-sm">{errors.phone}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://company.com"
                />
                {errors.website && (
                  <span className="text-red-500 text-sm">{errors.website}</span>
                )}
              </div>
            </div>
          </Card>

          {/* Billing Information */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Billing Address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.billing_address}
                  onChange={(e) =>
                    handleInputChange("billing_address", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus: border-transparent"
                  placeholder="Enter complete address"
                />
                {errors.billing_address && (
                  <span className="text-red-500 text-sm">
                    {errors.billing_address}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.billing_city}
                    onChange={(e) =>
                      handleInputChange("billing_city", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="City"
                  />
                  {errors.billing_city && (
                    <span className="text-red-500 text-sm">
                      {errors.billing_city}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.billing_state}
                    onChange={(e) =>
                      handleInputChange("billing_state", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="State"
                  />
                  {errors.billing_state && (
                    <span className="text-red-500 text-sm">
                      {errors.billing_state}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formData.billing_pincode}
                    onChange={(e) =>
                      handleInputChange("billing_pincode", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="123456"
                  />
                  {errors.billing_pincode && (
                    <span className="text-red-500 text-sm">
                      {errors.billing_pincode}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <select
                  value={formData.billing_country}
                  disabled
                  onChange={(e) =>
                    handleInputChange("billing_country", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:bg-gray-100 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
                {errors.billing_country && (
                  <span className="text-red-500 text-sm">
                    {errors.billing_country}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Shipping Information */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Shipping Address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.shipping_address}
                  onChange={(e) =>
                    handleInputChange("shipping_address", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus: border-transparent"
                  placeholder="Enter complete address"
                />
                {errors.shipping_address && (
                  <span className="text-red-500 text-sm">
                    {errors.shipping_address}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.shipping_city}
                    onChange={(e) =>
                      handleInputChange("shipping_city", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="City"
                  />
                  {errors.shipping_city && (
                    <span className="text-red-500 text-sm">
                      {errors.shipping_city}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.shipping_state}
                    onChange={(e) =>
                      handleInputChange("shipping_state", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="State"
                  />
                  {errors.shipping_state && (
                    <span className="text-red-500 text-sm">
                      {errors.shipping_state}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formData.shipping_pincode}
                    onChange={(e) =>
                      handleInputChange("shipping_pincode", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="123456"
                  />
                  {errors.shipping_pincode && (
                    <span className="text-red-500 text-sm">
                      {errors.shipping_pincode}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <select
                  value={formData.shipping_country}
                  disabled
                  onChange={(e) =>
                    handleInputChange("shipping_country", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:bg-gray-100 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
                {errors.shipping_country && (
                  <span className="text-red-500 text-sm">
                    {errors.shipping_country}
                  </span>
                )}
              </div>
              <label className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  disabled={
                    formData.billing_address?.trim() === "" ||
                    formData.billing_city?.trim() === "" ||
                    formData.billing_state?.trim() === "" ||
                    formData.billing_pincode?.trim() === ""
                  }
                  checked={sameAsBilling}
                  onChange={(e) => handleSameAsBillingChange(e.target.checked)}
                  className="form-checkbox"
                />
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  Same as billing address
                </span>
              </label>
            </div>
          </Card>

          {/* Tax Information */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tax Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700  dark:text-gray-300 mb-2">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => handleInputChange("gstin", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 27AABCU9603R1ZX"
                />
                {errors.gstin && (
                  <span className="text-red-500 text-sm">{errors.gstin}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PAN
                </label>
                <input
                  type="text"
                  value={formData.pan}
                  onChange={(e) => handleInputChange("pan", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., AABCU9603R"
                />
                {errors.pan && (
                  <span className="text-red-500 text-sm">{errors.pan}</span>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
