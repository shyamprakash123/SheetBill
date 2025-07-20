import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, Check, X } from "lucide-react";
import Switch from "../../ui/Switch";

export interface AdditionalCharge {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
}

interface AdditionalChargesProps {
  value: string; // JSON string
  onChange: (value: string) => void;
}

export default function AdditionalCharges({
  value,
  onChange,
}: AdditionalChargesProps) {
  const [charges, setCharges] = useState<AdditionalCharge[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCharge, setNewCharge] = useState({
    name: "",
    price: 0,
    isDefault: false,
  });
  const [isAdding, setIsAdding] = useState(false);

  // Parse JSON string to charges array
  useEffect(() => {
    try {
      if (value && value.trim()) {
        const parsed = JSON.parse(value);
        setCharges(Array.isArray(parsed) ? parsed : []);
      } else {
        setCharges([]);
      }
    } catch (error) {
      console.error("Error parsing additional charges:", error);
      setCharges([]);
    }
  }, [value]);

  // Update parent component when charges change
  const updateCharges = (updatedCharges: AdditionalCharge[]) => {
    setCharges(updatedCharges);
    onChange(JSON.stringify(updatedCharges));
  };

  const generateId = () =>
    `charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleAddCharge = () => {
    if (newCharge.name.trim() && newCharge.price >= 0) {
      const charge: AdditionalCharge = {
        id: generateId(),
        name: newCharge.name.trim(),
        price: Number(newCharge.price),
        isDefault: newCharge.isDefault,
      };
      updateCharges([...charges, charge]);
      setNewCharge({ name: "", price: 0, isDefault: false });
      setIsAdding(false);
    }
  };

  const handleEditCharge = (
    id: string,
    updatedCharge: Partial<AdditionalCharge>
  ) => {
    const updated = charges.map((charge) =>
      charge.id === id ? { ...charge, ...updatedCharge } : charge
    );
    updateCharges(updated);
    setEditingId(null);
  };

  const handleDeleteCharge = (id: string) => {
    updateCharges(charges.filter((charge) => charge.id !== id));
  };

  const toggleDefault = (id: string) => {
    const updated = charges.map((charge) =>
      charge.id === id ? { ...charge, isDefault: !charge.isDefault } : charge
    );
    updateCharges(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage additional charges that can be applied to invoices
        </p>
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Charge
        </button>
      </div>

      {/* Add New Charge Form */}
      {isAdding && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Charge Name
              </label>
              <input
                type="text"
                value={newCharge.name}
                onChange={(e) =>
                  setNewCharge((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Shipping, Handling"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price
              </label>
              <input
                type="text"
                value={newCharge.price}
                min={1}
                onChange={(e) =>
                  setNewCharge((prev) => ({
                    ...prev,
                    price: parseFloat(e.target.value) || "",
                  }))
                }
                placeholder="Price"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* <input
                type="text"
                min={1}
                value={newCharge.price}
                onChange={(e) =>
                  setNewCharge((prev) => ({
                    ...prev,
                    price: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              /> */}
            </div>
            <div className="flex items-center">
              <label className="flex flex-1 justify-center text-sm text-gray-700 dark:text-gray-300">
                <Switch
                  checked={newCharge.isDefault}
                  onChange={(checked) =>
                    setNewCharge((prev) => ({
                      ...prev,
                      isDefault: checked,
                    }))
                  }
                  label="Default"
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
              <div className="flex gap-1">
                <button
                  onClick={handleAddCharge}
                  disabled={!newCharge.name.trim()}
                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewCharge({ name: "", price: 0, isDefault: false });
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charges List */}
      <div className="space-y-2">
        {charges.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No additional charges configured</p>
            <p className="text-sm">
              Click "Add Charge" to create your first charge
            </p>
          </div>
        ) : (
          charges.map((charge) => (
            <ChargeItem
              key={charge.id}
              charge={charge}
              isEditing={editingId === charge.id}
              onEdit={() => setEditingId(charge.id)}
              onSave={(updatedCharge) =>
                handleEditCharge(charge.id, updatedCharge)
              }
              onCancel={() => setEditingId(null)}
              onDelete={() => handleDeleteCharge(charge.id)}
              onToggleDefault={() => toggleDefault(charge.id)}
            />
          ))
        )}
      </div>

      {/* Summary */}
      {charges.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Total Charges: {charges.length}</span>
            <span>
              Default Charges: {charges.filter((c) => c.isDefault).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface ChargeItemProps {
  charge: AdditionalCharge;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (charge: Partial<AdditionalCharge>) => void;
  onCancel: () => void;
  onDelete: () => void;
  onToggleDefault: () => void;
}

function ChargeItem({
  charge,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onToggleDefault,
}: ChargeItemProps) {
  const [editData, setEditData] = useState({
    name: charge.name,
    price: charge.price,
    isDefault: charge.isDefault,
  });

  useEffect(() => {
    if (isEditing) {
      setEditData({
        name: charge.name,
        price: charge.price,
        isDefault: charge.isDefault,
      });
    }
  }, [isEditing, charge]);

  const handleSave = () => {
    if (editData.name.trim()) {
      onSave({
        name: editData.name.trim(),
        price: Number(editData.price),
        isDefault: editData.isDefault,
      });
    }
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={editData.name}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={editData.price}
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                price: parseFloat(e.target.value) || 0,
              }))
            }
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={editData.isDefault}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    isDefault: e.target.checked,
                  }))
                }
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Default
            </label>
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                disabled={!editData.name.trim()}
                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onCancel}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {charge.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ₹{charge.price.toFixed(2)}
              {charge.isDefault && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  Default
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleDefault}
          className={`p-1.5 rounded transition-colors ${
            charge.isDefault
              ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              : "text-green-400 hover:bg-green-50 dark:hover:bg-green-700"
          }`}
          title={charge.isDefault ? "Remove from defaults" : "Set as default"}
        >
          {charge.isDefault ? (
            <X className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
