import React from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "purple" | "red" | "yellow";
  label?: string;
  description?: string;
  id?: string;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = "md",
  color = "blue",
  label,
  description,
  id,
  className = "",
}) => {
  const sizeClasses = {
    sm: {
      switch: "h-4 w-7",
      thumb: "h-3 w-3",
      translate: "translate-x-3",
    },
    md: {
      switch: "h-5 w-9",
      thumb: "h-4 w-4",
      translate: "translate-x-4",
    },
    lg: {
      switch: "h-6 w-11",
      thumb: "h-5 w-5",
      translate: "translate-x-5",
    },
  };

  const colorClasses = {
    blue: {
      bg: "bg-blue-600",
      focus: "focus:ring-blue-500",
    },
    green: {
      bg: "bg-green-600",
      focus: "focus:ring-green-500",
    },
    purple: {
      bg: "bg-purple-600",
      focus: "focus:ring-purple-500",
    },
    red: {
      bg: "bg-red-600",
      focus: "focus:ring-red-500",
    },
    yellow: {
      bg: "bg-yellow-600",
      focus: "focus:ring-yellow-500",
    },
  };

  const currentSize = sizeClasses[size];
  const currentColor = colorClasses[color];

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const switchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleToggle}
      className={`
        relative inline-flex ${
          currentSize.switch
        } shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none 
        ${
          currentColor.focus
        } focus:ring-offset-white dark:focus:ring-offset-gray-800
        ${
          checked
            ? `${currentColor.bg} dark:${currentColor.bg}`
            : "bg-gray-200 dark:bg-gray-700"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-opacity-90"}
        ${className}
      `}
      id={id}
    >
      <span className="sr-only">{label || "Toggle switch"}</span>
      <span
        aria-hidden="true"
        className={`
          ${
            currentSize.thumb
          } pointer-events-none inline-block rounded-full bg-white shadow-lg 
          transform ring-0 transition duration-200 ease-in-out
          ${checked ? currentSize.translate : "translate-x-0"}
        `}
      />
    </button>
  );

  if (label || description) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={id}
              className={`
                text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              className={`
              text-sm text-gray-500 dark:text-gray-400
              ${disabled ? "opacity-50" : ""}
            `}
            >
              {description}
            </p>
          )}
        </div>
        {switchElement}
      </div>
    );
  }

  return switchElement;
};

export default Switch;
