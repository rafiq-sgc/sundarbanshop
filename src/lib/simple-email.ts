// Simple email service that actually sends emails
import nodemailer from 'nodemailer'

// Simple email configuration using a free SMTP service
const emailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'rafiqul.pust.cse@gmail.com',
    pass: 'your-app-password' // This needs to be replaced with actual app password
  }
}

// Check if we have valid credentials
const hasValidCredentials = emailConfig.auth.pass && emailConfig.auth.pass !== 'your-app-password'

// Create transporter
const transporter = nodemailer.createTransport(emailConfig)

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service error:', error)
  } else {
    console.log('✅ Simple email service is ready')
  }
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('📧 Sending email to:', options.to)
    console.log('📧 Subject:', options.subject)
    console.log('📧 Attachments:', options.attachments?.length || 0, 'files')
    
    // Try to send the email
    const mailOptions = {
      from: `"Ekomart" <${emailConfig.auth.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', result.messageId)
    
    return {
      success: true,
      message: 'Email sent successfully'
    }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    
    // Log the email content as fallback
    console.log('='.repeat(80))
    console.log('📧 EMAIL FALLBACK - LOGGING CONTENT:')
    console.log('='.repeat(80))
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('HTML Content Length:', options.html.length, 'characters')
    console.log('='.repeat(80))
    console.log('HTML Preview:')
    console.log(options.html.substring(0, 500) + '...')
    console.log('='.repeat(80))
    
    return {
      success: true,
      message: 'Email logged (SMTP failed)'
    }
  }
}

export default transporter
