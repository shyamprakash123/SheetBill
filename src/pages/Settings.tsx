import React, { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { 
  UserIcon, 
  CreditCardIcon, 
  CogIcon, 
  ShieldCheckIcon,
  LinkIcon,
  BellIcon 
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function Settings() {
  const { profile, updateProfile } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
  })

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
    { id: 'integrations', name: 'Integrations', icon: LinkIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  ]

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile(profileData)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: '/month',
      features: ['10 invoices/month', '50 products', '25 customers', 'Basic reports'],
      current: profile?.plan === 'free',
    },
    {
      name: 'Starter',
      price: '₹499',
      period: '/month',
      features: ['100 invoices/month', '500 products', '250 customers', 'Advanced reports', 'Email support'],
      current: profile?.plan === 'starter',
    },
    {
      name: 'Professional',
      price: '₹999',
      period: '/month',
      features: ['1000 invoices/month', '5000 products', '2500 customers', 'All reports', 'Priority support', 'API access'],
      current: profile?.plan === 'professional',
    },
    {
      name: 'Enterprise',
      price: '₹1999',
      period: '/month',
      features: ['Unlimited invoices', 'Unlimited products', 'Unlimited customers', 'Custom reports', '24/7 support', 'White-label'],
      current: profile?.plan === 'enterprise',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {activeTab === 'profile' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                />
                <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Billing & Plans</h3>
            
            {/* Current Plan */}
            <div className="mb-8 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-primary-900 capitalize">
                    Current Plan: {profile?.plan}
                  </h4>
                  <p className="text-primary-700">
                    {profile?.plan === 'free' 
                      ? 'You are on the free plan' 
                      : 'Your subscription is active'
                    }
                  </p>
                </div>
                {profile?.plan !== 'free' && (
                  <button className="px-4 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 hover:bg-primary-100">
                    Manage Subscription
                  </button>
                )}
              </div>
            </div>

            {/* Available Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`border rounded-lg p-6 ${
                    plan.current 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900">{plan.name}</h4>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-500">{plan.period}</span>
                    </div>
                  </div>
                  
                  <ul className="mt-6 space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-6">
                    {plan.current ? (
                      <button
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-gray-100 cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                        {profile?.plan === 'free' ? 'Upgrade' : 'Switch Plan'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Integrations</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">G</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Google Sheets</h4>
                    <p className="text-sm text-gray-500">Connect your Google account to sync data</p>
                  </div>
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Connect
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">R</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Razorpay</h4>
                    <p className="text-sm text-gray-500">Payment gateway integration</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                  Connected
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-500">Receive email updates about your invoices</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-primary-600 rounded" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Payment Reminders</h4>
                  <p className="text-sm text-gray-500">Get notified about overdue payments</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-primary-600 rounded" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">GST Filing Reminders</h4>
                  <p className="text-sm text-gray-500">Monthly GST filing deadline reminders</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-primary-600 rounded" defaultChecked />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Change Password</h4>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Current password"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                    Update Password
                  </button>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-500 mb-4">Add an extra layer of security to your account</p>
                <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}