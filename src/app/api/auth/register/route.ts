import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import nodemailer from 'nodemailer'
import { emailTemplates } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json()

    // Validate required fields
    if (!name || !password) {
      return NextResponse.json(
        { message: 'Name and password are required' },
        { status: 400 }
      )
    }

    // At least one of email or phone must be provided
    if (!email && !phone) {
      return NextResponse.json(
        { message: 'Either email or phone number is required' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { message: 'Please enter a valid email address' },
          { status: 400 }
        )
      }
    }

    // Validate Bangladeshi phone format if provided
    if (phone) {
      const phoneRegex = /^(?:\+?880|0)?1[3-9]\d{8}$/
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
      if (!phoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { message: 'Please enter a valid Bangladeshi phone number' },
          { status: 400 }
        )
      }
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if user already exists by email or phone
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    })
    
    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { message: 'User with this email already exists' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { message: 'User with this phone number already exists' },
          { status: 400 }
        )
      }
    }

    // Create new user
    const userData: any = {
      name,
      password,
      role: 'user'
    }

    // Add email if provided (convert empty string to null)
    if (email && email.trim() !== '') {
      userData.email = email.trim()
    } else {
      userData.email = null
    }

    // Add phone if provided (convert empty string to null)
    if (phone && phone.trim() !== '') {
      userData.phone = phone.trim()
    } else {
      userData.phone = null
    }

    const user = new User(userData)
    await user.save()

    // Send welcome email if user provided email (asynchronously, non-blocking)
    if (email && email.trim() !== '') {
      // Send email in background without blocking response
      setImmediate(async () => {
        try {
          // Get welcome email template
          const welcomeTemplate = emailTemplates.find(t => t.id === 'welcome')
          
          if (!welcomeTemplate) {
            console.error('Welcome email template not found')
            return
          }

          // Replace variables in template
          let emailBody = welcomeTemplate.body
          let emailSubject = welcomeTemplate.subject
          
          const variables = {
            name: name,
            storeName: 'EkoMart',
            shopUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/products`,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@ekomart.com'
          }
          
          // Replace all variables
          Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
            emailBody = emailBody.replace(regex, value)
            emailSubject = emailSubject.replace(regex, value)
          })
          
          // Create transporter with better configuration
          const emailPort = parseInt(process.env.EMAIL_PORT || '587')
          const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: emailPort,
            secure: emailPort === 465, // true for 465, false for other ports
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
              rejectUnauthorized: false // Allow self-signed certificates
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,
            socketTimeout: 30000 // 30 seconds
          })

          // Verify connection first
          console.log('Verifying SMTP connection...')
          await transporter.verify()
          console.log('SMTP connection verified!')
          
          // Send email
          const info = await transporter.sendMail({
            from: `${process.env.EMAIL_FROM_NAME || 'EkoMart'} <${process.env.EMAIL_FROM || 'noreply@ekomart.com'}>`,
            to: `${name} <${email}>`,
            subject: emailSubject,
            html: emailBody,
          })
          
          console.log('✅ Welcome email sent successfully!')
          console.log('Message ID:', info.messageId)
          console.log('To:', email)
        } catch (emailError: any) {
          console.error('❌ Failed to send welcome email:', emailError.message)
          if (emailError.code) {
            console.error('Error code:', emailError.code)
          }
          if (emailError.command) {
            console.error('Failed command:', emailError.command)
          }
        }
      })
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject()

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userWithoutPassword
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
