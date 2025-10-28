import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Order from '@/models/Order'
import { customerCreateSchema } from '@/lib/validations/customer'

// GET /api/admin/customers - Get all customers with pagination, search, filters
export async function GET(request: NextRequest) {
  try {
    console.log('=== GET CUSTOMERS API CALLED ===')
    
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? { user: session.user.email, role: session.user.role } : 'No session')
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const statusParam = searchParams.get('status')
    // Handle "undefined" string and null/undefined values
    const status = (!statusParam || statusParam === 'undefined' || statusParam === 'null') ? 'all' : statusParam
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query
    const query: any = { role: 'user' }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }

    // Status filter
    if (status !== 'all') {
      query.isActive = status === 'active'
    }

    console.log('Query:', JSON.stringify(query), 'Status param:', statusParam, 'Status used:', status)

    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Check total users in database
    const totalUsers = await User.countDocuments()
    // console.log('Total users in database:', totalUsers)
    
    const totalCustomers = await User.countDocuments({ role: 'user' })
    // console.log('Total customers (role: user):', totalCustomers)

    // Fetch customers with pagination
    const customers = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean()

    console.log('Found customers:', customers.length)
    if (customers.length > 0) {
      console.log('First customer:', customers[0])
    }

    const total = await User.countDocuments(query)

    // Get order stats for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orders = await Order.find({ user: customer._id }).lean()
        
        const stats = {
          totalOrders: orders.length,
          totalSpent: orders.reduce((sum: number, order) => sum + order.total, 0),
          averageOrderValue: orders.length > 0 
            ? orders.reduce((sum: number, order) => sum + order.total, 0) / orders.length 
            : 0,
          lastOrderDate: orders.length > 0 
            ? orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt 
            : undefined,
        }

        return {
          ...customer,
          stats,
        }
      })
    )

    // Calculate overall stats
    const allCustomers = await User.find({ role: 'user' }).lean()
    const activeCustomers = allCustomers.filter(c => c.isActive)
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const newCustomers = allCustomers.filter(c => new Date(c.createdAt) > thirtyDaysAgo)

    // Calculate total revenue from all orders
    const allOrders = await Order.find().lean()
    const totalRevenue = allOrders.reduce((sum: number, order) => sum + order.total, 0)

    const stats = {
      total: allCustomers.length,
      active: activeCustomers.length,
      inactive: allCustomers.length - activeCustomers.length,
      newThisMonth: newCustomers.length,
      totalRevenue,
    }

    console.log(`Found ${customersWithStats.length} customers`)

    return NextResponse.json({
      customers: customersWithStats,
      total,
      limit,
      offset,
      stats,
    })
  } catch (error: any) {
    console.error('Get customers error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// Helper function to generate random password
function generateRandomPassword(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// POST /api/admin/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE CUSTOMER API CALLED ===')
    
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? { user: session.user.email, role: session.user.role } : 'No session')
    
    if (!session || session.user.role !== 'admin') {
      console.log('Authorization failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    console.log('Database connected')

    const body = await request.json()
    console.log('Request body:', body)

    // Validate request body with discriminated union
    const validatedData = customerCreateSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Check email uniqueness only if email is provided
    if (validatedData.email && validatedData.email.trim()) {
      const existingUser = await User.findOne({ email: validatedData.email })
      if (existingUser) {
        console.log('Email already exists:', validatedData.email)
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare user data based on customer type
    const userData: any = {
      name: validatedData.name,
      phone: validatedData.phone,
      role: 'user',
      isActive: validatedData.isActive ?? true,
      customerType: validatedData.customerType,
      canLogin: validatedData.canLogin ?? (validatedData.customerType === 'online'),
      notes: validatedData.notes || undefined,
    }

    // Add email if provided and not empty
    if (validatedData.email && validatedData.email.trim()) {
      userData.email = validatedData.email.trim()
      // Auto-verify email for phone/walkin customers
      userData.emailVerified = validatedData.customerType !== 'online'
    }

    // Handle password based on customer type
    if (validatedData.password) {
      userData.password = validatedData.password
    } else if (validatedData.customerType === 'phone' || validatedData.customerType === 'walkin') {
      // Generate random password for phone/walkin orders (in case they need it later)
      userData.password = generateRandomPassword()
      userData.canLogin = false // They can't login without knowing the password
    }

    // Add address if provided
    if (validatedData.address) {
      userData.address = [{
        name: validatedData.name,
        phone: validatedData.phone || '',
        address: validatedData.address,
        city: validatedData.city || '',
        state: validatedData.state || '',
        zipCode: validatedData.zipCode || '',
        country: validatedData.country || 'BD',
        isDefault: true,
      }]
    }

    // Track who created this customer (for phone/walkin orders)
    if (validatedData.customerType === 'phone' || validatedData.customerType === 'walkin') {
      const admin = await User.findOne({ email: session.user.email })
      if (admin) {
        userData.createdBy = admin._id
      }
    }

    const customer = new User(userData)
    await customer.save()
    console.log('Customer created successfully:', customer._id, 'Type:', customer.customerType, 'Role:', customer.role)
    console.log('Customer data:', {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      customerType: customer.customerType,
      canLogin: customer.canLogin
    })

    // TODO: Send welcome email only if email exists and customer is online
    if (validatedData.customerType === 'online' && validatedData.email && validatedData.sendWelcomeEmail) {
      // await sendWelcomeEmail(validatedData.email)
      console.log('Welcome email should be sent to:', validatedData.email)
    }

    // Remove password from response
    const customerResponse = customer.toJSON()

    return NextResponse.json({
      message: `${validatedData.customerType.charAt(0).toUpperCase() + validatedData.customerType.slice(1)} customer created successfully`,
      customer: customerResponse,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create customer error:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    
    if (error.name === 'ZodError') {
      console.log('Zod validation errors:', error.issues)
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Email or phone number already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    )
  }
}

