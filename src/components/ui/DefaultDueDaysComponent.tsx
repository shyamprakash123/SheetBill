import React, { useEffect, useState } from "react";

interface DefaultDueDaysFieldProps {
  value: number | null;
  onChange: (value: number) => void;
}

const presetOptions = [0, 7, 15, 30, 60, 90];

export const DefaultDueDaysField: React.FC<DefaultDueDaysFieldProps> = ({
  value,
  onChange,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | "custom" | "">(
    ""
  );
  const [customDueDays, setCustomDueDays] = useState<number | "">("");

  useEffect(() => {
    if (value === null || value === undefined || value === "") {
      setSelectedOption("");
    } else if (presetOptions.includes(value)) {
      setSelectedOption(value);
    } else {
      setSelectedOption("custom");
      setCustomDueDays(value);
    }
  }, [value]);

  const handleSelectChange = (val: string) => {
    if (val === "custom") {
      setSelectedOption("custom");
      onChange(Number(customDueDays || 0)); // Set to current custom or 0
    } else {
      const parsed = Number(val);
      setSelectedOption(parsed);
      onChange(parsed);
    }
  };

  const handleCustomInputChange = (val: string) => {
    const parsed = Number(val);
    setCustomDueDays(parsed);
    onChange(parsed);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Default Due Days
      </label>

      <select
        value={selectedOption}
        onChange={(e) => handleSelectChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
      >
        <option value="">Select Due Days</option>
        <option value={0}>Same Day</option>
        <option value={7}>7 Days</option>
        <option value={15}>15 Days</option>
        <option value={30}>30 Days</option>
        <option value={60}>60 Days</option>
        <option value={90}>90 Days</option>
        <option value="custom">Custom</option>
      </select>

      {selectedOption === "custom" && (
        <input
          type="number"
          min={1}
          value={customDueDays}
          onChange={(e) => handleCustomInputChange(e.target.value)}
          placeholder="Enter custom due days"
          className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      )}
    </div>
  );
};
