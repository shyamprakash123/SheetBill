import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  ReceiptPercentIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  TagIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { useAuthStore } from '../store/auth'
import GoogleAuthModal from '../components/GoogleAuthModal'
import toast from 'react-hot-toast'

interface Expense {
  id: string
  description: string
  amount: number
  tax: number
  total: number
  date: string
  category: string
  vendor: string
  paymentMethod: string
  receiptUrl?: string
  status: 'Pending' | 'Approved' | 'Rejected'
  approvedBy?: string
  createdAt: string
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGoogleAuth, setShowGoogleAuth] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    tax: '',
    category: '',
    vendor: '',
    paymentMethod: 'Cash',
    status: 'Pending' as const
  })

  const { profile } = useAuthStore()

  const categories = [
    'Office Supplies',
    'Travel',
    'Meals & Entertainment',
    'Software & Subscriptions',
    'Marketing',
    'Utilities',
    'Rent',
    'Professional Services',
    'Equipment',
    'Other'
  ]

  useEffect(() => {
    const initData = async () => {
      if (!profile?.google_tokens) {
        setShowGoogleAuth(true)
        return
      }
      
      try {
        // Fetch expenses from Google Sheets
        // For now, using mock data
        setExpenses([
          {
            id: 'EXP-001',
            description: 'Office supplies purchase',
            amount: 5000,
            tax: 900,
            total: 5900,
            date: '2024-01-15',
            category: 'Office Supplies',
            vendor: 'Staples India',
            paymentMethod: 'Credit Card',
            status: 'Approved',
            approvedBy: 'Manager',
            createdAt: '2024-01-15T10:00:00Z'
          },
          {
            id: 'EXP-002',
            description: 'Business lunch with client',
            amount: 2500,
            tax: 450,
            total: 2950,
            date: '2024-01-18',
            category: 'Meals & Entertainment',
            vendor: 'Restaurant ABC',
            paymentMethod: 'Cash',
            status: 'Pending',
            createdAt: '2024-01-18T14:30:00Z'
          }
        ])
      } catch (error) {
        console.error('Error initializing expenses:', error)
        if (error.message?.includes('Google account')) {
          setShowGoogleAuth(true)
        }
      }
    }
    initData()
  }, [profile])

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile?.google_tokens) {
      setShowGoogleAuth(true)
      return
    }

    if (!newExpense.description || !newExpense.amount || !newExpense.category) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const amount = parseFloat(newExpense.amount)
      const tax = parseFloat(newExpense.tax) || 0
      const total = amount + tax

      const expense: Expense = {
        id: `EXP-${Date.now()}`,
        description: newExpense.description,
        amount,
        tax,
        total,
        date: new Date().toISOString().split('T')[0],
        category: newExpense.category,
        vendor: newExpense.vendor,
        paymentMethod: newExpense.paymentMethod,
        status: newExpense.status,
        createdAt: new Date().toISOString()
      }

      setExpenses(prev => [expense, ...prev])
      setNewExpense({ 
        description: '', 
        amount: '', 
        tax: '', 
        category: '', 
        vendor: '', 
        paymentMethod: 'Cash', 
        status: 'Pending' 
      })
      setShowCreateModal(false)
      toast.success('Expense created successfully!')
    } catch (error) {
      console.error('Error creating expense:', error)
      toast.error('Failed to create expense')
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory
    const matchesStatus = filterStatus === 'all' || expense.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.total, 0)
  const approvedExpenses = expenses.filter(exp => exp.status === 'Approved').reduce((sum, exp) => sum + exp.total, 0)
  const pendingExpenses = expenses.filter(exp => exp.status === 'Pending').reduce((sum, exp) => sum + exp.total, 0)
  const thisMonthExpenses = expenses.filter(exp => {
    const expenseDate = new Date(exp.date)
    const now = new Date()
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
  }).reduce((sum, exp) => sum + exp.total, 0)

  const stats = [
    {
      title: 'Total Expenses',
      value: `₹${totalExpenses.toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      color: 'bg-red-500',
      change: '+8.2%'
    },
    {
      title: 'Approved Amount',
      value: `₹${approvedExpenses.toLocaleString()}`,
      icon: ReceiptPercentIcon,
      color: 'bg-green-500',
      change: `${expenses.filter(e => e.status === 'Approved').length} approved`
    },
    {
      title: 'Pending Approval',
      value: `₹${pendingExpenses.toLocaleString()}`,
      icon: CalendarIcon,
      color: 'bg-yellow-500',
      change: `${expenses.filter(e => e.status === 'Pending').length} pending`
    },
    {
      title: 'This Month',
      value: `₹${thisMonthExpenses.toLocaleString()}`,
      icon: TagIcon,
      color: 'bg-blue-500',
      change: 'Current month'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ]
    const index = categories.indexOf(category) % colors.length
    return colors[index] || 'bg-gray-100 text-gray-800'
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expense Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track and manage business expenses with receipt uploads
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Expense
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
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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

        {/* Expenses Table */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Expenses ({filteredExpenses.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expense
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment Method
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
                {filteredExpenses.map((expense, index) => (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mr-3">
                          <ReceiptPercentIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {expense.id}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {expense.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {expense.vendor || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ₹{expense.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        +₹{expense.tax.toLocaleString()} tax
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {expense.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                        {expense.status}
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
            
            {filteredExpenses.length === 0 && (
              <div className="text-center py-12">
                <ReceiptPercentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                    ? 'No expenses match your filters.' 
                    : 'No expenses found. Add your first expense to get started.'
                  }
                </p>
                {(!searchTerm && filterCategory === 'all' && filterStatus === 'all') && (
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                  >
                    Add Expense
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Create Expense Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add New Expense"
          size="lg"
        >
          <form onSubmit={handleCreateExpense} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <input
                type="text"
                required
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter expense description"
              />
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
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tax (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newExpense.tax}
                  onChange={(e) => setNewExpense({ ...newExpense, tax: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vendor/Supplier
              </label>
              <input
                type="text"
                value={newExpense.vendor}
                onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter vendor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Receipt Upload
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Click to upload receipt or drag and drop
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, PDF up to 10MB</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  id="receipt-upload"
                />
                <label
                  htmlFor="receipt-upload"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                >
                  Choose File
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={newExpense.status}
                onChange={(e) => setNewExpense({ ...newExpense, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
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
                disabled={!newExpense.description || !newExpense.amount || !newExpense.category}
              >
                Add Expense
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