import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ChatSettings from '@/models/ChatSettings'

// GET - Get chat settings
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
    let settings = await ChatSettings.findOne().lean()

    if (!settings) {
      // Create default settings if none exist
      settings = await ChatSettings.create({
        chatEnabled: true,
        autoAssign: true,
        maxChatsPerAgent: 5,
        workingHours: {
          enabled: true,
          start: '09:00',
          end: '18:00',
          timezone: 'UTC',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        emailNotifications: true,
        pushNotifications: true,
        soundAlerts: true,
        desktopNotifications: true,
        autoGreeting: true,
        greetingMessage: 'Hi! How can we help you today?',
        autoAwayMessage: true,
        awayMessage: 'Our team is currently offline. Please leave a message and we\'ll get back to you soon!',
        showAgentTyping: true,
        showAgentAvatar: true,
        allowFileUploads: true,
        maxFileSize: 10,
        requestFeedback: true,
        routingMethod: 'round-robin',
        priorityRouting: true,
        skillBasedRouting: false,
        requireEmail: true,
        requireName: true,
        blockAnonymous: false,
        rateLimit: 10,
        spamProtection: true,
        updatedBy: session.user.id
      })
    }

    return NextResponse.json({
      success: true,
      data: settings
    })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update chat settings
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
    let settings = await ChatSettings.findOne()

    if (settings) {
      // Update existing settings
      Object.assign(settings, {
        ...body,
        updatedBy: session.user.id
      })
      await settings.save()
    } else {
      // Create new settings
      settings = await ChatSettings.create({
        ...body,
        updatedBy: session.user.id
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update settings' },
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
    await ChatSettings.deleteMany({})

    // Create default settings
    const settings = await ChatSettings.create({
      chatEnabled: true,
      autoAssign: true,
      maxChatsPerAgent: 5,
      workingHours: {
        enabled: true,
        start: '09:00',
        end: '18:00',
        timezone: 'UTC',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      emailNotifications: true,
      pushNotifications: true,
      soundAlerts: true,
      desktopNotifications: true,
      autoGreeting: true,
      greetingMessage: 'Hi! How can we help you today?',
      autoAwayMessage: true,
      awayMessage: 'Our team is currently offline. Please leave a message and we\'ll get back to you soon!',
      showAgentTyping: true,
      showAgentAvatar: true,
      allowFileUploads: true,
      maxFileSize: 10,
      requestFeedback: true,
      routingMethod: 'round-robin',
      priorityRouting: true,
      skillBasedRouting: false,
      requireEmail: true,
      requireName: true,
      blockAnonymous: false,
      rateLimit: 10,
      spamProtection: true,
      updatedBy: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Settings reset to defaults'
    })

  } catch (error) {
    console.error('Error resetting settings:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to reset settings' },
      { status: 500 }
    )
  }
}

