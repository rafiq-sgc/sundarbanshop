import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import ActivityLog from '@/models/ActivityLog'

// GET - Get single admin user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const user = await User.findById(params.id)
      .select('-password')
      .lean()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Only return admin users
    if ((user as any).role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Not an admin user' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error: any) {
    console.error('Error fetching admin user:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT - Update admin user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, email, password, phone, isActive, notes } = body

    // Get current user data
    const oldUser = await User.findById(params.id).select('-password').lean()

    if (!oldUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-deactivation
    if (session.user.id === params.id && isActive === false) {
      return NextResponse.json(
        { success: false, message: 'Cannot deactivate your own account' },
        { status: 400 }
      )
    }

    // Check if email is being changed and already exists
    if (email && email !== (oldUser as any).email) {
      const existingUser = await User.findOne({ email, _id: { $ne: params.id } })
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: any = {
      name,
      email,
      phone,
      isActive,
      notes
    }

    // Only update password if provided
    if (password && password.length >= 6) {
      updateData.password = password
    }

    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password')

    // Log activity
    const changes: any = {}
    if (name !== (oldUser as any).name) changes.name = { before: (oldUser as any).name, after: name }
    if (email !== (oldUser as any).email) changes.email = { before: (oldUser as any).email, after: email }
    if (isActive !== (oldUser as any).isActive) changes.isActive = { before: (oldUser as any).isActive, after: isActive }

    await ActivityLog.create({
      user: session.user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: params.id,
      description: `Updated admin user: ${(oldUser as any).email}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      changes: Object.keys(changes).length > 0 ? { 
        before: Object.fromEntries(Object.entries(changes).map(([k, v]: [string, any]) => [k, v.before])),
        after: Object.fromEntries(Object.entries(changes).map(([k, v]: [string, any]) => [k, v.after]))
      } : undefined,
      metadata: {
        changedFields: Object.keys(changes)
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Admin user updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating admin user:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete admin user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Prevent self-deletion
    if (session.user.id === params.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const user = await User.findById(params.id).select('-password').lean()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of admin users
    if ((user as any).role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Can only delete admin users from this interface' },
        { status: 403 }
      )
    }

    await User.findByIdAndDelete(params.id)

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'DELETE',
      entity: 'User',
      entityId: params.id,
      description: `Deleted admin user: ${(user as any).email}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        deletedUserName: (user as any).name,
        deletedUserEmail: (user as any).email,
        deletedUserRole: (user as any).role
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting admin user:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete user' },
      { status: 500 }
    )
  }
}

// PATCH - Toggle user status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { action, isActive } = body

    // Prevent self-deactivation
    if (session.user.id === params.id && isActive === false) {
      return NextResponse.json(
        { success: false, message: 'Cannot deactivate your own account' },
        { status: 400 }
      )
    }

    let user

    if (action === 'toggleActive') {
      user = await User.findByIdAndUpdate(
        params.id,
        { isActive },
        { new: true }
      ).select('-password')

      // Log activity
      await ActivityLog.create({
        user: session.user.id,
        action: 'UPDATE',
        entity: 'User',
        entityId: params.id,
        description: `${isActive ? 'Activated' : 'Deactivated'} admin user: ${user.email}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          statusChanged: true,
          newStatus: isActive
        }
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    })

  } catch (error: any) {
    console.error('Error updating user status:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

