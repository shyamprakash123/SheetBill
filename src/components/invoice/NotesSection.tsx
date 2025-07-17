import React, { useState } from 'react';
import { ChevronDownIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface NotesSectionProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  noteTemplates: string[];
}

export default function NotesSection({
  notes,
  onNotesChange,
  noteTemplates,
}: NotesSectionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleTemplateSelect = (template: string) => {
    if (template) {
      onNotesChange(template);
      setSelectedTemplate('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Notes & Terms
        </h2>
        {noteTemplates.length > 0 && (
          <div className="relative">
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="appearance-none px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Select template...</option>
              {noteTemplates.map((template, index) => (
                <option key={index} value={template}>
                  Template {index + 1}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add notes, terms & conditions, or special instructions..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Add payment terms, delivery instructions, or other important information</span>
          <span>{notes.length}/1000</span>
        </div>
      </div>
    </div>
  );
}