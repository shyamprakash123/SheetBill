import React, { useState } from "react";

type Mode = "debit" | "credit";

export default function ModeSwitch({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <div>
      <p className="text-sm text-gray-700 font-medium pb-1 text-center">
        Account Type
      </p>
      <div
        className="w-40 h-10 rounded-full flex items-center px-1 cursor-pointer relative border border-gray-300"
        onClick={() => onChange(value === "debit" ? "credit" : "debit")}
      >
        {/* Slide Background */}
        <div
          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ${
            value === "debit"
              ? "left-1 bg-red-700"
              : "left-[calc(50%)] bg-green-700"
          }`}
        />
        {/* Labels */}
        <div
          className={`z-10 w-1/2 text-center font-semibold text-sm ${
            value === "debit" ? "text-white" : "text-red-700"
          }`}
        >
          Debit
        </div>
        <div
          className={`z-10 w-1/2 text-center font-semibold text-sm ${
            value === "credit" ? "text-white" : "text-green-700"
          }`}
        >
          Credit
        </div>
      </div>
    </div>
  );
}
