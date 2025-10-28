import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import mongoose from 'mongoose'

// PATCH /api/admin/customers/[id]/toggle-status - Toggle customer active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== TOGGLE CUSTOMER STATUS API CALLED ===')
    
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
    }

    const customer = await User.findById(id)

    if (!customer || customer.role !== 'user') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Toggle status
    customer.isActive = !customer.isActive
    await customer.save()

    console.log(`Customer ${id} status toggled to ${customer.isActive}`)

    // Remove password from response
    const customerResponse = customer.toJSON()

    return NextResponse.json({
      message: `Customer ${customer.isActive ? 'activated' : 'deactivated'} successfully`,
      customer: customerResponse,
    })
  } catch (error: any) {
    console.error('Toggle customer status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to toggle customer status' },
      { status: 500 }
    )
  }
}

