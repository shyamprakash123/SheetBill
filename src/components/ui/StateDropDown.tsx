import React from "react";
import Select from "react-select";

export const gstStates = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman & Diu" },
  { code: "26", name: "Dadra & Nagar Haveli" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh (Old)" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman & Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh (New)" },
  { code: "38", name: "Ladakh" },
];

// Define the shape of our state object for TypeScript
interface StateOption {
  code: string;
  name: string;
}

interface StateDropdownProps {
  value: StateOption | null;
  onChange: (selectedOption: StateOption | null) => void;
}

export default function StateDropdown({ value, onChange }: StateDropdownProps) {
  // Custom function to format the label inside the dropdown
  const formatOptionLabel = ({ code, name }: StateOption) => (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ marginRight: "10px", color: "#888" }}>{code}</span>
      <span>{name}</span>
    </div>
  );

  return (
    <div className="w-full max-w-md">
      <label className="block mb-2 text-sm font-medium text-gray-700">
        State *
      </label>
      <Select<StateOption>
        value={value && JSON.parse(value)}
        onChange={onChange}
        options={gstStates}
        // Map state object properties to what react-select expects
        getOptionValue={(option) => option.code}
        getOptionLabel={(option) => `${option.code} - ${option.name}`}
        formatOptionLabel={formatOptionLabel}
        isClearable
        isSearchable
        placeholder="e.g, 36 Telangana"
        // Apply custom styles using the react-select API
        styles={{
          control: (base) => ({
            ...base,
            border: "1px solid #d1d5db", // gray-300
            borderRadius: "0.5rem", // rounded-lg
            boxShadow: "none",
            "&:hover": {
              borderColor: "#a5b4fc", // hover:border-indigo-300
            },
          }),
          option: (base, { isFocused, isSelected }) => ({
            ...base,
            backgroundColor: isSelected
              ? "#3b82f6"
              : isFocused
              ? "#eff6ff"
              : "white", // selected:bg-blue-500, focused:bg-blue-50
            color: isSelected ? "white" : "#1f2937", // text-gray-800
            ":active": {
              backgroundColor: isSelected ? "#3b82f6" : "#dbeafe",
            },
          }),
          input: (base) => ({
            ...base,
            color: "#1f2937",
          }),
          singleValue: (base) => ({
            ...base,
            color: "#1f2937",
          }),
        }}
        // You can also use the `classNamePrefix` prop to style with CSS/Tailwind
        classNamePrefix="react-select"
      />
    </div>
  );
}
