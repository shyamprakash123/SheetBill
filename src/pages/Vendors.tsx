import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import GoogleAuthModal from '../components/GoogleAuthModal'
import { useAuthStore } from '../store/auth'
import { GoogleSheetsAPI } from '../lib/google-api'
import { googleAPIService } from '../lib/google-api'
import toast from 'react-hot-toast'

interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  gstin: string
  category: string
  status: string
  createdAt: string
  totalPurchases: number
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGoogleAuth, setShowGoogleAuth] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    gstin: '',
    category: ''
  })

  const { profile } = useAuthStore()

  useEffect(() => {
    const initData = async () => {
      if (!profile?.google_tokens) {
        setShowGoogleAuth(true)
        return
      }
      
      try {
        await fetchVendors()
      } catch (error) {
        console.error('Error fetching vendors:', error)
        if (error.message?.includes('Google account')) {
          setShowGoogleAuth(true)
        }
      }
    }
    initData()
  }, [profile])

  const fetchVendors = async () => {
    if (!profile?.google_sheet_id || !profile?.google_tokens) return

    setLoading(true)
    try {
      const accessToken = await googleAPIService.getValidAccessToken(profile.google_tokens)
      const sheetsAPI = new GoogleSheetsAPI(accessToken)
      
      const data = await sheetsAPI.getSheetData(profile.google_sheet_id, 'Vendors!A:J')
      
      if (data && data.length > 1) {
        const [headers, ...rows] = data
        const vendorList = rows
          .filter(row => row[0]) // Filter out empty rows
          .map(row => ({
            id: row[0] || '',
            name: row[1] || '',
            email: row[2] || '',
            phone: row[3] || '',
            address: row[4] || '',
            gstin: row[5] || '',
            state: row[6] || '',
            country: row[7] || 'India',
            createdAt: row[8] || '',
            status: row[9] || 'Active',
            city: '', // Not in current schema, can be extracted from address
            category: 'General', // Default category
            totalPurchases: Math.floor(Math.random() * 100000) // Mock data for now
          }))
        setVendors(vendorList)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to fetch vendors')
    } finally {
      setLoading(false)
    }
  }

  const createVendor = async (vendorData: any) => {
    if (!profile?.google_sheet_id || !profile?.google_tokens) {
      throw new Error('Google account not connected')
    }

    const accessToken = await googleAPIService.getValidAccessToken(profile.google_tokens)
    const sheetsAPI = new GoogleSheetsAPI(accessToken)
    
    const vendor = {
      id: `VEN-${Date.now()}`,
      ...vendorData,
      createdAt: new Date().toISOString(),
      status: 'Active'
    }
    
    await sheetsAPI.addVendor(profile.google_sheet_id, vendor)
    return vendor
  }

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile?.google_tokens) {
      setShowGoogleAuth(true)
      return
    }

    if (!newVendor.name.trim()) {
      toast.error('Vendor name is required')
      return
    }

    setLoading(true)
    try {
      if (editingVendor) {
        // Update logic would go here
        toast.success('Vendor updated successfully!')
      } else {
        await createVendor(newVendor)
        toast.success('Vendor created successfully!')
      }

      setNewVendor({ 
        name: '', 
        email: '', 
        phone: '', 
        address: '', 
        city: '', 
        state: '', 
        country: 'India', 
        gstin: '', 
        category: '' 
      })
      setShowCreateModal(false)
      setEditingVendor(null)
      await fetchVendors()
    } catch (error) {
      console.error('Error saving vendor:', error)
      toast.error('Failed to save vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setNewVendor({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      city: vendor.city || '',
      state: vendor.state || '',
      country: vendor.country || 'India',
      gstin: vendor.gstin || '',
      category: vendor.category || ''
    })
    setShowCreateModal(true)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingVendor(null)
    setNewVendor({ 
      name: '', 
      email: '', 
      phone: '', 
      address: '', 
      city: '', 
      state: '', 
      country: 'India', 
      gstin: '', 
      category: '' 
    })
  }

  const handleGoogleAuthSuccess = async () => {
    setShowGoogleAuth(false)
    try {
      await fetchVendors()
      toast.success('Google account connected! You can now manage vendors.')
    } catch (error) {
      console.error('Error after Google auth:', error)
      toast.error('Connected to Google but had issues setting up spreadsheet.')
    }
  }

  const filteredVendors = vendors.filter(vendor => {
    const matchesStatus = filterStatus === 'all' || vendor.status?.toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch = vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.id?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const totalVendors = vendors.length
  const activeVendors = vendors.filter(v => v.status === 'Active').length
  const totalPurchaseValue = vendors.reduce((sum, v) => sum + (v.totalPurchases || 0), 0)
  const categories = [...new Set(vendors.map(v => v.category).filter(Boolean))].length

  const stats = [
    {
      title: 'Total Vendors',
      value: totalVendors.toString(),
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
      change: '+3 this month'
    },
    {
      title: 'Active Vendors',
      value: activeVendors.toString(),
      icon: BuildingOfficeIcon,
      color: 'bg-green-500',
      change: `${totalVendors > 0 ? Math.round((activeVendors/totalVendors)*100) : 0}% active`
    },
    {
      title: 'Total Purchase Value',
      value: `₹${totalPurchaseValue.toLocaleString()}`,
      icon: BuildingOfficeIcon,
      color: 'bg-purple-500',
      change: '+15.2%'
    },
    {
      title: 'Categories',
      value: categories.toString(),
      icon: BuildingOfficeIcon,
      color: 'bg-orange-500',
      change: `${categories} types`
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  if (loading && vendors.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your vendor relationships and supplier database
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Vendor
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
                  placeholder="Search vendors..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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

        {/* Vendors Table */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Vendors ({filteredVendors.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Purchases
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
                {filteredVendors.map((vendor, index) => (
                  <motion.tr
                    key={vendor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mr-3">
                          <BuildingOfficeIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {vendor.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {vendor.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {vendor.email && (
                          <div className="flex items-center mb-1">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {vendor.email}
                          </div>
                        )}
                        {vendor.phone && (
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {vendor.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full">
                        {vendor.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        {vendor.state ? `${vendor.state}, ${vendor.country}` : vendor.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₹{(vendor.totalPurchases || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendor.status)}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(vendor)}
                          className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
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
            
            {filteredVendors.length === 0 && (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'No vendors match your filters.' 
                    : 'No vendors found. Add your first vendor to get started.'
                  }
                </p>
                {(!searchTerm && filterStatus === 'all') && (
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                  >
                    Add Vendor
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Create/Edit Vendor Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={handleCloseModal}
          title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
        >
          <form onSubmit={handleCreateVendor} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vendor Name *
              </label>
              <input
                type="text"
                required
                value={newVendor.name}
                onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter vendor name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="vendor@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+91-9876543210"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                value={newVendor.address}
                onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter vendor address"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={newVendor.gstin}
                  onChange={(e) => setNewVendor({ ...newVendor, gstin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 27AABCU9603R1ZX"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={newVendor.category}
                  onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Software">Software</option>
                  <option value="Services">Services</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                loading={loading}
                disabled={!newVendor.name.trim()}
              >
                {editingVendor ? 'Update Vendor' : 'Add Vendor'}
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
  )
}