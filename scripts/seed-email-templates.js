const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ekomart';

// Email Template Schema
const EmailTemplateSchema = new mongoose.Schema(
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
);

// Pre-save hook
EmailTemplateSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Extract variables
  const variableRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  const variables = new Set();
  let match;
  
  while ((match = variableRegex.exec(this.content)) !== null) {
    variables.add(match[1]);
  }
  
  if (this.subject) {
    while ((match = variableRegex.exec(this.subject)) !== null) {
      variables.add(match[1]);
    }
  }
  
  this.variables = Array.from(variables);
  
  // Calculate SMS length
  if (this.type === 'sms') {
    this.smsLength = this.content.length;
  }
  
  next();
});

const EmailTemplate = mongoose.models.EmailTemplate || mongoose.model('EmailTemplate', EmailTemplateSchema);

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  password: String
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedEmailTemplates() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create admin user
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('⚠️  No admin user found, creating system admin...');
      adminUser = await User.create({
        name: 'System Admin',
        email: 'sundarbanshop.com@gmail.com',
        role: 'admin',
        password: 'temp_password'
      });
      console.log('✅ System admin created');
    }

    const adminId = adminUser._id;

    // Read templates
    const templatesPath = path.join(__dirname, '..', 'data', 'email-templates.json');
    const templatesData = fs.readFileSync(templatesPath, 'utf-8');
    const templates = JSON.parse(templatesData);

    console.log(`\n📧 Found ${templates.length} templates to seed\n`);

    // Clear existing default templates
    console.log('🗑️  Clearing existing default templates...');
    await EmailTemplate.deleteMany({ isDefault: true });
    console.log('✅ Existing default templates cleared\n');

    // Seed templates
    let successCount = 0;
    let errorCount = 0;

    for (const template of templates) {
      try {
        const slug = template.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Check if exists
        const existing = await EmailTemplate.findOne({ slug });
        
        if (existing) {
          console.log(`⚠️  Template "${template.name}" already exists, skipping...`);
          continue;
        }

        // Create template
        await EmailTemplate.create({
          ...template,
          slug,
          createdBy: adminId,
          usageCount: 0
        });

        console.log(`✅ Seeded: ${template.name} (${template.type} - ${template.category})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error seeding "${template.name}":`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Seeding Summary:`);
    console.log(`   ✅ Success: ${successCount} templates`);
    console.log(`   ❌ Errors: ${errorCount} templates`);
    console.log(`   📧 Total: ${templates.length} templates`);

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
    };

    console.log(`\n📈 Database Statistics:`);
    console.log(`   Total Templates: ${stats.total}`);
    console.log(`   Email: ${stats.email}`);
    console.log(`   SMS: ${stats.sms}`);
    console.log(`   Active: ${stats.active}`);
    console.log(`\n   By Category:`);
    console.log(`   - Order: ${stats.order}`);
    console.log(`   - Marketing: ${stats.marketing}`);
    console.log(`   - Account: ${stats.account}`);
    console.log(`   - Support: ${stats.support}`);
    console.log(`   - Notification: ${stats.notification}`);

    console.log(`\n🎉 Email templates seeded successfully!`);
    console.log(`\n✅ You can now view them at: http://localhost:3001/admin/settings/templates\n`);

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeder
seedEmailTemplates();

