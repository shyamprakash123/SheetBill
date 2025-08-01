import { useState, useEffect, useRef } from "react";
import { ChevronDown, Calendar, Check } from "lucide-react";

const options = [
  { label: "Same Day", value: "0", description: "Due immediately" },
  { label: "7 Days", value: "7", description: "One week from creation" },
  { label: "15 Days", value: "15", description: "Two weeks from creation" },
  { label: "30 Days", value: "30", description: "One month from creation" },
  { label: "Custom", value: "custom", description: "Set your own timeframe" },
];

interface DefaultDueDaysComponentProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
}

export default function DefaultDueDaysComponent({
  value = "7",
  onChange = () => {},
  disabled = false,
  error = "",
  label = "Default Due Days",
  placeholder = "Enter custom days",
}: DefaultDueDaysComponentProps) {
  // --- INTERNAL UI STATE ---
  const [isOpen, setIsOpen] = useState(false);
  const [customInputValue, setCustomInputValue] = useState("");

  // --- REFS ---
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // --- DERIVED STATE ---
  const isPredefined = options.some(
    (opt) => opt.value === value && opt.value !== "custom"
  );

  const selectedOption = isPredefined ? value : "custom";
  const customValue = isPredefined ? "" : value;

  // --- EFFECTS ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (selectedOption === "custom" && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedOption, isOpen]);

  useEffect(() => {
    if (!isPredefined) {
      setCustomInputValue(value);
    }
  }, [value, isPredefined]);

  // --- KEYBOARD NAVIGATION ---
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        setIsOpen(!isOpen);
        break;
      case "Escape":
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
    }
  };

  // --- HANDLERS ---
  const handleSelectOption = (optionValue: string) => {
    if (optionValue === "custom") {
      onChange("");
      setCustomInputValue("");
    } else {
      onChange(optionValue);
    }
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomInputValue(newValue);
    onChange(newValue);
  };

  const handleCustomInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  // --- DISPLAY VALUES ---
  const getDisplayValue = () => {
    if (selectedOption === "custom") {
      return customValue ? `${customValue} days` : "Custom days";
    }
    return options.find((opt) => opt.value === value)?.label || "Select option";
  };

  const getSelectedDescription = () => {
    if (selectedOption === "custom") {
      return customValue
        ? `Due in ${customValue} days`
        : "Set your own timeframe";
    }
    return options.find((opt) => opt.value === value)?.description || "";
  };

  return (
    <div className="w-full max-w-sm" ref={wrapperRef}>
      <label
        htmlFor="due-days-select"
        className="block text-sm font-medium text-gray-800 mb-1"
      >
        {label}
      </label>

      <div className="relative w-full">
        <button
          ref={buttonRef}
          id="due-days-select"
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-describedby={error ? "due-days-error" : "due-days-description"}
          className={`
            relative w-full cursor-pointer rounded-lg border-2 py-[1px] bg-white pl-4 pr-12 text-left shadow-sm transition-all duration-200 text-sm
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            }
            ${
              disabled
                ? "bg-gray-50 cursor-not-allowed opacity-60"
                : "hover:shadow-md focus:shadow-md"
            }
          `}
        >
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {getDisplayValue()}
              </div>
              <div className="text-xs text-gray-500 truncate mt-0.5">
                {getSelectedDescription()}
              </div>
            </div>
          </div>

          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-lg bg-white shadow-xl border border-gray-200 max-h-64 overflow-auto animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="py-2">
              {options.map((option, index) => (
                <div key={option.value}>
                  {option.value === "custom" ? (
                    <div className="px-4 py-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            Custom Days
                          </div>
                          <div className="text-xs text-gray-500">
                            Set your own timeframe
                          </div>
                        </div>
                        {selectedOption === "custom" && (
                          <Check className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <input
                        ref={inputRef}
                        type="number"
                        min="1"
                        max="365"
                        placeholder={placeholder}
                        value={customInputValue}
                        onChange={handleCustomInputChange}
                        onKeyDown={handleCustomInputKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectOption(option.value)}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 flex items-center gap-3
                        ${selectedOption === option.value ? "bg-blue-50" : ""}
                      `}
                    >
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {option.description}
                        </div>
                      </div>
                      {selectedOption === option.value && (
                        <Check className="h-4 w-4 text-blue-500" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          id="due-days-error"
          className="mt-2 text-sm text-red-600 flex items-center gap-1"
        >
          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
          {error}
        </div>
      )}
    </div>
  );
}
