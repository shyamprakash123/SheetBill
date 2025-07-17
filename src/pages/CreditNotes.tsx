import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentMinusIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  UserIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useInvoiceStore } from "../store/invoice";
import { useAuthStore } from "../store/auth";
import GoogleAuthModal from "../components/GoogleAuthModal";
import toast from "react-hot-toast";

interface CreditNote {
  id: string;
  invoiceId: string;
  customerName: string;
  date: string;
  amount: number;
  reason: string;
  status: "Draft" | "Issued" | "Applied";
  createdAt: string;
}

export default function CreditNotes() {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [newCreditNote, setNewCreditNote] = useState({
    invoiceId: "",
    customerName: "",
    amount: "",
    reason: "",
    status: "Draft" as const,
  });

  const { invoices, customers } = useInvoiceStore();
  const { profile } = useAuthStore();

  useEffect(() => {
    const initData = async () => {
      if (!profile?.google_tokens) {
        setShowGoogleAuth(true);
        return;
      }

      try {
        // Fetch credit notes from Google Sheets
        // For now, using mock data
        setCreditNotes([
          {
            id: "CN-001",
            invoiceId: "INV-001",
            customerName: "Acme Corp",
            date: "2024-01-20",
            amount: 5000,
            reason: "Product return",
            status: "Issued",
            createdAt: "2024-01-20T10:00:00Z",
          },
        ]);
      } catch (error) {
        console.error("Error initializing credit notes:", error);
        if (error.message?.includes("Google account")) {
          setShowGoogleAuth(true);
        }
      }
    };
    initData();
  }, [profile]);

  const handleCreateCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.google_tokens) {
      setShowGoogleAuth(true);
      return;
    }

    if (!newCreditNote.invoiceId || !newCreditNote.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const creditNote: CreditNote = {
        id: `CN-${Date.now()}`,
        invoiceId: newCreditNote.invoiceId,
        customerName: newCreditNote.customerName,
        date: new Date().toISOString().split("T")[0],
        amount: parseFloat(newCreditNote.amount),
        reason: newCreditNote.reason,
        status: newCreditNote.status,
        createdAt: new Date().toISOString(),
      };

      setCreditNotes((prev) => [creditNote, ...prev]);
      setNewCreditNote({
        invoiceId: "",
        customerName: "",
        amount: "",
        reason: "",
        status: "Draft",
      });
      setShowCreateModal(false);
      toast.success("Credit note created successfully!");
    } catch (error) {
      console.error("Error creating credit note:", error);
      toast.error("Failed to create credit note");
    } finally {
      setLoading(false);
    }
  };

  const filteredCreditNotes = creditNotes.filter((note) => {
    const matchesSearch =
      note.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      note.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalAmount = creditNotes.reduce((sum, note) => sum + note.amount, 0);
  const issuedAmount = creditNotes
    .filter((note) => note.status === "Issued")
    .reduce((sum, note) => sum + note.amount, 0);
  const appliedAmount = creditNotes
    .filter((note) => note.status === "Applied")
    .reduce((sum, note) => sum + note.amount, 0);

  const stats = [
    {
      title: "Total Credit Notes",
      value: creditNotes.length.toString(),
      icon: DocumentMinusIcon,
      color: "bg-blue-500",
      change: "+2 this month",
    },
    {
      title: "Total Amount",
      value: `₹${totalAmount.toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      color: "bg-red-500",
      change: "+8.5%",
    },
    {
      title: "Issued Amount",
      value: `₹${issuedAmount.toLocaleString()}`,
      icon: CalendarIcon,
      color: "bg-yellow-500",
      change: `${
        creditNotes.filter((n) => n.status === "Issued").length
      } notes`,
    },
    {
      title: "Applied Amount",
      value: `₹${appliedAmount.toLocaleString()}`,
      icon: UserIcon,
      color: "bg-green-500",
      change: `${
        creditNotes.filter((n) => n.status === "Applied").length
      } applied`,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Applied":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Issued":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

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
              Credit Notes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage credit notes for returns and adjustments
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Credit Note
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
                  placeholder="Search credit notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="applied">Applied</option>
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

        {/* Credit Notes Table */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Credit Notes ({filteredCreditNotes.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Credit Note
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reason
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
                {filteredCreditNotes.map((note, index) => (
                  <motion.tr
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mr-3">
                          <DocumentMinusIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {note.id}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Created:{" "}
                            {new Date(note.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {note.invoiceId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {note.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(note.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₹{note.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {note.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          note.status
                        )}`}
                      >
                        {note.status}
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
                ))}
              </tbody>
            </table>

            {filteredCreditNotes.length === 0 && (
              <div className="text-center py-12">
                <DocumentMinusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filterStatus !== "all"
                    ? "No credit notes match your filters."
                    : "No credit notes found. Create your first credit note to get started."}
                </p>
                {!searchTerm && filterStatus === "all" && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                  >
                    Create Credit Note
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Create Credit Note Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Credit Note"
        >
          <form onSubmit={handleCreateCreditNote} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invoice ID *
              </label>
              <select
                required
                value={newCreditNote.invoiceId}
                onChange={(e) => {
                  const selectedInvoice = invoices.find(
                    (inv) => inv.id === e.target.value
                  );
                  setNewCreditNote({
                    ...newCreditNote,
                    invoiceId: e.target.value,
                    customerName: selectedInvoice?.customerName || "",
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Invoice</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.id} - {invoice.customerName} (₹
                    {invoice.total.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                value={newCreditNote.customerName}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                placeholder="Select an invoice first"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Credit Amount (₹) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={newCreditNote.amount}
                onChange={(e) =>
                  setNewCreditNote({ ...newCreditNote, amount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason *
              </label>
              <select
                required
                value={newCreditNote.reason}
                onChange={(e) =>
                  setNewCreditNote({ ...newCreditNote, reason: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Reason</option>
                <option value="Product return">Product return</option>
                <option value="Service cancellation">
                  Service cancellation
                </option>
                <option value="Billing error">Billing error</option>
                <option value="Discount adjustment">Discount adjustment</option>
                <option value="Damaged goods">Damaged goods</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={newCreditNote.status}
                onChange={(e) =>
                  setNewCreditNote({
                    ...newCreditNote,
                    status: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="Draft">Draft</option>
                <option value="Issued">Issued</option>
                <option value="Applied">Applied</option>
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
                disabled={
                  !newCreditNote.invoiceId ||
                  !newCreditNote.amount ||
                  !newCreditNote.reason
                }
              >
                Create Credit Note
              </Button>
            </div>
          </form>
        </Modal>
      </div>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={showGoogleAuth}
        onClose={() => setShowGoogleAuth(false)}
        onSuccess={() => {
          setShowGoogleAuth(false);
          toast.success("Google account connected!");
        }}
      />
    </>
  );
}
