import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  CreditCardIcon,
  BanknotesIcon,
  CalendarIcon,
  UserIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { useAuthStore } from '../store/auth'
import GoogleAuthModal from '../components/GoogleAuthModal'
import toast from 'react-hot-toast'

interface Payment {
  id: string
  invoiceId: string
  customerName: string
  amount: number
  paymentMethod: string
  paymentDate: string
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded'
  reference: string
  notes: string
  createdAt: string
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGoogleAuth, setShowGoogleAuth] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMethod, setFilterMethod] = useState('all')
  const [loading, setLoading] = useState(false)
  const [newPayment, setNewPayment] = useState({
    invoiceId: '',
    customerName: '',
    amount: '',
    paymentMethod: 'Bank Transfer',
    reference: '',
    notes: '',
    status: 'Completed' as const
  })

  const { profile } = useAuthStore()

  const paymentMethods = [
    'Bank Transfer',
    'Credit Card',
    'Debit Card',
    'UPI',
    'Cash',
    'Cheque',
    'Net Banking',
    'Wallet'
  ]

  useEffect(() => {
    const initData = async () => {
      if (!profile?.google_tokens) {
        setShowGoogleAuth(true)
        return
      }
      
      try {
        // Fetch payments from Google Sheets
        // For now, using mock data
        setPayments([
          {
            id: 'PAY-001',
            invoiceId: 'INV-001',
            customerName: 'Acme Corp',
            amount: 11800,
            paymentMethod: 'Bank Transfer',
            paymentDate: '2024-01-20',
            status: 'Completed',
            reference: 'TXN123456789',
            notes: 'Payment received on time',
            createdAt: '2024-01-20T10:00:00Z'
          },
          {
            id: 'PAY-002',
            invoiceId: 'INV-002',
            customerName: 'Tech Solutions',
            amount: 17700,
            paymentMethod: 'UPI',
            paymentDate: '2024-01-22',
            status: 'Completed',
            reference: 'UPI987654321',
            notes: 'Quick payment via UPI',
            createdAt: '2024-01-22T14:30:00Z'
          },
          {
            id: 'PAY-003',
            invoiceId: 'INV-003',
            customerName: 'StartupXYZ',
            amount: 9440,
            paymentMethod: 'Cheque',
            paymentDate: '2024-01-25',
            status: 'Pending',
            reference: 'CHQ001234',
            notes: 'Cheque submitted for clearance',
            createdAt: '2024-01-25T09:15:00Z'
          }
        ])
      } catch (error) {
        console.error('Error initializing payments:', error)
        if (error.message?.includes('Google account')) {
          setShowGoogleAuth(true)
        }
      }
    }
    initData()
  }, [profile])

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile?.google_tokens) {
      setShowGoogleAuth(true)
      return
    }

    if (!newPayment.invoiceId || !newPayment.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const payment: Payment = {
        id: `PAY-${Date.now()}`,
        invoiceId: newPayment.invoiceId,
        customerName: newPayment.customerName,
        amount: parseFloat(newPayment.amount),
        paymentMethod: newPayment.paymentMethod,
        paymentDate: new Date().toISOString().split('T')[0],
        status: newPayment.status,
        reference: newPayment.reference,
        notes: newPayment.notes,
        createdAt: new Date().toISOString()
      }

      setPayments(prev => [payment, ...prev])
      setNewPayment({
        invoiceId: '',
        customerName: '',
        amount: '',
        paymentMethod: 'Bank Transfer',
        reference: '',
        notes: '',
        status: 'Completed'
      })
      setShowCreateModal(false)
      toast.success('Payment recorded successfully!')
    } catch (error) {
      console.error('Error creating payment:', error)
      toast.error('Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || payment.status.toLowerCase() === filterStatus.toLowerCase()
    const matchesMethod = filterMethod === 'all' || payment.paymentMethod === filterMethod
    return matchesSearch && matchesStatus && matchesMethod
  })

  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const completedPayments = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0)
  const pendingPayments = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0)
  const thisMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.paymentDate)
    const now = new Date()
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
  }).reduce((sum, p) => sum + p.amount, 0)

  const stats = [
    {
      title: 'Total Payments',
      value: `₹${totalPayments.toLocaleString()}`,
      icon: BanknotesIcon,
      color: 'bg-green-500',
      change: '+15.2%'
    },
    {
      title: 'Completed',
      value: `₹${completedPayments.toLocaleString()}`,
      icon: CheckCircleIcon,
      color: 'bg-blue-500',
      change: `${payments.filter(p => p.status === 'Completed').length} payments`
    },
    {
      title: 'Pending',
      value: `₹${pendingPayments.toLocaleString()}`,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      change: `${payments.filter(p => p.status === 'Pending').length} pending`
    },
    {
      title: 'This Month',
      value: `₹${thisMonthPayments.toLocaleString()}`,
      icon: CalendarIcon,
      color: 'bg-purple-500',
      change: 'Current month'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'Refunded':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'Pending':
        return <ClockIcon className="h-4 w-4" />
      case 'Failed':
        return <XCircleIcon className="h-4 w-4" />
      case 'Refunded':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  const getMethodIcon = (method: string) => {
    if (method.includes('Card') || method === 'Net Banking') {
      return <CreditCardIcon className="h-4 w-4" />
    }
    return <BanknotesIcon className="h-4 w-4" />
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track and manage all payment transactions
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Record Payment
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
                  placeholder="Search payments..."
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
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>

              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Methods</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
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

        {/* Payments Table */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Payments ({filteredPayments.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
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
                {filteredPayments.map((payment, index) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
                          <BanknotesIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.id}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Ref: {payment.reference || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {payment.invoiceId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {payment.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₹{payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        {getMethodIcon(payment.paymentMethod)}
                        <span className="ml-2">{payment.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className={getStatusIcon(payment.status) ? 'ml-1' : ''}>{payment.status}</span>
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
            
            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filterStatus !== 'all' || filterMethod !== 'all'
                    ? 'No payments match your filters.' 
                    : 'No payments found. Record your first payment to get started.'
                  }
                </p>
                {(!searchTerm && filterStatus === 'all' && filterMethod === 'all') && (
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                  >
                    Record Payment
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Record Payment Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Record New Payment"
          size="lg"
        >
          <form onSubmit={handleCreatePayment} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invoice ID *
                </label>
                <input
                  type="text"
                  required
                  value={newPayment.invoiceId}
                  onChange={(e) => setNewPayment({ ...newPayment, invoiceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter invoice ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPayment.customerName}
                  onChange={(e) => setNewPayment({ ...newPayment, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter customer name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method *
                </label>
                <select
                  required
                  value={newPayment.paymentMethod}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Transaction reference"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={newPayment.status}
                  onChange={(e) => setNewPayment({ ...newPayment, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                value={newPayment.notes}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Additional notes about the payment..."
              />
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
                disabled={!newPayment.invoiceId || !newPayment.customerName || !newPayment.amount}
              >
                Record Payment
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
          setShowGoogleAuth(false)
          toast.success('Google account connected!')
        }}
      />
    </>
  )
}