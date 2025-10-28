import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'

// POST /api/seed/categories - Seed initial categories
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Check if categories already exist
    const existingCount = await Category.countDocuments()
    if (existingCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'Categories already exist. Delete existing categories first.'
      }, { status: 400 })
    }

    const categories = [
      { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', description: 'Fresh fruits and vegetables', sortOrder: 1 },
      { name: 'Fruits', slug: 'fruits', description: 'Fresh fruits', sortOrder: 1 },
      { name: 'Vegetables', slug: 'vegetables', description: 'Fresh vegetables', sortOrder: 2 },
      { name: 'Dairy & Eggs', slug: 'dairy-eggs', description: 'Dairy products and eggs', sortOrder: 2 },
      { name: 'Meat & Seafood', slug: 'meat-seafood', description: 'Fresh meat and seafood', sortOrder: 3 },
      { name: 'Bakery', slug: 'bakery', description: 'Fresh bakery items', sortOrder: 4 },
      { name: 'Beverages', slug: 'beverages', description: 'Drinks and beverages', sortOrder: 5 },
      { name: 'Snacks', slug: 'snacks', description: 'Biscuits and snacks', sortOrder: 6 },
      { name: 'Frozen Foods', slug: 'frozen-foods', description: 'Frozen food items', sortOrder: 7 },
      { name: 'Pantry Staples', slug: 'pantry-staples', description: 'Essential pantry items', sortOrder: 8 },
      { name: 'Health & Wellness', slug: 'health-wellness', description: 'Health and wellness products', sortOrder: 9 },
      { name: 'Baby Care', slug: 'baby-care', description: 'Baby care products', sortOrder: 10 },
      { name: 'Personal Care', slug: 'personal-care', description: 'Personal care items', sortOrder: 11 },
      { name: 'Household', slug: 'household', description: 'Household essentials', sortOrder: 12 }
    ]

    const createdCategories = await Category.insertMany(categories)

    return NextResponse.json({
      success: true,
      message: `${createdCategories.length} categories created successfully`,
      data: createdCategories
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error seeding categories:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to seed categories', error: error.message },
      { status: 500 }
    )
  }
}

