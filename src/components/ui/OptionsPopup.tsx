import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

type Option = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
};

export default function OptionsPopup({ options }: { options: Option[] }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !containerRef.current?.contains(target)
      ) {
        setOpen(false);
        setTimeout(() => setOpen(false), 150);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Set popup position when opened
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 150; // same as Tailwind `w-48` (48 * 4 = 192px)
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - popupWidth,
      });
    }
  }, [open]);

  return (
    <div className="flex flex-row justify-end w-full">
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full w-min hover:bg-gray-200 transition"
      >
        <MoreVertical className="w-5 h-5 text-gray-600" />
      </button>

      {open &&
        createPortal(
          <div
            ref={containerRef}
            className="absolute z-[9999] bg-white w-[150px] rounded-xl shadow-xl ring-1 ring-gray-200 animate-fade-in"
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
            }}
          >
            <ul className="py-2">
              {options.map((option, i) => (
                <li
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    option.onClick();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer transition"
                >
                  {option.icon}
                  {option.label}
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}
