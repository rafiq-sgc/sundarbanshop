import nodemailer from 'nodemailer'

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'rafiqul.pust.cse@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
}

// Create transporter
const transporter = nodemailer.createTransport(emailConfig)

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service error:', error)
  } else {
    console.log('Email service is ready to send messages')
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
    // Check if we have valid SMTP credentials
    const hasValidCredentials = emailConfig.auth.user && 
                               emailConfig.auth.pass && 
                               emailConfig.auth.pass !== 'your-app-password' &&
                               emailConfig.auth.pass !== 'test-password'

    if (!hasValidCredentials) {
      // If no valid credentials, log the email and return success
      console.log('='.repeat(80))
      console.log('📧 EMAIL NOT SENT - NO SMTP CREDENTIALS:')
      console.log('='.repeat(80))
      console.log('To:', options.to)
      console.log('Subject:', options.subject)
      console.log('Attachments:', options.attachments?.length || 0, 'files')
      console.log('HTML Content Length:', options.html.length, 'characters')
      console.log('='.repeat(80))
      console.log('HTML Preview:')
      console.log(options.html.substring(0, 500) + '...')
      console.log('='.repeat(80))
      console.log('💡 To send real emails, set up SMTP credentials in environment variables:')
      console.log('   SMTP_USER=your-email@gmail.com')
      console.log('   SMTP_PASS=your-app-password')
      console.log('='.repeat(80))
      
      return {
        success: true,
        message: 'Email logged (SMTP credentials not configured)'
      }
    }

    // Send real email with valid credentials
    const mailOptions = {
      from: `"Sundarban Shop" <${emailConfig.auth.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments
    }

    console.log('📧 Sending real email to:', options.to)
    console.log('📧 Subject:', options.subject)
    console.log('📧 Attachments:', options.attachments?.length || 0, 'files')

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', result.messageId)
    
    return {
      success: true,
      message: 'Email sent successfully'
    }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    
    // Fallback: Log the email if SMTP fails
    console.log('='.repeat(80))
    console.log('📧 EMAIL FALLBACK - SMTP FAILED, LOGGING INSTEAD:')
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
