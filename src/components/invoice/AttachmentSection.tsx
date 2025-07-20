import React, { useRef } from "react";
import {
  PaperClipIcon,
  XMarkIcon,
  DocumentIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Signature } from "../../types/invoice";
import SearchableDropdown from "../ui/SearchableDropdown";
import Button from "../ui/Button";

interface AttachmentSectionProps {
  attachments: File[];
  onAttachmentsChange: (attachments: File[]) => void;
  signature?: Signature;
  signatures: Signature[];
  onSignatureChange: (signature?: Signature) => void;
  onAddSignature?: () => void;
}

export default function AttachmentSection({
  attachments,
  onAttachmentsChange,
  signature,
  signatures,
  onSignatureChange,
  onAddSignature,
}: AttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    onAttachmentsChange([...attachments, ...files]);
  };

  function getImageUrl(url: string): string | null {
    if (!url) return null;
    const regex = /\/d\/([a-zA-Z0-9_-]{10,})/;
    const match = url.match(regex);
    const fileId = match ? match[1] : null;
    // return `https://drive.google.com/file/d/${fileId}/preview`;
    return `https://drive.google.com/thumbnail?id=${fileId}`;
    // return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    onAttachmentsChange([...attachments, ...files]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeAttachment = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
        <PaperClipIcon className="h-5 w-5 mr-2" />
        Attachments & Signature
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Attach Files
          </label>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Supports: PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="hidden"
          />

          {/* Attached Files List */}
          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Attached Files ({attachments.length})
              </h4>
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <DocumentIcon className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(index);
                    }}
                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Signature Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Signature
          </label>
          <SearchableDropdown
            options={
              signatures
                ? [
                    {
                      value: signatures.name,
                      id: signatures.name,
                      sig: signatures.image,
                    },
                  ]
                : []
            }
            value={signature}
            onChange={onSignatureChange}
            placeholder="Select signature"
            displayKey="name"
            onAddNew={onAddSignature}
            addNewLabel="Add New Signature"
            noSearch={true}
            onRemoveOption={() => onSignatureChange(null)}
          />

          {signature && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                {signature.value}
              </div>
              <img
                src={getImageUrl(signature.sig)}
                alt={signature.value}
                className="max-h-32 max-w-32 object-contain border border-gray-200 dark:border-gray-600 rounded"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
