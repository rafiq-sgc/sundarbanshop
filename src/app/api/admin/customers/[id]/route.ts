import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Order from '@/models/Order'
import { customerUpdateSchema } from '@/lib/validations/customer'
import mongoose from 'mongoose'

// GET /api/admin/customers/[id] - Get customer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== GET CUSTOMER BY ID API CALLED ===')
    
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
    }

    const customer = await User.findById(id).select('-password').lean()

    if (!customer || (customer as any).role !== 'user') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get customer orders
    const orders = await Order.find({ user: id })
      .sort({ createdAt: -1 })
      .lean()

    // Calculate stats
    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum: number, order) => sum + order.total, 0),
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum: number, order) => sum + order.total, 0) / orders.length 
        : 0,
      lastOrderDate: orders.length > 0 ? orders[0].createdAt : undefined,
    }

    // Get recent orders (last 5)
    const recentOrders = orders.slice(0, 5).map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.orderStatus,
      createdAt: order.createdAt,
    }))

    console.log(`Customer ${id} found with ${orders.length} orders`)

    return NextResponse.json({
      customer: {
        ...customer,
        stats,
      },
      recentOrders,
      stats,
    })
  } catch (error: any) {
    console.error('Get customer by ID error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== UPDATE CUSTOMER API CALLED ===')
    
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
    }

    const body = await request.json()
    console.log('Update request body:', body)

    const validatedData = customerUpdateSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Check if customer exists
    const customer = await User.findById(id)
    if (!customer || customer.role !== 'user') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email !== customer.email) {
      const existingUser = await User.findOne({ email: validatedData.email })
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Update customer
    Object.assign(customer, validatedData)
    await customer.save()

    console.log('Customer updated successfully:', id)

    // Remove password from response
    const customerResponse = customer.toJSON()

    return NextResponse.json({
      message: 'Customer updated successfully',
      customer: customerResponse,
    })
  } catch (error: any) {
    console.error('Update customer error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== DELETE CUSTOMER API CALLED ===')
    
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
    }

    // Check if customer exists
    const customer = await User.findById(id)
    if (!customer || customer.role !== 'user') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Check if customer has orders
    const orderCount = await Order.countDocuments({ user: id })
    if (orderCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete customer with ${orderCount} order(s). Consider deactivating instead.` 
        },
        { status: 400 }
      )
    }

    await User.findByIdAndDelete(id)
    console.log('Customer deleted successfully:', id)

    return NextResponse.json({
      message: 'Customer deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete customer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 500 }
    )
  }
}

