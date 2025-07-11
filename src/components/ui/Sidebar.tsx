import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HomeIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  DocumentDuplicateIcon,
  CubeIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/auth'
import { clsx } from 'clsx'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  description: string
}

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  className?: string
}

const navigation: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/app/dashboard', 
    icon: HomeIcon,
    description: 'Overview and analytics'
  },
  { 
    name: 'Sales', 
    href: '/app/sales', 
    icon: DocumentTextIcon,
    description: 'Invoices and sales management'
  },
  { 
    name: 'Purchases', 
    href: '/app/purchases', 
    icon: ShoppingCartIcon,
    description: 'Purchase orders and bills'
  },
  { 
    name: 'Quotations', 
    href: '/app/quotations', 
    icon: DocumentDuplicateIcon,
    description: 'Quotes and estimates'
  },
  { 
    name: 'Inventory', 
    href: '/app/inventory', 
    icon: CubeIcon,
    description: 'Products and stock management'
  },
  { 
    name: 'Reports', 
    href: '/app/reports', 
    icon: ChartBarIcon,
    description: 'Business insights and GST reports'
  },
  { 
    name: 'Customers', 
    href: '/app/customers', 
    icon: UserGroupIcon,
    description: 'Customer database'
  },
  { 
    name: 'Vendors', 
    href: '/app/vendors', 
    icon: BuildingOfficeIcon,
    description: 'Vendor management'
  },
  { 
    name: 'Settings', 
    href: '/app/settings', 
    icon: CogIcon,
    description: 'Account and preferences'
  },
]

export default function Sidebar({ collapsed, onToggleCollapse, className }: SidebarProps) {
  const location = useLocation()
  const { profile } = useAuthStore()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={clsx(
        'fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">SheetBill</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {profile?.plan} Plan
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRightIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          
          return (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                to={item.href}
                className={clsx(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <item.icon 
                  className={clsx(
                    'flex-shrink-0 h-5 w-5 transition-colors',
                    collapsed ? 'mx-auto' : 'mr-3',
                    isActive 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  )}
                />
                
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between flex-1 overflow-hidden"
                    >
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 dark:bg-primary-400 rounded-r-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>

              {/* Tooltip for collapsed state */}
              <AnimatePresence>
                {collapsed && hoveredItem === item.name && (
                  <motion.div
                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-full top-0 ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap"
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-300 dark:text-gray-400 mt-1">
                      {item.description}
                    </div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <AnimatePresence>
          {!collapsed && profile?.plan === 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-3"
            >
              <div className="text-sm font-medium text-primary-900 dark:text-primary-100 mb-1">
                Upgrade to Pro
              </div>
              <div className="text-xs text-primary-700 dark:text-primary-300 mb-3">
                Unlock unlimited features
              </div>
              <Link
                to="/app/settings/billing"
                className="block w-full px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-md text-center transition-colors"
              >
                Upgrade Now
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}