# 📧 Email Service Documentation

## Overview
Comprehensive email sending service with template support, variable substitution, and professional UI.

---

## 📁 File Structure

```
src/
├── services/email/
│   ├── email.service.ts      # Email API service
│   └── index.ts               # Service exports
├── lib/
│   └── email-templates.ts     # Email templates library
├── components/admin/
│   └── EmailComposerModal.tsx # Email composer UI
└── app/api/admin/emails/
    └── send/route.ts          # Email sending API
```

---

## 🚀 Quick Start

### 1. Configure Email in .env.local

**For Gmail:**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@ekomart.com
EMAIL_FROM_NAME=EkoMart
```

### 2. Use Email Composer

```typescript
import EmailComposerModal from '@/components/admin/EmailComposerModal'

const [showEmailModal, setShowEmailModal] = useState(false)
const [recipient, setRecipient] = useState(null)

// Open modal
<Button onClick={() => {
  setRecipient({ email: 'customer@example.com', name: 'John Doe' })
  setShowEmailModal(true)
}}>
  Send Email
</Button>

// Modal
<EmailComposerModal
  isOpen={showEmailModal}
  onClose={() => setShowEmailModal(false)}
  defaultRecipient={recipient}
  onSuccess={() => toast.success('Email sent!')}
/>
```

### 3. Use Programmatically

```typescript
import { emailService } from '@/services/email'

await emailService.send({
  to: { email: 'customer@example.com', name: 'John' },
  subject: 'Welcome!',
  body: '<h1>Hello John!</h1>',
  priority: 'normal'
})
```

---

## 📧 Email Service API

### Methods

#### `send(data: SendEmailRequest): Promise<SendEmailResponse>`
Send an email with full customization options.

```typescript
const result = await emailService.send({
  to: { email: 'customer@example.com', name: 'John Doe' },
  subject: 'Your Order Update',
  body: '<html>...</html>',
  cc: [{ email: 'manager@ekomart.com' }],
  bcc: [{ email: 'archive@ekomart.com' }],
  priority: 'high',
  replyTo: 'support@ekomart.com',
  templateId: 'order-confirmation',
  attachments: [{
    filename: 'invoice.pdf',
    content: 'base64-encoded-content',
    contentType: 'application/pdf'
  }]
})
```

#### `getLogs(params?): Promise<{logs: EmailLog[], total: number}>`
Get email sending history.

```typescript
const logs = await emailService.getLogs({
  limit: 10,
  offset: 0,
  status: 'sent'
})
```

#### `testConnection(): Promise<{success: boolean, message: string}>`
Test email configuration.

```typescript
const test = await emailService.testConnection()
// { success: true, message: "Connection successful" }
```

---

## 🎨 Email Templates Library

### Using Templates

```typescript
import { 
  emailTemplates, 
  getTemplateById, 
  replaceTemplateVariables 
} from '@/lib/email-templates'

// Get template
const template = getTemplateById('welcome')

// Replace variables
const html = replaceTemplateVariables(template.body, {
  name: 'John Doe',
  storeName: 'EkoMart',
  shopUrl: 'https://ekomart.com',
  supportEmail: 'support@ekomart.com'
})

// Send
await emailService.send({
  to: { email: 'john@example.com', name: 'John Doe' },
  subject: replaceTemplateVariables(template.subject, { storeName: 'EkoMart' }),
  body: html
})
```

### Adding Custom Templates

```typescript
// In email-templates.ts
export const emailTemplates: EmailTemplate[] = [
  // ... existing templates
  {
    id: 'abandoned-cart',
    name: 'Abandoned Cart Recovery',
    subject: 'You left something behind! 🛒',
    body: `
<div style="...">
  <h1>Hi {{name}},</h1>
  <p>We noticed you left items in your cart.</p>
  <p>Total: {{cartTotal}}</p>
  <a href="{{checkoutUrl}}">Complete Your Purchase</a>
</div>
    `.trim(),
    category: 'marketing',
    variables: ['name', 'cartTotal', 'checkoutUrl']
  }
]
```

---

## 🎯 EmailComposerModal Props

```typescript
interface EmailComposerModalProps {
  isOpen: boolean                    // Show/hide modal
  onClose: () => void                // Close handler
  defaultRecipient?: {               // Pre-fill recipient
    email: string
    name?: string
  }
  defaultSubject?: string            // Pre-fill subject
  onSuccess?: () => void             // Success callback
}
```

---

## 🌟 Features Breakdown

### 1. Template System
- Pre-built professional templates
- Variable substitution with `{{variable}}`
- Category-based organization
- Visual template selector
- One-click template loading

### 2. Email Composer
- Clean, modern UI
- HTML support
- Live preview
- Code view toggle
- Priority selection
- CC/BCC support
- Reply-To configuration

### 3. Validation
- Email format validation
- Required field checking
- HTML sanitization (optional)
- Zod schema validation

### 4. Error Handling
- Connection errors
- Validation errors
- Sending failures
- User-friendly messages

---

## 💡 Integration Examples

### Order Confirmation Email
```typescript
// In order creation API
await emailService.send({
  to: { email: order.user.email, name: order.user.name },
  subject: `Order Confirmation - #${order.orderNumber}`,
  body: replaceTemplateVariables(
    getTemplateById('order-confirmation').body,
    {
      name: order.user.name,
      orderNumber: order.orderNumber,
      orderDate: new Date(order.createdAt).toLocaleDateString(),
      orderTotal: `$${order.total.toFixed(2)}`,
      orderUrl: `${process.env.NEXTAUTH_URL}/orders/${order._id}`,
      storeName: 'EkoMart'
    }
  ),
  templateId: 'order-confirmation'
})
```

### Bulk Newsletter
```typescript
// Send to multiple customers
const customers = await User.find({ 
  role: 'user', 
  isActive: true,
  email: { $exists: true, $ne: null }
})

for (const customer of customers) {
  await emailService.send({
    to: { email: customer.email, name: customer.name },
    subject: 'Monthly Newsletter',
    body: replaceTemplateVariables(newsleterTemplate, {
      name: customer.name,
      // ... other variables
    })
  })
}
```

---

## 🔧 Customization

### Change Email Styles
Edit templates in `/src/lib/email-templates.ts`:
- Update HTML structure
- Modify inline styles
- Add/remove variables
- Change colors, fonts, layout

### Add New Email Types
1. Create template in `email-templates.ts`
2. Define variables
3. Use in EmailComposerModal
4. Send via API

---

## 📈 Analytics (Future)

Track email performance:
- Open rates
- Click-through rates
- Bounce rates
- Unsubscribe rates
- Conversion tracking

---

## 🎉 Summary

**Email System Includes:**
- ✅ 7 Professional templates
- ✅ Variable substitution
- ✅ HTML support
- ✅ Preview mode
- ✅ Priority levels
- ✅ CC/BCC support
- ✅ Template selector UI
- ✅ Reusable modal component
- ✅ API integration
- ✅ Error handling
- ✅ Full TypeScript support

**Ready to send beautiful emails to your customers!** 📧✨

