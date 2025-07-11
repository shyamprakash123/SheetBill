import React from 'react'
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/auth'
import { useSheetsStore } from '../store/sheets'
import {
  HomeIcon,
  DocumentTextIcon,
  CubeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import ThemeToggle from './ui/ThemeToggle'
import Button from './ui/Button'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon },
  { name: 'Products', href: '/products', icon: CubeIcon },
  { name: 'Customers', href: '/customers', icon: UserGroupIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

export default function Layout() {
  const location = useLocation()
  const { user, profile, signOut } = useAuthStore()
  const { invoices, products, customers } = useSheetsStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getPlanLimits = () => {
    const plan = profile?.plan || 'free'
    const limits = {
      free: { invoices: 10, products: 50, customers: 25 },
      starter: { invoices: 100, products: 500, customers: 250 },
      professional: { invoices: 1000, products: 5000, customers: 2500 },
      enterprise: { invoices: -1, products: -1, customers: -1 },
    }
    return limits[plan as keyof typeof limits]
  }

  const limits = getPlanLimits()
  const invoiceCount = invoices.length
  const productCount = products.length
  const customerCount = customers.length

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        animate={sidebarOpen ? 'open' : 'closed'}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg lg:translate-x-0 lg:static lg:inset-0"
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">SheetBill</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <motion.li
                  key={item.name}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-r-2 border-primary-500'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </motion.li>
              )
            })}
          </ul>
        </nav>

        {/* Plan limits for free users */}
        {profile?.plan === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4"
          >
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Free Plan Usage</h4>
              <div className="space-y-2 text-xs text-yellow-700 dark:text-yellow-300">
                <div className="flex justify-between">
                  <span>Invoices:</span>
                  <span className={invoiceCount >= limits.invoices ? 'text-red-600 font-medium' : ''}>
                    {invoiceCount}/{limits.invoices}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Products:</span>
                  <span className={productCount >= limits.products ? 'text-red-600 font-medium' : ''}>
                    {productCount}/{limits.products}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Customers:</span>
                  <span className={customerCount >= limits.customers ? 'text-red-600 font-medium' : ''}>
                    {customerCount}/{limits.customers}
                  </span>
                </div>
              </div>
              <Link to="/settings/billing">
                <Button size="sm" className="w-full mt-3 text-xs">
                  Upgrade Plan →
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700"
        >
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              
              <div className="relative hidden sm:block">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 relative"
              >
                <BellIcon className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </motion.button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {profile?.full_name || profile?.email}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {profile?.plan} Plan
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="p-2"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Page content */}
        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}