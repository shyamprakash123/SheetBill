import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  min,
  max,
}: DatePickerProps) {
  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={min}
        max={max}
        className={`
          w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg 
          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
    </div>
  );
}