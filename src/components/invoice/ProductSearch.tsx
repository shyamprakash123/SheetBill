import React, { useState } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Button from "../ui/Button";
import SearchableDropdown from "../ui/SearchableDropdown";
import { useNavigate } from "react-router-dom";

interface ProductSearchProps {
  products: any[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onAddProduct: (product: any, quantity?: number) => void;
  onAddNewProduct?: () => void;
  error?: string;
}

export default function ProductSearch({
  products,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onAddProduct,
  onAddNewProduct,
  error,
}: ProductSearchProps) {
  const categories = ["all", ...new Set(products.map((p) => p.category))];
  const [quantity, setQuantity] = useState(null);

  const navigate = useNavigate();

  // const filteredProducts = products.filter((product) => {
  //   const matchesSearch =
  //     product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     product.description?.toLowerCase().includes(searchQuery.toLowerCase());
  //   const matchesCategory =
  //     selectedCategory === "all" || product.category === selectedCategory;
  //   return matchesSearch && matchesCategory;
  // });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Add Products/Services
          {error && (
            <span className="text-red-500 text-xs ml-2">
              <ExclamationTriangleIcon className="h-3 w-3 inline mr-1" />
              {error}
            </span>
          )}
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "all" ? "All Categories" : category}
            </option>
          ))}
        </select>

        {/* Search Input */}
        <div className="flex-1">
          <SearchableDropdown
            options={products}
            value={searchQuery}
            onChange={(value) => onSearchChange(value)}
            placeholder="Select Products..."
            displayKey="value" // or the correct key like "name"
            icon={MagnifyingGlassIcon}
            disabled={false}
            onAddNew={() => navigate("/app/inventory")}
            addNewLabel="Add Product"
            onRemoveOption={() => onSearchChange("")}
          />
        </div>

        {/* Quantity Input */}
        <input
          type="text"
          value={quantity}
          min={1}
          onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Qty"
          className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {
          <Button
            onClick={() => {
              if (searchQuery.length === 0) return;
              onAddProduct(
                {
                  name: searchQuery.value,
                  price: searchQuery.price,
                  taxRate: searchQuery.taxRate,
                  stock: searchQuery.stock,
                  unit: searchQuery.unit,
                  hsnCode: searchQuery.hsnCode,
                },
                parseInt(quantity || "1")
              );
            }}
            variant="outline"
            size="sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        }
      </div>

      {/* Product Results */}
      {/* {searchQuery && (
        <div className="max-h-60 overflow-y-auto">
          {products.length === 0 ? (
            <div className="text-center py-8">
              <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No products found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => onAddProduct(product)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          ₹{product.price}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {product.unit}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="ml-2">
                      Add
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )} */}
    </div>
  );
}
