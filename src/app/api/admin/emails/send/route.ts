import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import User from '@/models/User'

// Email send validation schema
const emailSendSchema = z.object({
  to: z.union([
    z.object({
      email: z.string().email(),
      name: z.string().optional(),
    }),
    z.array(z.object({
      email: z.string().email(),
      name: z.string().optional(),
    }))
  ]),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Email body is required'),
  cc: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).optional(),
  bcc: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    contentType: z.string(),
  })).optional(),
  templateId: z.string().optional(),
  templateVariables: z.record(z.string(), z.string()).optional(),
  priority: z.enum(['high', 'normal', 'low']).default('normal'),
  replyTo: z.string().email().optional(),
})

// Create nodemailer transporter
function createTransporter() {
  // Check if using a service like Gmail, SendGrid, etc.
  const emailService = process.env.EMAIL_SERVICE
  const emailHost = process.env.EMAIL_HOST
  const emailPort = parseInt(process.env.EMAIL_PORT || '587')
  const emailUser = process.env.EMAIL_USER
  const emailPassword = process.env.EMAIL_PASSWORD
  const emailFrom = process.env.EMAIL_FROM || 'noreply@ekomart.com'

  if (emailService === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    })
  }

  // Default SMTP configuration
  return nodemailer.createTransport({
    host: emailHost || 'smtp.gmail.com',
    port: emailPort,
    secure: emailPort === 465, // true for 465, false for other ports
    auth: emailUser && emailPassword ? {
      user: emailUser,
      pass: emailPassword,
    } : undefined,
  })
}

// POST /api/admin/emails/send - Send email
export async function POST(request: NextRequest) {
  try {
    console.log('=== SEND EMAIL API CALLED ===')
    
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? { user: session.user.email, role: session.user.role } : 'No session')
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    console.log('Email request:', { to: body.to, subject: body.subject })

    const validatedData = emailSendSchema.parse(body)

    // Get sender admin
    const admin = await User.findOne({ email: session.user.email })
    const fromEmail = process.env.EMAIL_FROM || 'noreply@ekomart.com'
    const fromName = process.env.EMAIL_FROM_NAME || 'EkoMart'

    // Prepare recipients
    const recipients = Array.isArray(validatedData.to) ? validatedData.to : [validatedData.to]
    
    // Create transporter
    const transporter = createTransporter()

    // Send emails
    const results = []
    for (const recipient of recipients) {
      try {
        const mailOptions = {
          from: `${fromName} <${fromEmail}>`,
          to: recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email,
          subject: validatedData.subject,
          html: validatedData.body,
          cc: validatedData.cc?.map(c => c.name ? `${c.name} <${c.email}>` : c.email).join(', '),
          bcc: validatedData.bcc?.map(c => c.name ? `${c.name} <${c.email}>` : c.email).join(', '),
          replyTo: validatedData.replyTo || undefined,
          priority: validatedData.priority,
          attachments: validatedData.attachments?.map(att => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
          })),
        }

        console.log('Sending email to:', recipient.email)
        const info = await transporter.sendMail(mailOptions)
        
        console.log('Email sent successfully:', info.messageId)
        results.push({
          email: recipient.email,
          success: true,
          messageId: info.messageId,
        })

        // TODO: Log email in database for tracking
        
      } catch (error: any) {
        console.error('Failed to send email to:', recipient.email, error)
        results.push({
          email: recipient.email,
          success: false,
          error: error.message,
        })
      }
    }

    const allSuccessful = results.every(r => r.success)
    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: allSuccessful,
      message: allSuccessful 
        ? `Email sent successfully to ${successCount} recipient(s)` 
        : `Sent to ${successCount}/${results.length} recipients`,
      results,
    }, { status: allSuccessful ? 200 : 207 }) // 207 = Multi-Status
    
  } catch (error: any) {
    console.error('Send email error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

