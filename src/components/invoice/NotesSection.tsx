import React, { useState } from "react";
import { ChevronDownIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import SearchableDropdown from "../ui/SearchableDropdown";
import { useNavigate } from "react-router-dom";

interface NotesSectionProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  savedNotes: any[];
}

export default function NotesSection({
  notes,
  onNotesChange,
  savedNotes,
}: NotesSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-full flex">
          <h2 className="flex-1 text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Notes & Terms
          </h2>
          <div className="w-64">
            <SearchableDropdown
              options={savedNotes}
              value={notes}
              onChange={(val) => onNotesChange(val)}
              placeholder="Select Notes"
              displayKey="scxbdf"
              noSearch={true}
              onAddNew={() =>
                navigate("/app/settings?subtab=content&tab=notes-terms")
              }
              addNewLabel="New Note"
              onRemoveOption={
                notes?.id !== "custom" // fixed typo: "custom()" → "custom"
                  ? () =>
                      onNotesChange({
                        value: "Custom",
                        id: "custom",
                        note: "",
                      })
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <textarea
          value={notes.note}
          onChange={(e) =>
            onNotesChange({
              value: "Custom",
              id: "custom",
              note: e.target.value,
            })
          }
          placeholder="Add notes, terms & conditions, or special instructions..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Add payment terms, delivery instructions, or other important
            information
          </span>
          <span>{notes.note.length}/1000</span>
        </div>
      </div>
    </div>
  );
}
