import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No files uploaded' },
        { status: 400 }
      )
    }

    // Validate file count (max 10 images)
    if (files.length > 10) {
      return NextResponse.json(
        { success: false, message: 'Maximum 10 images allowed' },
        { status: 400 }
      )
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB per file
    const uploadedFiles = []

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    const productsDir = join(uploadsDir, 'products')
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    if (!existsSync(productsDir)) {
      await mkdir(productsDir, { recursive: true })
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, message: `Invalid file type: ${file.name}. Only images are allowed.` },
          { status: 400 }
        )
      }

      // Validate file size
      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, message: `File too large: ${file.name}. Maximum 5MB allowed.` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const filename = `${timestamp}-${randomString}-${i + 1}.${fileExtension}`

      // Save file
      const filepath = join(productsDir, filename)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      // Add to uploaded files
      uploadedFiles.push({
        filename,
        url: `/uploads/products/${filename}`,
        size: file.size,
        type: file.type,
        originalName: file.name
      })
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length
      }
    })

  } catch (error: any) {
    console.error('Multiple upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to upload files' },
      { status: 500 }
    )
  }
}
