import React from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button";

interface SettingsHeaderProps {
  title: string;
  description?: string;
  onSave: () => void;
  onReset: () => void;
  loading?: boolean;
  hasChanges?: boolean;
}

export default function SettingsHeader({
  title,
  description,
  onSave,
  onReset,
  loading = false,
  hasChanges = false,
}: SettingsHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 mb-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={onReset}
            disabled={loading || !hasChanges}
          >
            Reset
          </Button>
          <Button onClick={onSave} loading={loading} disabled={!hasChanges}>
            Save Changes
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
