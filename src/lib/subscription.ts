// Subscription management with Razorpay integration
import { supabase } from './supabase'

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly'
  features: string[]
  limits: {
    invoices: number
    customers: number
    products: number
    storage: string
  }
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  current_period_start: string
  current_period_end: string
  razorpay_subscription_id?: string
  razorpay_customer_id?: string
  created_at: string
  updated_at: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    interval: 'monthly',
    features: [
      'Up to 10 invoices per month',
      'Basic customer management',
      'Email support',
      'Basic reports'
    ],
    limits: {
      invoices: 10,
      customers: 25,
      products: 50,
      storage: '100MB'
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 499,
    currency: 'INR',
    interval: 'monthly',
    features: [
      'Up to 100 invoices per month',
      'Advanced customer management',
      'Priority email support',
      'Advanced reports',
      'WhatsApp integration'
    ],
    limits: {
      invoices: 100,
      customers: 250,
      products: 500,
      storage: '1GB'
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 999,
    currency: 'INR',
    interval: 'monthly',
    features: [
      'Up to 1000 invoices per month',
      'Unlimited customers',
      'Phone & email support',
      'Custom reports',
      'API access',
      'E-way bill generation',
      'Tally sync'
    ],
    limits: {
      invoices: 1000,
      customers: -1, // unlimited
      products: 5000,
      storage: '10GB'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 1999,
    currency: 'INR',
    interval: 'monthly',
    features: [
      'Unlimited invoices',
      'Unlimited customers',
      '24/7 priority support',
      'Custom integrations',
      'White-label solution',
      'Advanced analytics',
      'Multi-user access',
      'Custom workflows'
    ],
    limits: {
      invoices: -1, // unlimited
      customers: -1, // unlimited
      products: -1, // unlimited
      storage: '100GB'
    }
  }
]

export class SubscriptionService {
  private razorpayKeyId: string

  constructor() {
    this.razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || ''
  }

  // Get plan by ID
  getPlan(planId: string): SubscriptionPlan | null {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === planId) || null
  }

  // Get user's current subscription
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching subscription:', error)
      return null
    }

    return data
  }

  // Check if user can perform action based on plan limits
  async checkPlanLimits(userId: string, action: 'invoices' | 'customers' | 'products', currentCount: number): Promise<boolean> {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan')
      .eq('id', userId)
      .single()

    if (!profile) return false

    const plan = this.getPlan(profile.plan)
    if (!plan) return false

    const limit = plan.limits[action]
    
    // -1 means unlimited
    if (limit === -1) return true
    
    return currentCount < limit
  }

  // Create Razorpay order
  async createRazorpayOrder(planId: string, userId: string): Promise<any> {
    const plan = this.getPlan(planId)
    if (!plan) throw new Error('Invalid plan')

    // In a real implementation, this would call your backend API
    // which would create the Razorpay order
    const orderData = {
      amount: plan.price * 100, // Razorpay expects amount in paise
      currency: plan.currency,
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        plan_id: planId,
        user_id: userId
      }
    }

    // This is a mock response - replace with actual API call
    return {
      id: `order_${Date.now()}`,
      ...orderData
    }
  }

  // Initialize Razorpay payment
  async initializePayment(planId: string, userId: string): Promise<void> {
    const plan = this.getPlan(planId)
    if (!plan) throw new Error('Invalid plan')

    const order = await this.createRazorpayOrder(planId, userId)

    const options = {
      key: this.razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: 'SheetBill',
      description: `${plan.name} Plan Subscription`,
      order_id: order.id,
      handler: async (response: any) => {
        await this.handlePaymentSuccess(response, planId, userId)
      },
      prefill: {
        name: '',
        email: '',
        contact: ''
      },
      theme: {
        color: '#3b82f6'
      }
    }

    // Load Razorpay script if not already loaded
    if (!window.Razorpay) {
      await this.loadRazorpayScript()
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  // Load Razorpay script
  private loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Razorpay script'))
      document.head.appendChild(script)
    })
  }

  // Handle successful payment
  private async handlePaymentSuccess(response: any, planId: string, userId: string): Promise<void> {
    try {
      // Create subscription record
      const { error } = await supabase
        .from('subscription_history')
        .insert({
          user_id: userId,
          plan: planId,
          status: 'active',
          payment_id: response.razorpay_payment_id,
          razorpay_subscription_id: response.razorpay_subscription_id,
          amount: this.getPlan(planId)?.price || 0
        })

      if (error) throw error

      // Update user profile plan
      await supabase
        .from('user_profiles')
        .update({ plan: planId })
        .eq('id', userId)

      // Show success message
      alert('Subscription activated successfully!')
      window.location.reload()
    } catch (error) {
      console.error('Error handling payment success:', error)
      alert('Payment successful but failed to activate subscription. Please contact support.')
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.getCurrentSubscription(userId)
    if (!subscription) throw new Error('No active subscription found')

    // Update subscription status
    const { error } = await supabase
      .from('subscription_history')
      .update({ status: 'cancelled' })
      .eq('id', subscription.id)

    if (error) throw error

    // Update user profile to free plan
    await supabase
      .from('user_profiles')
      .update({ plan: 'free' })
      .eq('id', userId)
  }

  // Get subscription history
  async getSubscriptionHistory(userId: string): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscription history:', error)
      return []
    }

    return data || []
  }
}

// Declare Razorpay on window object
declare global {
  interface Window {
    Razorpay: any
  }
}

export const subscriptionService = new SubscriptionService()