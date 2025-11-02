export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Warehouse from '@/models/Warehouse'
import { z } from 'zod'

// Validation schema
const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(2).max(10).toUpperCase(),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  manager: z.string().optional(),
  isActive: z.boolean().default(true),
})

// GET /api/admin/warehouses - Get all warehouses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query
    const query: any = {}
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
      ]
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true'
    }

    // Get warehouses with pagination
    const skip = (page - 1) * limit
    const warehouses = await Warehouse.find(query)
      .populate('manager', 'name email')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count
    const total = await Warehouse.countDocuments(query)

    // Calculate stats
    const stats = {
      total: await Warehouse.countDocuments(),
      active: await Warehouse.countDocuments({ isActive: true }),
      inactive: await Warehouse.countDocuments({ isActive: false }),
    }

    return NextResponse.json({
      warehouses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      stats,
    })
  } catch (error: any) {
    console.error('Get warehouses error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch warehouses' },
      { status: 500 }
    )
  }
}

// POST /api/admin/warehouses - Create new warehouse
export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE WAREHOUSE API CALLED ===')
    
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
    
    const validatedData = warehouseSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Check if warehouse code already exists
    const existingWarehouse = await Warehouse.findOne({ code: validatedData.code })
    if (existingWarehouse) {
      console.log('Warehouse code already exists:', validatedData.code)
      return NextResponse.json(
        { error: 'Warehouse code already exists' },
        { status: 400 }
      )
    }

    const warehouse = new Warehouse(validatedData)
    await warehouse.save()
    console.log('Warehouse saved successfully:', warehouse._id)

    return NextResponse.json({
      message: 'Warehouse created successfully',
      warehouse,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create warehouse error:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    
    if (error.name === 'ZodError') {
      console.log('Zod validation errors:', error.issues)
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create warehouse' },
      { status: 500 }
    )
  }
}

