import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ekomart'

// Email Template Schema (matching the model)
interface IEmailTemplate {
  name: string
  slug: string
  subject?: string
  type: 'email' | 'sms'
  category: 'order' | 'marketing' | 'notification' | 'support' | 'account'
  content: string
  variables: string[]
  isActive: boolean
  isDefault: boolean
  lastUsed?: Date
  usageCount: number
  preheader?: string
  fromName?: string
  fromEmail?: string
  replyTo?: string
  smsLength?: number
  createdBy: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
}

const EmailTemplateSchema = new mongoose.Schema<IEmailTemplate>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    subject: { type: String, trim: true, maxlength: 200 },
    type: { type: String, required: true, enum: ['email', 'sms'], default: 'email' },
    category: { type: String, required: true, enum: ['order', 'marketing', 'notification', 'support', 'account'], default: 'notification' },
    content: { type: String, required: true },
    variables: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    lastUsed: Date,
    usageCount: { type: Number, default: 0 },
    preheader: { type: String, maxlength: 100 },
    fromName: String,
    fromEmail: String,
    replyTo: String,
    smsLength: Number,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

// Pre-save hook to generate slug and extract variables
EmailTemplateSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  
  // Extract variables from content
  const variableRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g
  const variables = new Set<string>()
  let match
  
  while ((match = variableRegex.exec(this.content)) !== null) {
    variables.add(match[1])
  }
  
  if (this.subject) {
    const subjectRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g
    while ((match = subjectRegex.exec(this.subject)) !== null) {
      variables.add(match[1])
    }
  }
  
  this.variables = Array.from(variables)
  
  // Calculate SMS length
  if (this.type === 'sms') {
    this.smsLength = this.content.length
  }
  
  next()
})

const EmailTemplate = mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema)

// User Schema (minimal for finding admin)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
})

const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function seedEmailTemplates() {
  try {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Find admin user or use a system ID
    let adminUser = await User.findOne({ role: 'admin' })
    let adminId: mongoose.Types.ObjectId

    if (!adminUser) {
      console.log('⚠️  No admin user found, creating system admin...')
      adminUser = await User.create({
        name: 'System Admin',
        email: 'sundarbanshop.com@gmail.com',
        role: 'admin',
        password: 'temp_password' // This should be hashed in production
      })
      console.log('✅ System admin created')
    }

    adminId = adminUser._id

    // Read templates from JSON file
    const templatesPath = path.join(process.cwd(), 'data', 'email-templates.json')
    const templatesData = fs.readFileSync(templatesPath, 'utf-8')
    const templates = JSON.parse(templatesData)

    console.log(`\n📧 Found ${templates.length} templates to seed\n`)

    // Clear existing templates (optional - comment out if you want to keep existing)
    console.log('🗑️  Clearing existing templates...')
    await EmailTemplate.deleteMany({ isDefault: true })
    console.log('✅ Existing default templates cleared\n')

    // Seed templates
    let successCount = 0
    let errorCount = 0

    for (const template of templates) {
      try {
        const slug = template.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')

        // Check if template already exists
        const existing = await EmailTemplate.findOne({ slug })
        
        if (existing) {
          console.log(`⚠️  Template "${template.name}" already exists, skipping...`)
          continue
        }

        // Create template
        await EmailTemplate.create({
          ...template,
          slug,
          createdBy: adminId,
          usageCount: 0
        })

        console.log(`✅ Seeded: ${template.name} (${template.type} - ${template.category})`)
        successCount++
      } catch (error: any) {
        console.error(`❌ Error seeding "${template.name}":`, error.message)
        errorCount++
      }
    }

    console.log(`\n📊 Seeding Summary:`)
    console.log(`   ✅ Success: ${successCount} templates`)
    console.log(`   ❌ Errors: ${errorCount} templates`)
    console.log(`   📧 Total: ${templates.length} templates`)

    // Display statistics
    const stats = {
      total: await EmailTemplate.countDocuments(),
      email: await EmailTemplate.countDocuments({ type: 'email' }),
      sms: await EmailTemplate.countDocuments({ type: 'sms' }),
      order: await EmailTemplate.countDocuments({ category: 'order' }),
      marketing: await EmailTemplate.countDocuments({ category: 'marketing' }),
      account: await EmailTemplate.countDocuments({ category: 'account' }),
      support: await EmailTemplate.countDocuments({ category: 'support' }),
      notification: await EmailTemplate.countDocuments({ category: 'notification' }),
      active: await EmailTemplate.countDocuments({ isActive: true })
    }

    console.log(`\n📈 Database Statistics:`)
    console.log(`   Total Templates: ${stats.total}`)
    console.log(`   Email: ${stats.email}`)
    console.log(`   SMS: ${stats.sms}`)
    console.log(`   Active: ${stats.active}`)
    console.log(`\n   By Category:`)
    console.log(`   - Order: ${stats.order}`)
    console.log(`   - Marketing: ${stats.marketing}`)
    console.log(`   - Account: ${stats.account}`)
    console.log(`   - Support: ${stats.support}`)
    console.log(`   - Notification: ${stats.notification}`)

    console.log(`\n🎉 Email templates seeded successfully!`)
    console.log(`\n✅ You can now view them at: http://localhost:3001/admin/settings/templates\n`)

  } catch (error) {
    console.error('❌ Error seeding templates:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the seeder
seedEmailTemplates()

