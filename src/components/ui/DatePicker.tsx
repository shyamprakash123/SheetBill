import React from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Select date",
  error = false,
  disabled = false,
}: DatePickerProps) {
  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        disabled={disabled}
        className={`w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
          error
            ? "border-red-300 dark:border-red-600 focus:ring-red-500"
            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        placeholder={placeholder}
      />
      <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}
