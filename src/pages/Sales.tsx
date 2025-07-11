import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { useInvoiceStore } from '../store/invoice'
import toast from 'react-hot-toast'

export default function Sales() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  
  const { 
    invoices, 
    loading, 
    initializeService, 
    fetchInvoices,
    deleteInvoice 
  } = useInvoiceStore()

  useEffect(() => {
    const initData = async () => {
      try {
        await initializeService()
        await fetchInvoices()
      } catch (error) {
        console.error('Error initializing sales data:', error)
      }
    }
    initData()
  }, [])

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice)
    setIsModalOpen(true)
  }

  const handleDelete = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(invoiceId)
        toast.success('Invoice deleted successfully')
      } catch (error) {
        toast.error('Failed to delete invoice')
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingInvoice(null)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getTotalRevenue = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.total, 0)
  }

  const getPendingAmount = () => {
    return invoices
      .filter(invoice => invoice.status === 'Pending' || invoice.status === 'Sent')
      .reduce((sum, invoice) => sum + invoice.total, 0)
  }

  const getInvoiceCount = () => {
    return invoices.length
  }

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(getTotalRevenue()),
      icon: CurrencyRupeeIcon,
      color: 'bg-green-500',
      change: '+12.5%'
    },
    {
      title: 'Pending Amount',
      value: formatCurrency(getPendingAmount()),
      icon: CalendarIcon,
      color: 'bg-yellow-500',
      change: '3 invoices'
    },
    {
      title: 'Total Invoices',
      value: getInvoiceCount().toString(),
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      change: '+2 this month'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales & Invoices</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your sales invoices and track revenue
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                placeholder="Search invoices..."
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
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
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

      {/* Invoices Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Invoices ({filteredInvoices.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                          <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {invoice.id}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Due: {formatDate(invoice.dueDate)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {invoice.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(invoice.total)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        +{formatCurrency(invoice.taxAmount)} tax
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="p-1 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
      >
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Invoice form will be implemented here.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleCloseModal}>
              Save Invoice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}