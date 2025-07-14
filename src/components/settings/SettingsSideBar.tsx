import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  UserIcon,
  BuildingOfficeIcon,
  CogIcon,
  AdjustmentsHorizontalIcon,
  PrinterIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "profile",
    label: "Profile",
    icon: UserIcon,
    children: [
      {
        id: "company-details",
        label: "Company Details",
        icon: BuildingOfficeIcon,
      },
      { id: "user-profile", label: "User Profile", icon: UserIcon },
    ],
  },
  {
    id: "general",
    label: "General Settings",
    icon: CogIcon,
    children: [
      {
        id: "preferences",
        label: "Preferences",
        icon: AdjustmentsHorizontalIcon,
      },
      {
        id: "thermal-print",
        label: "Thermal Print Settings",
        icon: PrinterIcon,
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: DocumentTextIcon,
    children: [
      { id: "signatures", label: "Signatures", icon: PencilSquareIcon },
      { id: "notes-terms", label: "Notes & Terms", icon: DocumentTextIcon },
    ],
  },
  {
    id: "financial",
    label: "Banks & Payments",
    icon: BanknotesIcon,
    children: [{ id: "banks", label: "Banks", icon: BanknotesIcon }],
  },
];

interface SettingsSidebarProps {
  className?: string;
}

export default function SettingsSidebar({ className }: SettingsSidebarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(["profile"])
  );

  const activeTab = searchParams.get("tab") || "company-details";
  const activeSubtab = searchParams.get("subtab");

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = (itemId: string, hasChildren: boolean) => {
    if (hasChildren) {
      toggleExpanded(itemId);
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", itemId);
      if (activeSubtab) {
        newParams.delete("subtab");
      }
      setSearchParams(newParams);
    }
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    return (
      <div key={item.id}>
        <button
          onClick={() => handleItemClick(item.id, hasChildren)}
          className={clsx(
            "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            level === 0 ? "mb-1" : "mb-0.5 ml-4",
            isActive
              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <div className="flex items-center">
            <Icon className={clsx("h-4 w-4 mr-3", level > 0 && "ml-2")} />
            <span>{item.label}</span>
          </div>
          {hasChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </motion.div>
          )}
        </button>

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
                {item.children?.map((child) =>
                  renderMenuItem(child, level + 1)
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div
      className={clsx(
        "w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4",
        className
      )}
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Settings
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure your account and application preferences
        </p>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
    </div>
  );
}
