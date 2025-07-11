import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInvoiceStore } from '../store/invoice'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  UserIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PrinterIcon
} from '@heroicons/react/24/outline'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import InvoiceForm from '../components/InvoiceForm'
import { PDFGenerator } from '../lib/pdf-generator'
import { Invoice } from '../lib/invoice-service'
import toast from 'react-hot-toast'

export default function Sales() {
  const { 
    invoices, 
    customers, 
    products, 
    createInvoice, 
    updateInvoice, 
    deleteInvoice,
    getInvoiceStats,
    loading 
  } = useInvoiceStore()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [pdfGenerator, setPdfGenerator] = useState<PDFGenerator | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const invoiceStats = await getInvoiceStats()
        setStats(invoiceStats)
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }

    loadStats()

    // Initialize PDF generator with company info
    const companyInfo = {
      name: 'Your Company Name',
      address: 'Your Company Address',
      phone: '+91-9876543210',
      email: 'contact@yourcompany.com',
      gstin: 'YOUR_GSTIN_NUMBER'
    }
    setPdfGenerator(new PDFGenerator(companyInfo))
  }, [])

  const handleCreateInvoice = async (invoiceData: any) => {
    try {
      await createInvoice(invoiceData)
      setShowCreateModal(false)
      toast.success('Invoice created successfully!')
      
      // Refresh stats
      const invoiceStats = await getInvoiceStats()
      setStats(invoiceStats)
    } catch (error) {
      toast.error('Failed to create invoice')
    }
  }

  const handleUpdateInvoice = async (invoiceData: any) => {
    if (!editingInvoice) return

    try {
      await updateInvoice(editingInvoice.id, invoiceData)
      setEditingInvoice(null)
      toast.success('Invoice updated successfully!')
      
      // Refresh stats
      const invoiceStats = await getInvoiceStats()
      setStats(invoiceStats)
    } catch (error) {
      toast.error('Failed to update invoice')
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      await deleteInvoice(invoiceId)
      toast.success('Invoice deleted successfully!')
      
      // Refresh stats
      const invoiceStats = await getInvoiceStats()
      setStats(invoiceStats)
    } catch (error) {
      toast.error('Failed to delete invoice')
    }
  }

  const handleDownloadPDF = async (invoice: Invoice) => {
    if (!pdfGenerator) return

    try {
      await pdfGenerator.downloadInvoicePDF(invoice)
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      toast.error('Failed to generate PDF')
    }
  }

  const handlePrintInvoice = async (invoice: Invoice) => {
    if (!pdfGenerator) return

    try {
      await pdfGenerator.printInvoice(invoice)
    } catch (error) {
      toast.error('Failed to print invoice')
    }
  }

  const handleShareWhatsApp = (invoice: Invoice) => {
    if (!pdfGenerator) return

    const message = pdfGenerator.generateWhatsAppMessage(invoice)
    const whatsappUrl = `https://wa.me/?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  const handleShareEmail = (invoice: Invoice) => {
    if (!pdfGenerator) return

    const { subject, body } = pdfGenerator.generateEmailMessage(invoice)
    const emailUrl = `mailto:${invoice.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(emailUrl)
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = filterStatus === 'all' || invoice.status.toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch = invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const dashboardStats = [
    {
      title: 'Total Revenue',
      value: `₹${stats?.totalRevenue?.toLocaleString() || '0'}`,
      icon: CurrencyRupeeIcon,
      color: 'bg-blue-500',
      change: '+12.5%'
    },
    {
      title: 'Paid Amount',
      value: `₹${stats?.paidAmount?.toLocaleString() || '0'}`,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      change: '+8.2%'
    },
    {
      title: 'Pending Amount',
      value: `₹${stats?.pendingAmount?.toLocaleString() || '0'}`,
      icon: CalendarIcon,
      color: 'bg-yellow-500',
      change: '-2.1%'
    },
    {
      title: 'Overdue Invoices',
      value: stats?.overdueCount?.toString() || '0',
      icon: UserIcon,
      color: 'bg-red-500',
      change: (stats?.overdueCount || 0) > 0 ? `${stats?.overdueCount} items` : 'None'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Sent':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'Draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

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
            Manage your sales invoices and track payments
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
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
              <EyeIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
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
              {filteredInvoices.map((invoice, index) => (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mr-3">
                        <DocumentTextIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.id}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Due: {invoice.dueDate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {invoice.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {invoice.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      ₹{invoice.total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      +₹{invoice.taxAmount} tax
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        onClick={() => setEditingInvoice(invoice)}
                    <div className="flex items-center space-x-1">
                        title="View/Edit"
                      <button className="p-1 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                        <EyeIcon className="h-4 w-4" />
                        onClick={() => handleDownloadPDF(invoice)}
                      </button>
                        title="Download PDF"
                      <button className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        onClick={() => handlePrintInvoice(invoice)}
                        className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        title="Print"
                      >
                        <PrinterIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleShareWhatsApp(invoice)}
                        className="p-1 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                        title="Share via WhatsApp"
                      >
                        <ShareIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteInvoice(invoice.id)}
                      </button>
                        title="Delete"
                      <button className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No invoices match your filters.' 
                  : 'No invoices found. Create your first invoice to get started.'
                }
              </p>
              {(!searchTerm && filterStatus === 'all') && (
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4"
                >
                  Create Invoice
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Invoice"
          size="xl"
        >
          <InvoiceForm
            customers={customers}
            products={products}
            onSave={handleCreateInvoice}
            onCancel={() => setShowCreateModal(false)}
            loading={loading}
          />
        </Modal>
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <Modal
          isOpen={!!editingInvoice}
          onClose={() => setEditingInvoice(null)}
          title="Edit Invoice"
          size="xl"
        >
          <InvoiceForm
            invoice={editingInvoice}
            customers={customers}
            products={products}
            onSave={handleUpdateInvoice}
            onCancel={() => setEditingInvoice(null)}
            loading={loading}
          />
        </Modal>
      )}
    </div>
  )
}