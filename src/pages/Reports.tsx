import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInvoiceStore } from "../store/invoice";
import { useAuthStore } from "../store/auth";
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import GoogleAuthModal from "../components/GoogleAuthModal";
import toast from "react-hot-toast";

export default function Reports() {
  const {
    invoices,
    products,
    customers,
    initializeService,
    fetchInvoices,
    fetchProducts,
    fetchCustomers,
    getInvoiceStats,
    loading,
  } = useInvoiceStore();
  const { profile } = useAuthStore();
  const [dateRange, setDateRange] = useState("30");
  const [stats, setStats] = useState(null);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);

  useEffect(() => {
    const initData = async () => {
      if (!profile?.google_tokens) {
        setShowGoogleAuth(true);
        return;
      }

      try {
        await initializeService();
        await Promise.all([fetchInvoices(), fetchProducts(), fetchCustomers()]);
        const invoiceStats = await getInvoiceStats();
        setStats(invoiceStats);
      } catch (error) {
        console.error("Error fetching reports data:", error);
        if (error.message?.includes("Google account")) {
          setShowGoogleAuth(true);
        } else {
          toast.error("Error loading reports data");
        }
      }
    };
    initData();
  }, [profile]);

  const handleGoogleAuthSuccess = async () => {
    setShowGoogleAuth(false);
    try {
      await initializeService();
      await Promise.all([fetchInvoices(), fetchProducts(), fetchCustomers()]);
      const invoiceStats = await getInvoiceStats();
      setStats(invoiceStats);
      toast.success("Google account connected! Reports data loaded.");
    } catch (error) {
      console.error("Error after Google auth:", error);
      toast.error("Connected to Google but had issues loading data.");
    }
  };

  // Calculate metrics from real data
  const totalRevenue = stats?.totalRevenue || 0;
  const totalPaid = stats?.paidAmount || 0;
  const totalPending = stats?.pendingAmount || 0;
  const overdueAmount = stats?.overdueAmount || 0;
  const paidInvoices = invoices.filter((inv) => inv.status === "Paid");
  const pendingInvoices = invoices.filter(
    (inv) => inv.status === "Pending" || inv.status === "Sent"
  );
  const overdueInvoices = invoices.filter((inv) => inv.status === "Overdue");

  const gstCollected = invoices.reduce(
    (sum, inv) => sum + (inv.taxAmount || 0),
    0
  );
  const totalProducts = products.length;
  const totalCustomers = customers.length;

  const reportCards = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      color: "bg-blue-500",
      change: `${invoices.length} invoices`,
    },
    {
      title: "Paid Amount",
      value: `₹${totalPaid.toLocaleString()}`,
      icon: DocumentTextIcon,
      color: "bg-green-500",
      change: `${paidInvoices.length} paid`,
    },
    {
      title: "Pending Amount",
      value: `₹${totalPending.toLocaleString()}`,
      icon: CalendarIcon,
      color: "bg-yellow-500",
      change: `${pendingInvoices.length} pending`,
    },
    {
      title: "GST Collected",
      value: `₹${gstCollected.toLocaleString()}`,
      icon: ChartBarIcon,
      color: "bg-purple-500",
      change: "This period",
    },
  ];

  const businessMetrics = [
    {
      title: "Total Products",
      value: totalProducts.toString(),
      icon: CubeIcon,
      color: "bg-indigo-500",
    },
    {
      title: "Total Customers",
      value: totalCustomers.toString(),
      icon: UserGroupIcon,
      color: "bg-pink-500",
    },
    {
      title: "Overdue Amount",
      value: `₹${overdueAmount.toLocaleString()}`,
      icon: ExclamationTriangleIcon,
      color: "bg-red-500",
    },
    {
      title: "Collection Rate",
      value: `${
        invoices.length > 0
          ? Math.round((paidInvoices.length / invoices.length) * 100)
          : 0
      }%`,
      icon: ChartBarIcon,
      color: "bg-emerald-500",
    },
  ];

  // Generate GST report data from real invoices
  const generateGSTReport = () => {
    const monthlyData = {};

    invoices.forEach((invoice) => {
      const date = new Date(invoice.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          period: monthName,
          sales: 0,
          gst: 0,
          filed: Math.random() > 0.3, // Random filing status for demo
        };
      }

      monthlyData[monthKey].sales += invoice.subtotal || 0;
      monthlyData[monthKey].gst += invoice.taxAmount || 0;
    });

    return Object.values(monthlyData).slice(-6); // Last 6 months
  };

  const gstReportData = generateGSTReport();

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
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your business performance and GST compliance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
            <Button variant="outline">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {reportCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hover className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {card.value}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {card.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Business Metrics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {businessMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <Card hover className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {metric.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${metric.color}`}>
                    <metric.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Revenue Trend
            </h3>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  Revenue chart visualization
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Total Revenue: ₹{totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Invoice Status */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Invoice Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Paid Invoices
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {paidInvoices.length} (
                  {invoices.length > 0
                    ? Math.round((paidInvoices.length / invoices.length) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      invoices.length > 0
                        ? (paidInvoices.length / invoices.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Pending Invoices
                </span>
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  {pendingInvoices.length} (
                  {invoices.length > 0
                    ? Math.round(
                        (pendingInvoices.length / invoices.length) * 100
                      )
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      invoices.length > 0
                        ? (pendingInvoices.length / invoices.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Overdue Invoices
                </span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {overdueInvoices.length} (
                  {invoices.length > 0
                    ? Math.round(
                        (overdueInvoices.length / invoices.length) * 100
                      )
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      invoices.length > 0
                        ? (overdueInvoices.length / invoices.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </Card>
        </div>

        {/* GST Filing Report */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              GST Filing Status
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    GST Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Filing Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {gstReportData.length > 0 ? (
                  gstReportData.map((row) => (
                    <tr
                      key={row.period}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {row.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ₹{row.sales.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ₹{row.gst.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            row.filed
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {row.filed ? "Filed" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!row.filed && (
                          <button className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                            File GST Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No GST data available. Create some invoices to see GST
                      reports.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Export Options */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Export Options
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex items-center justify-center"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Sales Report (PDF)
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              GST Report (Excel)
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Tally Export
            </Button>
          </div>
        </Card>
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
