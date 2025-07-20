import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDownIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { CircleX, X } from "lucide-react";

interface SearchableDropdownProps {
  options: any[];
  value?: any;
  onChange: (value: any) => void;
  placeholder: string;
  displayKey: string;
  searchKey?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  onRemoveOption?: () => void;
  isCustomValue?: boolean;
  noSearch?: boolean;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  displayKey,
  searchKey = displayKey,
  onAddNew,
  addNewLabel = "Add New",
  icon: Icon,
  disabled = false,
  onRemoveOption,
  isCustomValue,
  noSearch,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCustomEditing, setIsCustomEditing] = useState(false);
  const [customValue, setCustomValue] = useState("");

  // const filteredOptions = options.filter((option) =>
  //   option[searchKey]?.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  const filteredOptions = options?.filter((option) => {
    const valueToSearch = option?.value;
    return valueToSearch?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length
        ) {
          onChange(filteredOptions[highlightedIndex]);
          setIsOpen(false);
          setSearchQuery("");
          setHighlightedIndex(-1);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (option: any) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
          cursor-pointer flex items-center justify-between
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-gray-400 dark:hover:border-gray-500"
          }
          ${isOpen ? "ring-2 ring-blue-500 border-blue-500" : ""}
        `}
      >
        <div className="flex items-center flex-1 min-w-0">
          {Icon && <Icon className="h-5 w-5 text-gray-400 mr-2 shrink-0" />}
          <span
            className={
              value?.value
                ? "text-gray-900 dark:text-gray-100 truncate w-0 flex-1"
                : "text-gray-500 dark:text-gray-400 truncate w-0 flex-1"
            }
          >
            {value ? value?.value : value?.[displayKey] || placeholder}
            {value?.others && value?.others.isDefault && (
              <span className="bg-teal-500 ml-4 text-white text-xs font-semibold rounded-full px-2 py-1">
                Default
              </span>
            )}
          </span>
        </div>

        {value ? (
          onRemoveOption && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // prevent selecting
                onRemoveOption(); // pass the option
              }}
              title="Remove"
              className=""
            >
              <CircleX className="w-4 h-4 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition" />
            </button>
          )
        ) : (
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden"
          >
            {/* Search Input */}
            {!noSearch && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {!filteredOptions && (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Select user for options
                </div>
              )}
              {filteredOptions?.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No options found
                </div>
              ) : (
                filteredOptions?.map((option, index) => (
                  <div
                    key={option.id || index}
                    onClick={() => handleSelect(option)}
                    className={`
                      flex justify-between px-3 py-2 cursor-pointer text-sm transition-colors
                      ${
                        index === highlightedIndex
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                    `}
                  >
                    <div>
                      <div className="font-medium">
                        {option.value.split("\n").map((line, i) => (
                          <div key={i}>
                            {line}
                            {option.others && option.others.isDefault && (
                              <span className="bg-teal-500 ml-4 text-white text-xs font-semibold rounded-full px-2 py-1">
                                Default
                              </span>
                            )}
                            {option && option?.isDefault && (
                              <span className="bg-teal-500 ml-4 text-white text-xs font-semibold rounded-full px-2 py-1">
                                Default
                              </span>
                            )}
                            {option.description && (
                              <span className="text-gray-500 font-sans font-semibold">
                                {"  "}
                                {option.description}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Product Meta Info */}
                      <div className="flex text-xs space-x-1 items-center text-gray-500 dark:text-gray-400 mt-1">
                        {option.stock && (
                          <div>
                            <span
                              className={`font-medium ${
                                option.stock > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              } `}
                            >
                              AVL QTY:
                            </span>{" "}
                            <span
                              className={`font-medium ${
                                option.stock > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              } `}
                            >
                              {option.stock}
                            </span>
                          </div>
                        )}
                        {option.unit && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">
                              {option.unit.toUpperCase()}
                            </span>
                          </div>
                        )}
                        {option.category && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">
                              {option.category.toUpperCase()}
                            </span>
                          </div>
                        )}
                        {option.hsnCode && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">
                              {option.hsnCode}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {option.price && (
                      <div className="flex flex-col items-end">
                        <div className="pr-2 ">
                          <p className="font-medium text-lg text-gray-800 dark:text-gray-300">
                            ₹{option.price}{" "}
                          </p>
                        </div>
                        {option.taxRate && (
                          <div>
                            <p className="font-medium  text-xs text-teal-600 dark:text-gray-300">
                              incl {option.taxRate}%
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}

              {isCustomValue &&
                (!isCustomEditing ? (
                  <div
                    onClick={() => {
                      setIsCustomEditing(true);
                      setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                    className="px-3 py-2 cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Enter Custom Value
                  </div>
                ) : (
                  <div className="px-3 py-2 flex items-center gap-2 bg-white dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                    <input
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customValue.trim()) {
                          onChange({
                            value: customValue.trim(),
                            id: "cust",
                          });
                          setCustomValue("");
                          setIsCustomEditing(false);
                          setIsOpen(false);
                        } else if (e.key === "Escape") {
                          setCustomValue("");
                          setIsCustomEditing(false);
                        }
                      }}
                      placeholder="Type and press Enter"
                      className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        setCustomValue("");
                        setIsCustomEditing(false);
                      }}
                      className="text-gray-400 hover:text-red-500"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

              {/* Add New Option */}
              {onAddNew && (
                <div
                  onClick={() => {
                    onAddNew();
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className="px-3 py-2 cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-gray-200 dark:border-gray-600 flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {addNewLabel}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
