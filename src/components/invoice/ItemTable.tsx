import React, { useState } from "react";
import {
  TrashIcon,
  PlusIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { GripVertical, Move } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { InvoiceItem } from "../../types/invoice";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface ItemTableProps {
  items: InvoiceItem[];
  onUpdateItem: (itemId: string, updates: Partial<InvoiceItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onDragEnd: (result: { oldIndex: number; newIndex: number }) => void;
  globalDiscount: { type: "percentage" | "amount"; value: number };
  onGlobalDiscountChange: (discount: {
    type: "percentage" | "amount";
    value: number;
  }) => void;
  additionalCharges: Array<{ id: string; name: string; amount: number }>;
  onAdditionalChargesChange: (
    charges: Array<{ id: string; name: string; amount: number }>
  ) => void;
  showAdditionalCharges: boolean;
  onToggleAdditionalCharges: (show: boolean) => void;
}

interface SortableItemProps {
  item: InvoiceItem;
  index: number;
  onUpdateItem: (itemId: string, updates: Partial<InvoiceItem>) => void;
  onRemoveItem: (itemId: string) => void;
  isDragOverlay?: boolean;
}

// Lightweight drag overlay component
function DragOverlayItem({ item }: { item: InvoiceItem }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-blue-500 p-4 min-w-[600px] opacity-95">
      <div className="flex items-center space-x-4">
        <GripVertical className="h-5 w-5 text-blue-600" />
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white">
            {item.product.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Qty: {item.quantity} × ₹{item.unitPrice} = ₹{item.total.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableItem({
  item,
  index,
  onUpdateItem,
  onRemoveItem,
  isDragOverlay = false,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
  };

  if (isDragOverlay) {
    return <DragOverlayItem item={item} />;
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-100 dark:border-gray-700 transition-colors ${
        isDragging ? "opacity-40" : "hover:bg-gray-50 dark:hover:bg-gray-700"
      }`}
    >
      <td className="py-3 px-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
      </td>
      <td className="py-3 px-2">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex flex-col truncate">
            <div className="font-medium text-gray-900 dark:text-white text-sm">
              {item.product.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {item.product.description}
            </div>
            {/* Product Meta Info */}
            <div className="flex text-xs space-x-2 items-center text-gray-500 dark:text-gray-400 mt-1">
              {item.product.stock && (
                <div className="flex items-center space-x-1">
                  <span
                    className={`font-medium ${
                      item.product.stock > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    AVL QTY:
                  </span>
                  <span
                    className={`font-medium ${
                      item.product.stock > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {item.product.stock}
                  </span>
                </div>
              )}
              {item.product.unit && (
                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {item.product.unit.toUpperCase()}
                  </span>
                </div>
              )}
              {item.product.hsnCode && (
                <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs">
                  <span className="font-medium text-blue-600 dark:text-blue-300">
                    {item.product.hsnCode}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-2">
        {/* <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) =>
            onUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })
          }
          className="w-full px-2 py-1 text-sm text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        /> */}
        <input
          type="text"
          value={item.quantity}
          min={1}
          onChange={(e) =>
            onUpdateItem(item.id, {
              quantity: parseInt(e.target.value) || null,
            })
          }
          placeholder="Qty"
          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </td>
      <td className="py-3 px-2">
        {/* <input
          type="number"
          step="0.01"
          value={item.unitPrice}
          onChange={(e) =>
            onUpdateItem(item.id, {
              unitPrice: parseFloat(e.target.value) || 0,
            })
          }
          className="w-full px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        /> */}
        <input
          type="text"
          value={item.unitPrice}
          min={0}
          onChange={(e) =>
            onUpdateItem(item.id, {
              unitPrice: parseFloat(e.target.value) || null,
            })
          }
          placeholder="Qty"
          className=" px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </td>
      <td className="py-3 px-2">
        <div className="flex items-center space-x-1">
          {/* <input
            type="number"
            step="0.01"
            value={item.discount.value}
            onChange={(e) =>
              onUpdateItem(item.id, {
                discount: {
                  ...item.discount,
                  value: parseFloat(e.target.value) || 0,
                },
              })
            }
            className="w-20 px-1 py-1 text-xs text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          /> */}
          <input
            type="text"
            value={item.discount.value}
            min={0}
            onChange={(e) =>
              onUpdateItem(item.id, {
                discount: {
                  ...item.discount,
                  value: parseFloat(e.target.value) || null,
                },
              })
            }
            placeholder="Discount"
            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={item.discount.type}
            onChange={(e) =>
              onUpdateItem(item.id, {
                discount: {
                  ...item.discount,
                  type: e.target.value as "percentage" | "amount",
                },
              })
            }
            className="px-1 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="percentage">%</option>
            <option value="amount">₹</option>
          </select>
        </div>
      </td>
      <td className="py-3 px-2 text-right text-sm text-gray-900 dark:text-gray-100">
        ₹{item.taxAmount.toFixed(2)}
      </td>
      <td className="py-3 px-2 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
        ₹{item.total.toFixed(2)}
      </td>
      <td className="py-3 px-2">
        <button
          onClick={() => onRemoveItem(item.id)}
          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

export default function ItemTable({
  items,
  onUpdateItem,
  onRemoveItem,
  onDragEnd,
  globalDiscount,
  onGlobalDiscountChange,
  additionalCharges,
  onAdditionalChargesChange,
  showAdditionalCharges,
  onToggleAdditionalCharges,
}: ItemTableProps) {
  const [newCharge, setNewCharge] = useState({ name: "", amount: 0 });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<InvoiceItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced distance for faster activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const item = items.find((item) => item.id === active.id);
    setDraggedItem(item || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);

      onDragEnd({ oldIndex, newIndex });
    }

    setActiveId(null);
    setDraggedItem(null);
  };

  const addAdditionalCharge = () => {
    if (newCharge.name && newCharge.amount > 0) {
      onAdditionalChargesChange([
        ...additionalCharges,
        { id: `charge-${Date.now()}`, ...newCharge },
      ]);
      setNewCharge({ name: "", amount: 0 });
    }
  };

  const removeAdditionalCharge = (chargeId: string) => {
    onAdditionalChargesChange(
      additionalCharges.filter((c) => c.id !== chargeId)
    );
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const totalAdditionalCharges = additionalCharges.reduce(
    (sum, charge) => sum + charge.amount,
    0
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Products & Services
          </h2>
          {items.length > 1 && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Move className="h-4 w-4" />
              <span>Drag to reorder</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => onToggleAdditionalCharges(!showAdditionalCharges)}
            variant="outline"
            size="sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Additional Charges
            {additionalCharges.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                {additionalCharges.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            No items added yet. Search and add products above.
          </p>
        </div>
      ) : (
        <div className="relative">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                      <Move className="h-4 w-4 text-gray-400" />
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Product
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                      Qty
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
                      Unit Price
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
                      Discount
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
                      Tax
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
                      Total
                    </th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  <SortableContext
                    items={items.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((item, index) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        index={index}
                        onUpdateItem={onUpdateItem}
                        onRemoveItem={onRemoveItem}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </div>

            <DragOverlay>
              {activeId && draggedItem ? (
                <SortableItem
                  item={draggedItem}
                  index={0}
                  onUpdateItem={onUpdateItem}
                  onRemoveItem={onRemoveItem}
                  isDragOverlay={true}
                />
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Additional Charges Display in Main Table */}
          {additionalCharges.length > 0 && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 mr-2 text-blue-600" />
                  Additional Charges
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Total: ₹{totalAdditionalCharges.toFixed(2)}
                </span>
              </div>
              <div className="space-y-2">
                {additionalCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {charge.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        ₹{charge.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeAdditionalCharge(charge.id)}
                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Remove charge"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Global Discount */}
          <div className="mt-6 flex justify-end">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-teal-700 dark:text-teal-400">
                  Global Discount
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={globalDiscount.value}
                  min={0}
                  onChange={(e) =>
                    onGlobalDiscountChange({
                      ...globalDiscount,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Qty"
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* <input
                  type="number"
                  step="0.01"
                  value={globalDiscount.value}
                  onChange={(e) =>
                    onGlobalDiscountChange({
                      ...globalDiscount,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="flex-1 py-2 text-sm text-right border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                /> */}
                <select
                  value={globalDiscount.type}
                  onChange={(e) =>
                    onGlobalDiscountChange({
                      ...globalDiscount,
                      type: e.target.value as "percentage" | "amount",
                    })
                  }
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">%</option>
                  <option value="amount">₹</option>
                </select>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                Discount: ₹
                {(globalDiscount.type === "percentage"
                  ? (subtotal * globalDiscount.value) / 100
                  : globalDiscount.value
                ).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Charges Modal */}
      <Modal
        isOpen={showAdditionalCharges}
        onClose={() => onToggleAdditionalCharges(false)}
        title="Manage Additional Charges"
        size="md"
      >
        <div className="space-y-6">
          {/* Add New Charge */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <PlusIcon className="h-5 w-5 mr-2 text-blue-600" />
              Add New Charge
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Charge Name
                </label>
                <input
                  type="text"
                  value={newCharge.name}
                  onChange={(e) =>
                    setNewCharge({ ...newCharge, name: e.target.value })
                  }
                  placeholder="e.g., Shipping, Handling, Insurance"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newCharge.amount}
                  onChange={(e) =>
                    setNewCharge({
                      ...newCharge,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button
                onClick={addAdditionalCharge}
                className="w-full"
                disabled={!newCharge.name || newCharge.amount <= 0}
              >
                Add Charge
              </Button>
            </div>
          </div>

          {/* Existing Charges */}
          {additionalCharges.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
                  Current Additional Charges
                </h4>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total:{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₹{totalAdditionalCharges.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {additionalCharges.map((charge, index) => (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {charge.name}
                        </h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {charge.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        ₹{charge.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeAdditionalCharge(charge.id)}
                        className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Remove this charge"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {additionalCharges.length === 0 && (
            <div className="text-center py-8">
              <CurrencyDollarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No additional charges added yet.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
