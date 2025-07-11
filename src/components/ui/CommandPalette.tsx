import React, { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  HomeIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  DocumentDuplicateIcon,
  CubeIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CogIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  keywords: string[]
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Overview and analytics',
      icon: HomeIcon,
      action: () => navigate('/app/dashboard'),
      keywords: ['dashboard', 'home', 'overview', 'analytics']
    },
    {
      id: 'sales',
      title: 'Sales',
      subtitle: 'Manage sales and invoices',
      icon: DocumentTextIcon,
      action: () => navigate('/app/sales'),
      keywords: ['sales', 'invoices', 'billing', 'revenue']
    },
    {
      id: 'purchases',
      title: 'Purchases',
      subtitle: 'Track purchases and expenses',
      icon: ShoppingCartIcon,
      action: () => navigate('/app/purchases'),
      keywords: ['purchases', 'expenses', 'bills', 'vendors']
    },
    {
      id: 'quotations',
      title: 'Quotations',
      subtitle: 'Create and manage quotes',
      icon: DocumentDuplicateIcon,
      action: () => navigate('/app/quotations'),
      keywords: ['quotations', 'quotes', 'estimates', 'proposals']
    },
    {
      id: 'inventory',
      title: 'Inventory',
      subtitle: 'Manage products and stock',
      icon: CubeIcon,
      action: () => navigate('/app/inventory'),
      keywords: ['inventory', 'products', 'stock', 'items']
    },
    {
      id: 'reports',
      title: 'Reports',
      subtitle: 'Business insights and analytics',
      icon: ChartBarIcon,
      action: () => navigate('/app/reports'),
      keywords: ['reports', 'analytics', 'insights', 'gst', 'tax']
    },
    {
      id: 'customers',
      title: 'Customers',
      subtitle: 'Manage customer database',
      icon: UserGroupIcon,
      action: () => navigate('/app/customers'),
      keywords: ['customers', 'clients', 'contacts']
    },
    {
      id: 'vendors',
      title: 'Vendors',
      subtitle: 'Manage vendor relationships',
      icon: BuildingOfficeIcon,
      action: () => navigate('/app/vendors'),
      keywords: ['vendors', 'suppliers', 'partners']
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Account and app preferences',
      icon: CogIcon,
      action: () => navigate('/app/settings'),
      keywords: ['settings', 'preferences', 'account', 'profile']
    }
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        }
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSelect = (item: CommandItem) => {
    item.action()
    onClose()
    setSearch('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
            >
              <Command className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <Command.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Search for commands..."
                    className="flex-1 py-4 bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 text-sm"
                  />
                  <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>

                <Command.List className="max-h-80 overflow-y-auto p-2">
                  <Command.Empty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    No results found.
                  </Command.Empty>

                  <Command.Group heading="Navigation">
                    {commands.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={`${item.title} ${item.keywords.join(' ')}`}
                        onSelect={() => handleSelect(item)}
                        className="flex items-center px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors data-[selected]:bg-primary-50 dark:data-[selected]:bg-primary-900/20 data-[selected]:text-primary-600 dark:data-[selected]:text-primary-400"
                      >
                        <item.icon className="h-5 w-5 mr-3 text-gray-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                </Command.List>

                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                  <span>Navigate with ↑↓ arrows</span>
                  <span>Press Enter to select</span>
                </div>
              </Command>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}