import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  ClipboardDocumentListIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { useAuthStore } from '../store/auth'
import GoogleAuthModal from '../components/GoogleAuthModal'
import toast from 'react-hot-toast'

interface PurchaseOrder {
  id: string
  vendorName: string
  date: string
  expectedDelivery: string
  amount: number
  tax: number
  total: number
  status: 'Draft' | 'Sent' | 'Approved' | 'Received' | 'Cancelled'
  items: number
  notes: string
  createdAt: string
}

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGoogleAuth, setShowGoogleAuth] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)
  const [newPO, setNewPO] = useState({
    vendorName: '',
    expectedDelivery: '',
    amount: '',
    tax: '',
    notes: '',
    status: 'Draft' as const
  })

  const { profile } = useAuthStore()

  useEffect(() => {
    const initData = async () => {
      if (!profile?.google_tokens) {
        setShowGoogleAuth(true)
        return
      }
      
      try {
        // Fetch purchase orders from Google Sheets
        // For now, using mock data
        setPurchaseOrders([
          {
            id: 'PO-001',
            vendorName: 'Tech Supplies Ltd',
            date: '2024-01-15',
            expectedDelivery: '2024-01-25',
            amount: 50000,
            tax: 9000,
            total: 59000,
            status: 'Sent',
            items: 5,
            notes: 'Urgent delivery required',
            createdAt: '2024-01-15T10:00:00Z'
          },
          {
            id: 'PO-002',
            vendorName: 'Office Mart',
            date: '2024-01-18',
            expectedDelivery: '2024-01-28',
            amount: 25000,
            tax: 4500,
            total: 29500,
            status: 'Approved',
            items: 3,
            notes: 'Standard delivery',
            createdAt: '2024-01-18T14:30:00Z'
          }
        ])
      } catch (error) {
        console.error('Error initializing purchase orders:', error)
        if (error.message?.includes('Google account')) {
          setShowGoogleAuth(true)
        }
      }
    }
    initData()
  }, [profile])

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile?.google_tokens) {
      setShowGoogleAuth(true)
      return
    }

    if (!newPO.vendorName || !newPO.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const amount = parseFloat(newPO.amount)
      const tax = parseFloat(newPO.tax) || 0
      const total = amount + tax

      const purchaseOrder: PurchaseOrder = {
        id: `PO-${Date.now()}`,
        vendorName: newPO.vendorName,
        date: new Date().toISOString().split('T')[0],
        expectedDelivery: newPO.expectedDelivery,
        amount,
        tax,
        total,
        status: newPO.status,
        items: 1, // Default
        notes: newPO.notes,
        createdAt: new Date().toISOString()
      }

      setPurchaseOrders(prev => [purchaseOrder, ...prev])
      setNewPO({ vendorName: '', expectedDelivery: '', amount: '', tax: '', notes: '', status: 'Draft' })
      setShowCreateModal(false)
      toast.success('Purchase order created successfully!')
    } catch (error) {
      console.error('Error creating purchase order:', error)
      toast.error('Failed to create purchase order')
    } finally {
      setLoading(false)
    }
  }

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || po.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const totalValue = purchaseOrders.reduce((sum, po) => sum + po.total, 0)
  const pendingValue = purchaseOrders.filter(po => po.status === 'Sent').reduce((sum, po) => sum + po.total, 0)
  const approvedValue = purchaseOrders.filter(po => po.status === 'Approved').reduce((sum, po) => sum + po.total, 0)

  const stats = [
    {
      title: 'Total Purchase Orders',
      value: purchaseOrders.length.toString(),
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-500',
      change: '+3 this month'
    },
    {
      title: 'Total Value',
      value: `₹${totalValue.toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      color: 'bg-green-500',
      change: '+12.5%'
    },
    {
      title: 'Pending Approval',
      value: `₹${pendingValue.toLocaleString()}`,
      icon: CalendarIcon,
      color: 'bg-yellow-500',
      change: `${purchaseOrders.filter(po => po.status === 'Sent').length} orders`
    },
    {
      title: 'Approved Value',
      value: `₹${approvedValue.toLocaleString()}`,
      icon: BuildingOfficeIcon,
      color: 'bg-purple-500',
      change: `${purchaseOrders.filter(po => po.status === 'Approved').length} approved`
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'Received':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'Draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckIcon className="h-4 w-4" />
      case 'Cancelled':
        return <XMarkIcon className="h-4 w-4" />
      default:
        return null
    }
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage purchase orders for your vendors
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Purchase Order
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
                  placeholder="Search purchase orders..."
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
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="received">Received</option>
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

        {/* Purchase Orders Table */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Purchase Orders ({filteredPOs.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Purchase Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Items
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
                {filteredPOs.map((po, index) => (
                  <motion.tr
                    key={po.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                          <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {po.id}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Created: {new Date(po.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {po.vendorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(po.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ₹{po.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        +₹{po.tax.toLocaleString()} tax
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full">
                        {po.items} items
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(po.status)}`}>
                        {getStatusIcon(po.status)}
                        <span className={getStatusIcon(po.status) ? 'ml-1' : ''}>{po.status}</span>
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
            
            {filteredPOs.length === 0 && (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'No purchase orders match your filters.' 
                    : 'No purchase orders found. Create your first purchase order to get started.'
                  }
                </p>
                {(!searchTerm && filterStatus === 'all') && (
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                  >
                    Create Purchase Order
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Create Purchase Order Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Purchase Order"
          size="lg"
        >
          <form onSubmit={handleCreatePO} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vendor Name *
              </label>
              <input
                type="text"
                required
                value={newPO.vendorName}
                onChange={(e) => setNewPO({ ...newPO, vendorName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter vendor name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={newPO.expectedDelivery}
                onChange={(e) => setNewPO({ ...newPO, expectedDelivery: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  value={newPO.amount}
                  onChange={(e) => setNewPO({ ...newPO, amount: e.target.value })}
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
                  value={newPO.tax}
                  onChange={(e) => setNewPO({ ...newPO, tax: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={newPO.status}
                onChange={(e) => setNewPO({ ...newPO, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Approved">Approved</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                value={newPO.notes}
                onChange={(e) => setNewPO({ ...newPO, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Additional notes or requirements..."
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
                disabled={!newPO.vendorName || !newPO.amount}
              >
                Create Purchase Order
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