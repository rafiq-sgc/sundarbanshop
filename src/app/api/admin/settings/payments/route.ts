import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import PaymentSettings from '@/models/PaymentSettings'

// Default payment gateways for Bangladesh
const defaultGateways = [
  {
    name: 'bkash',
    displayName: 'bKash',
    enabled: false,
    isDefault: false,
    config: {
      bkashBaseURL: 'https://checkout.sandbox.bka.sh/v1.2.0-beta'
    },
    fees: {
      fixed: 0,
      percentage: 1.5
    },
    minimumAmount: 10,
    maximumAmount: 25000,
    supportedCurrencies: ['BDT'],
    logo: '/images/payment/bkash.png',
    description: 'Pay with bKash mobile wallet',
    sortOrder: 1
  },
  {
    name: 'nagad',
    displayName: 'Nagad',
    enabled: false,
    isDefault: false,
    config: {
      nagadBaseURL: 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs'
    },
    fees: {
      fixed: 0,
      percentage: 1.0
    },
    minimumAmount: 10,
    maximumAmount: 25000,
    supportedCurrencies: ['BDT'],
    logo: '/images/payment/nagad.png',
    description: 'Pay with Nagad mobile wallet',
    sortOrder: 2
  },
  {
    name: 'rocket',
    displayName: 'Rocket',
    enabled: false,
    isDefault: false,
    config: {},
    fees: {
      fixed: 0,
      percentage: 1.2
    },
    minimumAmount: 10,
    maximumAmount: 25000,
    supportedCurrencies: ['BDT'],
    logo: '/images/payment/rocket.png',
    description: 'Pay with Rocket mobile wallet',
    sortOrder: 3
  },
  {
    name: 'upay',
    displayName: 'Upay',
    enabled: false,
    isDefault: false,
    config: {},
    fees: {
      fixed: 0,
      percentage: 1.0
    },
    minimumAmount: 10,
    maximumAmount: 10000,
    supportedCurrencies: ['BDT'],
    logo: '/images/payment/upay.png',
    description: 'Pay with Upay mobile wallet',
    sortOrder: 4
  },
  {
    name: 'sslcommerz',
    displayName: 'SSLCommerz',
    enabled: false,
    isDefault: false,
    config: {
      sslcommerzBaseURL: 'https://sandbox.sslcommerz.com'
    },
    fees: {
      fixed: 0,
      percentage: 2.0
    },
    minimumAmount: 10,
    supportedCurrencies: ['BDT', 'USD', 'EUR', 'GBP'],
    logo: '/images/payment/sslcommerz.png',
    description: 'Secure payment gateway (Cards, Mobile Banking, Internet Banking)',
    sortOrder: 5
  },
  {
    name: 'cod',
    displayName: 'Cash on Delivery',
    enabled: true,
    isDefault: true,
    config: {
      codInstructions: 'Pay with cash when you receive your order',
      codMaxAmount: 10000,
      codAreas: ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh']
    },
    fees: {
      fixed: 0,
      percentage: 0
    },
    minimumAmount: 0,
    maximumAmount: 10000,
    supportedCurrencies: ['BDT'],
    logo: '/images/payment/cod.png',
    description: 'Pay cash when you receive your order',
    sortOrder: 6
  }
]

// GET - Get payment settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Get or create settings (singleton pattern)
    let settings = await PaymentSettings.findOne().lean()

    if (!settings) {
      // Create default settings for Bangladesh
      settings = await PaymentSettings.create({
        currency: 'BDT',
        currencySymbol: '৳',
        currencyPosition: 'before',
        decimalPlaces: 2,
        thousandSeparator: ',',
        decimalSeparator: '.',
        gateways: defaultGateways,
        acceptedPaymentMethods: ['cod', 'bkash', 'nagad', 'rocket', 'sslcommerz', 'upay'],
        requireBillingAddress: true,
        requirePhoneNumber: true,
        saveCardDetails: false,
        autoRefundEnabled: false,
        refundProcessingDays: 7,
        partialRefundAllowed: true,
        sslEnabled: true,
        fraudDetectionEnabled: true,
        requireCVV: true,
        transactionPrefix: 'TXN-',
        invoicePrefix: 'INV-',
        mobileBankingEnabled: true,
        mobileBankingNote: 'নগদ, বিকাশ, রকেট সব ধরনের মোবাইল ব্যাংকিং সুবিধা উপলব্ধ',
        updatedBy: session.user.id
      })
    }

    return NextResponse.json({
      success: true,
      data: settings
    })

  } catch (error: any) {
    console.error('Error fetching payment settings:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update payment settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()

    // Ensure only one gateway is set as default
    if (body.gateways && Array.isArray(body.gateways)) {
      const defaultGateways = body.gateways.filter((g: any) => g.isDefault)
      if (defaultGateways.length > 1) {
        // Keep only the first one as default
        body.gateways.forEach((g: any, index: number) => {
          if (index > 0 && g.isDefault) {
            g.isDefault = false
          }
        })
      }
    }

    // Update or create settings (singleton pattern)
    let settings = await PaymentSettings.findOne()

    if (settings) {
      Object.assign(settings, {
        ...body,
        updatedBy: session.user.id
      })
      await settings.save()
    } else {
      settings = await PaymentSettings.create({
        ...body,
        updatedBy: session.user.id
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Payment settings updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating payment settings:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}

// POST - Reset settings to default
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Delete existing settings
    await PaymentSettings.deleteMany({})

    // Create default settings
    const settings = await PaymentSettings.create({
      currency: 'BDT',
      currencySymbol: '৳',
      currencyPosition: 'before',
      decimalPlaces: 2,
      thousandSeparator: ',',
      decimalSeparator: '.',
      gateways: defaultGateways,
      acceptedPaymentMethods: ['cod', 'bkash', 'nagad', 'rocket', 'sslcommerz', 'upay'],
      requireBillingAddress: true,
      requirePhoneNumber: true,
      saveCardDetails: false,
      autoRefundEnabled: false,
      refundProcessingDays: 7,
      partialRefundAllowed: true,
      sslEnabled: true,
      fraudDetectionEnabled: true,
      requireCVV: true,
      transactionPrefix: 'TXN-',
      invoicePrefix: 'INV-',
      mobileBankingEnabled: true,
      mobileBankingNote: 'নগদ, বিকাশ, রকেট সব ধরনের মোবাইল ব্যাংকিং সুবিধা উপলব্ধ',
      updatedBy: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Payment settings reset to defaults'
    })

  } catch (error: any) {
    console.error('Error resetting payment settings:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to reset settings' },
      { status: 500 }
    )
  }
}

