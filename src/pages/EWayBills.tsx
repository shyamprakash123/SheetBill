import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  TruckIcon,
  DocumentTextIcon,
  CalendarIcon,
  MapPinIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { useAuthStore } from '../store/auth'
import GoogleAuthModal from '../components/GoogleAuthModal'
import toast from 'react-hot-toast'

interface EWayBill {
  id: string
  ewayBillNo: string
  invoiceNo: string
  consignorName: string
  consigneeName: string
  fromPlace: string
  toPlace: string
  distance: number
  vehicleNo: string
  transporterName: string
  goodsValue: number
  validUpto: string
  status: 'Generated' | 'In Transit' | 'Delivered' | 'Cancelled' | 'Expired'
  generatedDate: string
  createdAt: string
}

export default function EWayBills() {
  const [eWayBills, setEWayBills] = useState<EWayBill[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGoogleAuth, setShowGoogleAuth] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)
  const [newEWayBill, setNewEWayBill] = useState({
    invoiceNo: '',
    consignorName: '',
    consigneeName: '',
    fromPlace: '',
    toPlace: '',
    distance: '',
    vehicleNo: '',
    transporterName: '',
    goodsValue: ''
  })

  const { profile } = useAuthStore()

  useEffect(() => {
    const initData = async () => {
      if (!profile?.google_tokens) {
        setShowGoogleAuth(true)
        return
      }
      
      try {
        // Fetch E-Way Bills from Google Sheets
        // For now, using mock data
        setEWayBills([
          {
            id: 'EWB-001',
            ewayBillNo: '123456789012',
            invoiceNo: 'INV-001',
            consignorName: 'ABC Company Ltd',
            consigneeName: 'XYZ Enterprises',
            fromPlace: 'Mumbai, MH',
            toPlace: 'Delhi, DL',
            distance: 1400,
            vehicleNo: 'MH01AB1234',
            transporterName: 'Fast Logistics',
            goodsValue: 150000,
            validUpto: '2024-01-25',
            status: 'In Transit',
            generatedDate: '2024-01-15',
            createdAt: '2024-01-15T10:00:00Z'
          },
          {
            id: 'EWB-002',
            ewayBillNo: '123456789013',
            invoiceNo: 'INV-002',
            consignorName: 'Tech Solutions Pvt Ltd',
            consigneeName: 'Digital Corp',
            fromPlace: 'Bangalore, KA',
            toPlace: 'Chennai, TN',
            distance: 350,
            vehicleNo: 'KA05CD5678',
            transporterName: 'Express Transport',
            goodsValue: 75000,
            validUpto: '2024-01-20',
            status: 'Delivered',
            generatedDate: '2024-01-18',
            createdAt: '2024-01-18T14:30:00Z'
          }
        ])
      } catch (error) {
        console.error('Error initializing E-Way Bills:', error)
        if (error.message?.includes('Google account')) {
          setShowGoogleAuth(true)
        }
      }
    }
    initData()
  }, [profile])

  const handleCreateEWayBill = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile?.google_tokens) {
      setShowGoogleAuth(true)
      return
    }

    if (!newEWayBill.invoiceNo || !newEWayBill.consignorName || !newEWayBill.consigneeName) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const validUpto = new Date()
      validUpto.setDate(validUpto.getDate() + 3) // Valid for 3 days

      const eWayBill: EWayBill = {
        id: `EWB-${Date.now()}`,
        ewayBillNo: Math.random().toString().slice(2, 14), // Mock E-Way Bill number
        invoiceNo: newEWayBill.invoiceNo,
        consignorName: newEWayBill.consignorName,
        consigneeName: newEWayBill.consigneeName,
        fromPlace: newEWayBill.fromPlace,
        toPlace: newEWayBill.toPlace,
        distance: parseInt(newEWayBill.distance) || 0,
        vehicleNo: newEWayBill.vehicleNo,
        transporterName: newEWayBill.transporterName,
        goodsValue: parseFloat(newEWayBill.goodsValue) || 0,
        validUpto: validUpto.toISOString().split('T')[0],
        status: 'Generated',
        generatedDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      }

      setEWayBills(prev => [eWayBill, ...prev])
      setNewEWayBill({
        invoiceNo: '',
        consignorName: '',
        consigneeName: '',
        fromPlace: '',
        toPlace: '',
        distance: '',
        vehicleNo: '',
        transporterName: '',
        goodsValue: ''
      })
      setShowCreateModal(false)
      toast.success('E-Way Bill generated successfully!')
    } catch (error) {
      console.error('Error creating E-Way Bill:', error)
      toast.error('Failed to generate E-Way Bill')
    } finally {
      setLoading(false)
    }
  }

  const filteredEWayBills = eWayBills.filter(bill => {
    const matchesSearch = bill.ewayBillNo.includes(searchTerm) ||
                         bill.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.consignorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.consigneeName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || bill.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const totalBills = eWayBills.length
  const activeBills = eWayBills.filter(bill => bill.status === 'In Transit' || bill.status === 'Generated').length
  const deliveredBills = eWayBills.filter(bill => bill.status === 'Delivered').length
  const totalValue = eWayBills.reduce((sum, bill) => sum + bill.goodsValue, 0)

  const stats = [
    {
      title: 'Total E-Way Bills',
      value: totalBills.toString(),
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      change: '+5 this month'
    },
    {
      title: 'Active Bills',
      value: activeBills.toString(),
      icon: TruckIcon,
      color: 'bg-yellow-500',
      change: 'In transit'
    },
    {
      title: 'Delivered',
      value: deliveredBills.toString(),
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      change: 'Completed'
    },
    {
      title: 'Total Goods Value',
      value: `₹${totalValue.toLocaleString()}`,
      icon: CalendarIcon,
      color: 'bg-purple-500',
      change: '+12.5%'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Generated':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'In Transit':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'Expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Generated':
        return <DocumentTextIcon className="h-4 w-4" />
      case 'In Transit':
        return <TruckIcon className="h-4 w-4" />
      case 'Delivered':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'Cancelled':
        return <XCircleIcon className="h-4 w-4" />
      case 'Expired':
        return <ClockIcon className="h-4 w-4" />
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">E-Way Bills</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Generate and manage E-Way Bills for goods transportation
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Generate E-Way Bill
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
                  placeholder="Search E-Way Bills..."
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
                <option value="generated">Generated</option>
                <option value="in transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
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

        {/* E-Way Bills Table */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All E-Way Bills ({filteredEWayBills.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    E-Way Bill
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Goods Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valid Until
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
                {filteredEWayBills.map((bill, index) => (
                  <motion.tr
                    key={bill.id}
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
                            {bill.ewayBillNo}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Generated: {new Date(bill.generatedDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {bill.invoiceNo}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {bill.consignorName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <div>
                          <div>{bill.fromPlace}</div>
                          <div className="text-gray-500 dark:text-gray-400">to {bill.toPlace}</div>
                          <div className="text-xs text-gray-400">{bill.distance} km</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {bill.vehicleNo}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {bill.transporterName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₹{bill.goodsValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(bill.validUpto).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                        {getStatusIcon(bill.status)}
                        <span className={getStatusIcon(bill.status) ? 'ml-1' : ''}>{bill.status}</span>
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
            
            {filteredEWayBills.length === 0 && (
              <div className="text-center py-12">
                <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'No E-Way Bills match your filters.' 
                    : 'No E-Way Bills found. Generate your first E-Way Bill to get started.'
                  }
                </p>
                {(!searchTerm && filterStatus === 'all') && (
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                  >
                    Generate E-Way Bill
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Generate E-Way Bill Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Generate E-Way Bill"
          size="xl"
        >
          <form onSubmit={handleCreateEWayBill} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  value={newEWayBill.invoiceNo}
                  onChange={(e) => setNewEWayBill({ ...newEWayBill, invoiceNo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter invoice number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goods Value (₹) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={newEWayBill.goodsValue}
                  onChange={(e) => setNewEWayBill({ ...newEWayBill, goodsValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Consignor Name *
                </label>
                <input
                  type="text"
                  required
                  value={newEWayBill.consignorName}
                  onChange={(e) => setNewEWayBill({ ...newEWayBill, consignorName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Sender name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Consignee Name *
                </label>
                <input
                  type="text"
                  required
                  value={newEWayBill.consigneeName}
                  onChange={(e) => setNewEWayBill({ ...newEWayBill, consigneeName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Receiver name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Place *
                </label>
                <input
                  type="text"
                  required
                  value={newEWayBill.fromPlace}
                  onChange={(e) => setNewEWayBill({ ...newEWayBill, fromPlace: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Origin city, state"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Place *
                </label>
                <input
                  type="text"
                  required
                  value={newEWayBill.toPlace}
                  onChange={(e) => setNewEWayBill({ ...newEWayBill, toPlace: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Destination city, state"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Distance (km)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newEWayBill.distance}
                  onChange={(e) => setNewEWayBill({ ...newEWayBill, distance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={newEWayBill.vehicleNo}
                  onChange={(e) => setNewEWayBill({ ...newEWayBill, vehicleNo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., MH01AB1234"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transporter Name
                </label>
                <input
                  type="text"
                  value={newEWayBill.transporterName}
                  onChange={(e) => setNewEWayBill({ ...newEWayBill, transporterName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Transport company name"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Important Notes:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• E-Way Bill is mandatory for goods movement above ₹50,000</li>
                <li>• Valid for 1 day per 100 km (minimum 1 day)</li>
                <li>• Vehicle number can be updated during transit</li>
                <li>• Ensure all details match with the invoice</li>
              </ul>
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
                disabled={!newEWayBill.invoiceNo || !newEWayBill.consignorName || !newEWayBill.consigneeName}
              >
                Generate E-Way Bill
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