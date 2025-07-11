import React, { useState, useEffect } from 'react'
import { useSheetsStore } from '../store/sheets'
import { ChartBarIcon, DocumentArrowDownIcon, CalendarIcon } from '@heroicons/react/24/outline'

export default function Reports() {
  const { invoices, products, customers, setSpreadsheetId, fetchInvoices, fetchProducts, fetchCustomers } = useSheetsStore()
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    setSpreadsheetId('mock-spreadsheet-id')
    fetchInvoices()
    fetchProducts()
    fetchCustomers()
  }, [])

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid')
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending')
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0)

  const gstCollected = invoices.reduce((sum, inv) => sum + inv.gst, 0)

  const reportCards = [
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: ChartBarIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Paid Amount',
      value: `₹${totalPaid.toLocaleString()}`,
      icon: ChartBarIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Pending Amount',
      value: `₹${totalPending.toLocaleString()}`,
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
    },
    {
      title: 'GST Collected',
      value: `₹${gstCollected.toLocaleString()}`,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
    },
  ]

  const gstReportData = [
    { period: 'Jan 2024', sales: 125000, gst: 22500, filed: true },
    { period: 'Feb 2024', sales: 145000, gst: 26100, filed: true },
    { period: 'Mar 2024', sales: 165000, gst: 29700, filed: false },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Track your business performance and GST compliance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {reportCards.map((card) => (
          <div key={card.title} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.title}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {card.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Revenue chart will be displayed here</p>
              <p className="text-sm text-gray-400">Integration with charting library needed</p>
            </div>
          </div>
        </div>

        {/* Invoice Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Paid Invoices</span>
              <span className="text-sm font-medium text-green-600">{paidInvoices.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(paidInvoices.length / invoices.length) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending Invoices</span>
              <span className="text-sm font-medium text-yellow-600">{pendingInvoices.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${(pendingInvoices.length / invoices.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* GST Filing Report */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">GST Filing Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GST Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filing Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gstReportData.map((row) => (
                <tr key={row.period} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{row.sales.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{row.gst.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      row.filed 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {row.filed ? 'Filed' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!row.filed && (
                      <button className="text-primary-600 hover:text-primary-900">
                        File GST Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Sales Report (PDF)</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">GST Report (Excel)</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Tally Export</span>
          </button>
        </div>
      </div>
    </div>
  )
}