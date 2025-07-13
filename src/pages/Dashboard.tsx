import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useInvoiceStore } from '../store/invoice'
import {
  DocumentTextIcon,
  CubeIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import GoogleAuthModal from '../components/GoogleAuthModal'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { profile } = useAuthStore()
  const { 
    invoices, 
    products, 
    customers, 
    initializeService,
    getInvoiceStats,
    loading 
  } = useInvoiceStore()
  
  const [showGoogleAuth, setShowGoogleAuth] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const initData = async () => {
      // Check if Google account is connected
      const { getGoogleTokens } = useAuthStore.getState()
      const tokens = await getGoogleTokens()
      
      if (!tokens || !tokens.access_token) {
        setShowGoogleAuth(true)
        return
      }

      try {
        await initializeService()
        const invoiceStats = await getInvoiceStats()
        setStats(invoiceStats)
      } catch (error) {
        console.error('Error initializing dashboard:', error)
        // Only show auth modal if it's an authentication error
        if (error.message?.includes('Google account')) {
          setShowGoogleAuth(true)
        } else {
          // For other errors, show a toast but don't force re-auth
          toast.error('Some features may not work properly. Please check your connection.')
        }
      }
    }

    initData()
  }, [profile])

  const handleGoogleAuthSuccess = async () => {
    setShowGoogleAuth(false)
    try {
      await initializeService()
      const invoiceStats = await getInvoiceStats()
      setStats(invoiceStats)
      toast.success('Google account connected successfully!')
    } catch (error) {
      console.error('Error after Google auth:', error)
      toast.error('Connected to Google but had issues setting up spreadsheet. You can still use the app.')
    }
  }

  const dashboardStats = [
    {
      name: 'Total Revenue',
      value: `₹${stats?.totalRevenue?.toLocaleString() || '0'}`,
      icon: CurrencyRupeeIcon,
      change: '+15.3%',
      changeType: 'increase' as const,
      color: 'bg-green-500',
    },
    {
      name: 'Total Invoices',
      value: stats?.totalInvoices?.toString() || '0',
      icon: DocumentTextIcon,
      change: `${stats?.paidCount || 0} paid`,
      changeType: 'neutral' as const,
      color: 'bg-blue-500',
    },
    {
      name: 'Products',
      value: products.length.toString(),
      icon: CubeIcon,
      change: '+5 this month',
      changeType: 'increase' as const,
      color: 'bg-purple-500',
    },
    {
      name: 'Customers',
      value: customers.length.toString(),
      icon: UserGroupIcon,
      change: '+8.2%',
      changeType: 'increase' as const,
      color: 'bg-orange-500',
    },
  ]

  const recentInvoices = invoices.slice(0, 5)
  const quickActions = [
    {
      title: 'New Invoice',
      description: 'Create a new invoice',
      icon: DocumentTextIcon,
      href: '/app/sales',
      color: 'bg-blue-500',
    },
    {
      title: 'Add Product',
      description: 'Add a new product',
      icon: CubeIcon,
      href: '/app/inventory',
      color: 'bg-purple-500',
    },
    {
      title: 'Add Customer',
      description: 'Add a new customer',
      icon: UserGroupIcon,
      href: '/app/customers',
      color: 'bg-green-500',
    },
    {
      title: 'View Reports',
      description: 'Check business insights',
      icon: CurrencyRupeeIcon,
      href: '/app/reports',
      color: 'bg-orange-500',
    },
  ]

  if (loading) {
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
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <EyeIcon className="h-4 w-4 mr-2" />
              View All
            </Button>
            <Link to="/app/sales">
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card hover className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                  <div className={`flex items-center mt-2 text-sm ${
                    stat.changeType === 'increase' 
                      ? 'text-green-600 dark:text-green-400' 
                      : stat.changeType === 'decrease'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {stat.changeType === 'increase' && (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    )}
                    {stat.changeType === 'decrease' && (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Invoices */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Invoices
              </h3>
              <Link to="/app/sales">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((invoice, index) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        invoice.status === 'Paid' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : invoice.status === 'Overdue'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-yellow-100 dark:bg-yellow-900/30'
                      }`}>
                        <DocumentTextIcon className={`h-5 w-5 ${
                          invoice.status === 'Paid' 
                            ? 'text-green-600 dark:text-green-400' 
                            : invoice.status === 'Overdue'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {invoice.id}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {invoice.customerName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ₹{invoice.total.toLocaleString()}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.status === 'Paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : invoice.status === 'Overdue'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices yet. Create your first invoice to get started.</p>
                  <Link to="/app/sales" className="mt-2 inline-block">
                    <Button size="sm">Create Invoice</Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
                >
                  <Link to={action.href}>
                    <div className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 group">
                      <div className={`p-2 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {action.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Business Insights */}
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Business Insights
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending Revenue</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₹{stats?.pendingAmount?.toLocaleString() || '0'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overdue Invoices</span>
                <span className={`font-semibold ${
                  (stats?.overdueCount || 0) > 0 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {stats?.overdueCount || 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Collection Rate</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats?.totalInvoices > 0 ? Math.round((stats.paidCount / stats.totalInvoices) * 100) : 0}%
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Plan Upgrade Banner */}
      {profile?.plan === 'free' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Ready to grow your business?
                </h3>
                <p className="text-primary-100">
                  Upgrade to unlock unlimited invoices, advanced reports, and priority support.
                </p>
              </div>
              <Link to="/settings/billing">
                <Button variant="secondary" className="bg-white text-primary-600 hover:bg-gray-100">
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      )}
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