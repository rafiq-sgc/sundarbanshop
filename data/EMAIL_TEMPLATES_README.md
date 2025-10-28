# 📧 Email/SMS Templates - Standard Format

## Overview

This directory contains standard email and SMS templates for the Ekomart eCommerce platform. These templates are professionally designed for Bangladesh market with proper formatting, variables, and branding.

---

## 📁 Files

- **`email-templates.json`**: Contains all standard templates
- **`../scripts/seed-email-templates.ts`**: Seeder script to upload templates to database

---

## 📋 Template Categories

### 1. **Order Templates** (5 templates)
- Order Confirmation Email
- Order Shipped Email
- Order Delivered Email
- Order Shipped SMS
- Order Delivered SMS

### 2. **Marketing Templates** (2 templates)
- Welcome Email
- Abandoned Cart Reminder

### 3. **Account Templates** (2 templates)
- Password Reset
- Email Verification

### 4. **Support Templates** (2 templates)
- Support Ticket Created
- Chat Transcript

### 5. **Notification Templates** (3 templates)
- Low Stock Alert (Admin)
- Product Review Request
- Back in Stock Notification

**Total: 14 Professional Templates**

---

## 🎨 Template Format

Each template includes:

```json
{
  "name": "Template Name",
  "type": "email" | "sms",
  "category": "order" | "marketing" | "account" | "support" | "notification",
  "subject": "Email Subject with {{variables}}",
  "fromName": "Ekomart",
  "fromEmail": "hello@ekomart.com",
  "replyTo": "support@ekomart.com",
  "preheader": "Email preview text",
  "isActive": true,
  "isDefault": true,
  "content": "HTML or plain text content with {{variables}}"
}
```

---

## 📊 Template Features

### Email Templates Include:
✅ Professional HTML design  
✅ Mobile-responsive layout  
✅ Bangladesh-optimized (৳ currency symbol)  
✅ Ekomart branding (green color scheme)  
✅ Call-to-action buttons  
✅ Proper typography and spacing  
✅ Footer with contact information  
✅ Variable placeholders  

### SMS Templates Include:
✅ Concise messaging (under 160 characters)  
✅ Essential information only  
✅ Short URLs  
✅ Clear sender identification  

---

## 🔄 How to Use

### Method 1: Run Seeder Script (Recommended)

```bash
# Run the seeder to upload all templates
npm run seed:templates
```

This will:
1. Connect to MongoDB
2. Find or create admin user
3. Clear existing default templates
4. Upload all 14 templates
5. Show success summary with statistics

### Method 2: Manual Creation

1. Go to `/admin/settings/templates`
2. Click "Create Template"
3. Copy content from `email-templates.json`
4. Fill in the form
5. Click "Create Template"

---

## 📝 Variables Used

### Common Variables (All Templates):
```
{{customer_name}}      - Customer's full name
{{customer_email}}     - Customer's email address
{{customer_phone}}     - Customer's phone number
{{store_url}}          - Store homepage URL
{{unsubscribe_url}}    - Unsubscribe link
```

### Order-Specific Variables:
```
{{order_number}}          - Order ID (e.g., ORD-20250122-001)
{{order_date}}            - Order placement date
{{order_total}}           - Total order amount
{{order_items}}           - List of ordered items
{{payment_method}}        - Payment method used
{{tracking_url}}          - Order tracking link
{{tracking_number}}       - Shipment tracking number
{{carrier_name}}          - Delivery carrier name
{{estimated_delivery}}    - Estimated delivery time
{{delivery_date}}         - Actual delivery date
{{shipping_address}}      - Full shipping address
{{shipping_city}}         - Shipping city
{{shipping_postal_code}}  - Postal code
```

### Marketing Variables:
```
{{discount_code}}         - Promo/discount code
{{cart_items_count}}      - Number of items in cart
{{cart_total}}            - Cart total amount
{{cart_items_html}}       - HTML formatted cart items
{{cart_url}}              - Cart page URL
```

### Account Variables:
```
{{reset_link}}            - Password reset URL
{{expiry_time}}           - Link expiration time
{{verification_link}}     - Email verification URL
```

### Product Variables:
```
{{product_name}}          - Product name
{{product_sku}}           - Product SKU
{{product_price}}         - Product price
{{product_image}}         - Product image URL
{{product_url}}           - Product page URL
{{product_description}}   - Product description
{{product_features}}      - Product features list
{{product_category}}      - Product category
```

### Support Variables:
```
{{ticket_number}}         - Support ticket ID
{{ticket_subject}}        - Ticket subject
{{ticket_priority}}       - Ticket priority
{{ticket_date}}           - Ticket creation date
{{ticket_message}}        - Ticket message
{{ticket_url}}            - Ticket status URL
{{response_time}}         - Expected response time
{{agent_name}}            - Support agent name
{{chat_date}}             - Chat date
{{chat_transcript}}       - Chat conversation
{{conversation_id}}       - Conversation reference
{{rating_url}}            - Rating/feedback URL
```

### Inventory Variables (Admin):
```
{{current_stock}}         - Current stock level
{{threshold}}             - Low stock threshold
{{last_sale_date}}        - Last sale date
{{inventory_url}}         - Inventory management URL
{{supplier_url}}          - Supplier contact URL
```

---

## 🎨 Design Guidelines

### Color Scheme:
- **Primary**: #16a34a (Green - Ekomart brand)
- **Success**: #16a34a (Green)
- **Info**: #3b82f6 (Blue)
- **Warning**: #f59e0b (Orange)
- **Danger**: #ef4444 (Red)
- **Background**: #f9fafb (Light gray)

### Typography:
- **Font Family**: Arial, sans-serif
- **Line Height**: 1.6
- **Heading Sizes**: 24px - 32px
- **Body Text**: 16px
- **Small Text**: 14px

### Layout:
- **Max Width**: 600px
- **Padding**: 20px - 30px
- **Border Radius**: 6px - 8px
- **Responsive**: Mobile-optimized

---

## ✅ Template Checklist

Before using templates, ensure:

- [ ] All variables are properly formatted: `{{variable_name}}`
- [ ] URLs are correct and working
- [ ] Brand colors match Ekomart theme
- [ ] Mobile-responsive design
- [ ] Unsubscribe links included (marketing emails)
- [ ] Contact information is accurate
- [ ] Subject lines are compelling
- [ ] Preheader text is set (emails)
- [ ] SMS under 160 characters
- [ ] Test with real data before going live

---

## 🔧 Customization

To customize templates:

1. **Edit in Admin Panel**: Go to `/admin/settings/templates` and click edit
2. **Update JSON File**: Modify `email-templates.json` and re-run seeder
3. **Add New Variables**: Use format `{{new_variable_name}}`
4. **Update Styling**: Modify inline CSS in HTML content

---

## 📈 Usage Statistics

After seeding, you can track:
- Template usage count
- Last used date
- Active/inactive status
- Category distribution
- Email vs SMS count

View statistics at: `/admin/settings/templates`

---

## 🚀 Production Deployment

Before going live:

1. **Test All Templates**: Send test emails with real data
2. **Update URLs**: Change all URLs from localhost to production
3. **Configure SMTP**: Set up email sending service
4. **Configure SMS**: Set up SMS gateway (SSLWireless, etc.)
5. **Update Branding**: Ensure all logos and colors are correct
6. **Legal Compliance**: Add required unsubscribe links
7. **Backup Templates**: Export templates before making changes

---

## 📞 Support

For template issues or customization:
- Email: admin@ekomart.com
- Documentation: `/EMAIL_SMS_TEMPLATES_GUIDE.md`

---

## 🎉 Quick Start

```bash
# 1. Ensure MongoDB is running
# 2. Run the seeder
npm run seed:templates

# 3. View templates
# Open: http://localhost:3001/admin/settings/templates

# 4. Start using in your code
import { sendTemplateEmail } from '@/lib/email-template-helper'

await sendTemplateEmail('order-confirmation', customer.email, {
  customer_name: customer.name,
  order_number: order.orderNumber,
  // ... other variables
})
```

Ready to use! 🚀

