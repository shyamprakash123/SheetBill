import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInvoiceStore } from "../store/invoice";
import { useAuthStore } from "../store/auth";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import GoogleAuthModal from "../components/GoogleAuthModal";
import toast from "react-hot-toast";

export default function Inventory() {
  const { products, fetchProducts, createProduct, updateProduct, loading } =
    useInvoiceStore();
  const { profile } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    hsnCode: "",
    category: "",
    unit: "pcs",
    taxRate: "18",
  });

  useEffect(() => {
    const initData = async () => {
      if (!profile?.google_tokens) {
        setShowGoogleAuth(true);
        return;
      }

      try {
        await fetchProducts();
      } catch (error) {
        console.error("Error fetching products:", error);
        if (error.message?.includes("Google account")) {
          setShowGoogleAuth(true);
        }
      }
    };
    initData();
  }, [profile]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if Google account is connected
    if (!profile?.google_tokens) {
      setShowGoogleAuth(true);
      return;
    }

    // Validation
    if (!newProduct.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      await createProduct({
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        stock: newProduct.stock,
        hsnCode: newProduct.hsnCode,
        taxRate: parseFloat(newProduct.taxRate),
        category: newProduct.category,
        unit: newProduct.unit,
        status: "Active",
      });

      setNewProduct({
        name: "",
        description: "",
        price: "",
        stock: "",
        hsnCode: "",
        category: "",
        unit: "pcs",
        taxRate: "18",
      });
      setShowCreateModal(false);
      toast.success("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    }
  };

  const handleGoogleAuthSuccess = async () => {
    setShowGoogleAuth(false);
    try {
      await initializeService();
      await fetchProducts();
      toast.success("Google account connected! You can now add products.");
    } catch (error) {
      console.error("Error after Google auth:", error);
      toast.error("Connected to Google but had issues setting up spreadsheet.");
    }
  };
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      filterCategory === "all" ||
      product.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalProducts = products.length;
  const lowStockProducts = products.filter((product) => {
    const stock =
      typeof product.stock === "string"
        ? parseInt(product.stock)
        : product.stock;
    return !isNaN(stock) && stock < 10;
  }).length;
  const totalValue = products.reduce((sum, product) => {
    const stock =
      typeof product.stock === "string"
        ? parseInt(product.stock)
        : product.stock;
    return sum + product.price * (isNaN(stock) ? 0 : stock);
  }, 0);
  const categories = [...new Set(products.map((p) => p.category))].length;

  const stats = [
    {
      title: "Total Products",
      value: totalProducts.toString(),
      icon: CubeIcon,
      color: "bg-blue-500",
      change: "+12 this month",
    },
    {
      title: "Low Stock Items",
      value: lowStockProducts.toString(),
      icon: ExclamationTriangleIcon,
      color: "bg-red-500",
      change: lowStockProducts > 0 ? "Needs attention" : "All good",
    },
    {
      title: "Inventory Value",
      value: `₹${totalValue.toLocaleString()}`,
      icon: ArrowTrendingUpIcon,
      color: "bg-green-500",
      change: "+8.5%",
    },
    {
      title: "Categories",
      value: categories.toString(),
      icon: ArrowTrendingDownIcon,
      color: "bg-purple-500",
      change: `${categories} active`,
    },
  ];

  const getStockStatus = (stock: string | number) => {
    const stockNum = typeof stock === "string" ? parseInt(stock) : stock;
    if (isNaN(stockNum))
      return { color: "bg-gray-100 text-gray-800", label: stock };
    if (stockNum === 0)
      return { color: "bg-red-100 text-red-800", label: "Out of Stock" };
    if (stockNum < 10)
      return { color: "bg-yellow-100 text-yellow-800", label: "Low Stock" };
    return { color: "bg-green-100 text-green-800", label: "In Stock" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Inventory Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your products and track stock levels
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hover className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters and Search */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <EyeIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="services">Services</option>
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
                <option value="consulting">Consulting</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <FunnelIcon className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Products Table */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Products ({filteredProducts.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    HSN Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tax Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product, index) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                            <CubeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ₹{product.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.hsnCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.taxRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}
                        >
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filterCategory !== "all"
                    ? "No products match your filters."
                    : "No products found. Add your first product to get started."}
                </p>
                {!searchTerm && filterCategory === "all" && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                  >
                    Add Product
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Create Product Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add New Product"
        >
          <form onSubmit={handleCreateProduct} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Name
              </label>
              <input
                type="text"
                required
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter product description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price (₹)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Quantity
                </label>
                <input
                  type="text"
                  value={newProduct.stock}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, stock: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 100, ∞ for unlimited"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  HSN Code
                </label>
                <input
                  type="text"
                  value={newProduct.hsnCode}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, hsnCode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 998314"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  <option value="Services">Services</option>
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tax Rate (%)
                </label>
                <select
                  value={newProduct.taxRate}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, taxRate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5% (Essential goods)</option>
                  <option value="12">12% (Standard rate)</option>
                  <option value="18">18% (Standard rate)</option>
                  <option value="28">28% (Luxury goods)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unit
              </label>
              <select
                value={newProduct.unit}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, unit: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="ltr">Liters (ltr)</option>
                <option value="mtr">Meters (mtr)</option>
                <option value="hrs">Hours (hrs)</option>
                <option value="days">Days</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
                <option value="service">Service</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={!newProduct.name.trim() || !newProduct.price}
              >
                Add Product
              </Button>
            </div>
          </form>
        </Modal>
      </div>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={showGoogleAuth}
        onClose={() => setShowGoogleAuth(false)}
        onSuccess={handleGoogleAuthSuccess}
      />
    </>
  );
}
