import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "fetch";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md focus:ring-primary-500",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 focus:ring-gray-500",
    outline:
      "border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-300 focus:ring-primary-500",
    ghost:
      "hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300 focus:ring-gray-500",
    danger:
      "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md focus:ring-red-500",
    fetch:
      "absoulte bg-blue-600 text-white hover:bg-blue-700 h-full px-4 text-sm rounded-r-lg focus:ring-blue-500 shadow-none hover:shadow-none border-none",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <motion.button
      whileHover={variant === "fetch" ? { scale: 1.02 } : {}}
      whileTap={variant === "fetch" ? { scale: 0.98 } : {}}
      className={clsx(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
