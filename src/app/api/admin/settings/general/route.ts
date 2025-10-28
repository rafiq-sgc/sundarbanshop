import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import GeneralSettings from '@/models/GeneralSettings'

// GET - Get general settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Get or create settings (singleton pattern)
    let settings = await GeneralSettings.findOne().lean()

    if (!settings) {
      // Create default settings if none exist
      settings = await GeneralSettings.create({
        storeName: 'Ekomart',
        storeEmail: 'info@ekomart.com',
        storePhone: '+1 234 567 8900',
        storeAddress: '123 Main Street',
        storeCity: 'New York',
        storeState: 'NY',
        storeZip: '10001',
        storeCountry: 'United States',
        currency: 'USD',
        language: 'en',
        timezone: 'America/New_York',
        taxRate: 0,
        taxEnabled: true,
        shippingFee: 5.99,
        freeShippingThreshold: 50,
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        updatedBy: session.user.id
      })
    }

    return NextResponse.json({
      success: true,
      data: settings
    })

  } catch (error) {
    console.error('Error fetching general settings:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update general settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()

    // Update or create settings (singleton pattern)
    let settings = await GeneralSettings.findOne()

    if (settings) {
      // Update existing settings
      Object.assign(settings, {
        ...body,
        updatedBy: session.user.id
      })
      await settings.save()
    } else {
      // Create new settings
      settings = await GeneralSettings.create({
        ...body,
        updatedBy: session.user.id
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating general settings:', error)
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

    // Check if user is authenticated and is admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Delete existing settings
    await GeneralSettings.deleteMany({})

    // Create default settings
    const settings = await GeneralSettings.create({
      storeName: 'Ekomart',
      storeEmail: 'info@ekomart.com',
      storePhone: '+1 234 567 8900',
      storeAddress: '123 Main Street',
      storeCity: 'New York',
      storeState: 'NY',
      storeZip: '10001',
      storeCountry: 'United States',
      currency: 'USD',
      language: 'en',
      timezone: 'America/New_York',
      taxRate: 0,
      taxEnabled: true,
      shippingFee: 5.99,
      freeShippingThreshold: 50,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      updatedBy: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Settings reset to defaults'
    })

  } catch (error) {
    console.error('Error resetting general settings:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to reset settings' },
      { status: 500 }
    )
  }
}

