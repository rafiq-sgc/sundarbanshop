// Email Templates Library

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  category: 'transactional' | 'marketing' | 'notification' | 'custom'
  variables: string[] // Available variables like {{name}}, {{email}}, etc.
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to {{storeName}}! 🎉',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Welcome to {{storeName}}!</h1>
    
    <p style="color: #666; line-height: 1.6;">Hi {{name}},</p>
    
    <p style="color: #666; line-height: 1.6;">
      Thank you for joining our community! We're thrilled to have you with us.
    </p>
    
    <p style="color: #666; line-height: 1.6;">
      As a valued member, you'll receive exclusive offers, early access to new products, 
      and personalized recommendations tailored just for you.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{shopUrl}}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Start Shopping
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      If you have any questions, feel free to reach out to our support team at {{supportEmail}}.
    </p>
    
    <p style="color: #666; line-height: 1.6;">
      Happy shopping!<br>
      The {{storeName}} Team
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© 2025 {{storeName}}. All rights reserved.</p>
  </div>
</div>
    `.trim(),
    category: 'transactional',
    variables: ['name', 'storeName', 'shopUrl', 'supportEmail']
  },
  {
    id: 'welcome-with-credentials',
    name: 'Welcome Email with Login Credentials',
    subject: 'Welcome to {{storeName}} - Your Account Details',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Welcome to {{storeName}}!</h1>
    
    <p style="color: #666; line-height: 1.6;">Hi $\{{name}},</p>
    
    <p style="color: #666; line-height: 1.6;">
      Thank you for your order! We've created an account for you so you can easily track your orders and manage your purchases.
    </p>
    
    <div style="background-color: #f8f9fa; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 5px;">
      <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">🔐 Your Login Credentials</h3>
      <p style="color: #666; margin: 5px 0;"><strong>Email:</strong> $\{{email}}</p>
      <p style="color: #666; margin: 5px 0;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 16px; background-color: #fff; padding: 5px 10px; border-radius: 3px; border: 1px solid #ddd;">$\{{password}}</span></p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="$\{{loginUrl}}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Login to Your Account
      </a>
    </div>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <p style="color: #856404; margin: 0; font-size: 14px;">
        <strong>⚠️ Important:</strong> For your security, please change your password after your first login.
      </p>
    </div>
    
    <h3 style="color: #333; margin-top: 30px;">What you can do with your account:</h3>
    <ul style="color: #666; line-height: 1.8;">
      <li>Track all your orders in real-time</li>
      <li>View order history and invoices</li>
      <li>Save your shipping addresses</li>
      <li>Get exclusive member discounts</li>
      <li>Receive personalized recommendations</li>
    </ul>
    
    <p style="color: #666; line-height: 1.6; margin-top: 30px;">
      If you have any questions, feel free to reach out to our support team.
    </p>
    
    <p style="color: #666; line-height: 1.6;">
      Welcome aboard!<br>
      The {{storeName}} Team
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© 2025 {{storeName}}. All rights reserved.</p>
  </div>
</div>
    `.trim(),
    category: 'transactional',
    variables: ['name', 'email', 'password', 'loginUrl', 'storeName']
  },
  {
    id: 'order-confirmation',
    name: 'Order Confirmation',
    subject: 'Order Confirmation - #{{orderNumber}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Order Confirmed! 📦</h1>
    
    <p style="color: #666; line-height: 1.6;">Hi {{name}},</p>
    
    <p style="color: #666; line-height: 1.6;">
      Thank you for your order! We're preparing your items and will ship them soon.
    </p>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Order Details</h3>
      <p style="color: #666; margin: 5px 0;"><strong>Order Number:</strong> #{{orderNumber}}</p>
      <p style="color: #666; margin: 5px 0;"><strong>Order Date:</strong> {{orderDate}}</p>
      <p style="color: #666; margin: 5px 0;"><strong>Total Amount:</strong> {{orderTotal}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderUrl}}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Track Your Order
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      We'll send you a shipping notification once your order is on its way.
    </p>
    
    <p style="color: #666; line-height: 1.6;">
      Thank you for shopping with us!<br>
      The {{storeName}} Team
    </p>
  </div>
</div>
    `.trim(),
    category: 'transactional',
    variables: ['name', 'orderNumber', 'orderDate', 'orderTotal', 'orderUrl', 'storeName']
  },
  {
    id: 'promotional',
    name: 'Promotional Email',
    subject: '🎁 Special Offer Just for You!',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Special Offer Just for You! 🎁</h1>
    
    <p style="color: #666; line-height: 1.6;">Hi {{name}},</p>
    
    <p style="color: #666; line-height: 1.6;">
      We have something special for our valued customers!
    </p>
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0;">
      <h2 style="margin: 0; font-size: 32px;">{{discount}}% OFF</h2>
      <p style="margin: 10px 0; font-size: 18px;">On Your Next Purchase</p>
      <p style="margin: 15px 0; font-size: 14px; opacity: 0.9;">Use code: <strong>{{couponCode}}</strong></p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{shopUrl}}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Shop Now
      </a>
    </div>
    
    <p style="color: #999; font-size: 12px; line-height: 1.6;">
      *Offer valid until {{expiryDate}}. Terms and conditions apply.
    </p>
  </div>
</div>
    `.trim(),
    category: 'marketing',
    variables: ['name', 'discount', 'couponCode', 'shopUrl', 'expiryDate']
  },
  {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset Your Password',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Password Reset Request</h1>
    
    <p style="color: #666; line-height: 1.6;">Hi {{name}},</p>
    
    <p style="color: #666; line-height: 1.6;">
      We received a request to reset your password. Click the button below to create a new password:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{resetUrl}}" style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      This link will expire in {{expiryHours}} hours.
    </p>
    
    <p style="color: #666; line-height: 1.6;">
      If you didn't request this, please ignore this email or contact support if you have concerns.
    </p>
    
    <p style="color: #666; line-height: 1.6;">
      Best regards,<br>
      The {{storeName}} Team
    </p>
  </div>
</div>
    `.trim(),
    category: 'transactional',
    variables: ['name', 'resetUrl', 'expiryHours', 'storeName']
  },
  {
    id: 'shipping-notification',
    name: 'Shipping Notification',
    subject: 'Your Order is On Its Way! 🚚',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Your Order is On Its Way! 🚚</h1>
    
    <p style="color: #666; line-height: 1.6;">Hi {{name}},</p>
    
    <p style="color: #666; line-height: 1.6;">
      Great news! Your order has been shipped and is on its way to you.
    </p>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Shipping Details</h3>
      <p style="color: #666; margin: 5px 0;"><strong>Order Number:</strong> #{{orderNumber}}</p>
      <p style="color: #666; margin: 5px 0;"><strong>Tracking Number:</strong> {{trackingNumber}}</p>
      <p style="color: #666; margin: 5px 0;"><strong>Carrier:</strong> {{carrier}}</p>
      <p style="color: #666; margin: 5px 0;"><strong>Expected Delivery:</strong> {{expectedDelivery}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{trackingUrl}}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Track Package
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      We hope you enjoy your purchase!<br>
      The {{storeName}} Team
    </p>
  </div>
</div>
    `.trim(),
    category: 'notification',
    variables: ['name', 'orderNumber', 'trackingNumber', 'carrier', 'expectedDelivery', 'trackingUrl', 'storeName']
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    subject: '📰 {{storeName}} Newsletter - {{month}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">{{storeName}} Newsletter</h1>
    
    <p style="color: #666; line-height: 1.6;">Hi {{name}},</p>
    
    <p style="color: #666; line-height: 1.6;">
      Here's what's new this month at {{storeName}}:
    </p>
    
    <div style="border-left: 4px solid #4CAF50; padding-left: 20px; margin: 20px 0;">
      <h3 style="color: #333;">{{highlightTitle}}</h3>
      <p style="color: #666; line-height: 1.6;">{{highlightContent}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{readMoreUrl}}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Read More
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      Stay tuned for more updates!<br>
      The {{storeName}} Team
    </p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; text-align: center;">
      <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a> | 
      <a href="{{preferencesUrl}}" style="color: #999;">Email Preferences</a>
    </p>
  </div>
</div>
    `.trim(),
    category: 'marketing',
    variables: ['name', 'storeName', 'month', 'highlightTitle', 'highlightContent', 'readMoreUrl', 'unsubscribeUrl', 'preferencesUrl']
  },
  {
    id: 'order-invoice',
    name: 'Order Invoice (With PDF)',
    subject: 'Invoice for Order #{{orderNumber}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="border-bottom: 3px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px;">
      <h1 style="color: #333; margin: 0; font-size: 28px;">INVOICE</h1>
      <p style="color: #666; margin: 5px 0 0 0;">Order #{{orderNumber}}</p>
    </div>

    <!-- Customer Info -->
    <div style="margin-bottom: 30px;">
      <p style="color: #666; margin: 0;">Hi {{customerName}},</p>
      <p style="color: #666; margin: 10px 0;">Thank you for your order! Please find your invoice details below.</p>
    </div>

    <!-- Order Details Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #4CAF50; color: white;">
          <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Item</th>
          <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Qty</th>
          <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Price</th>
          <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{orderItems}}
      </tbody>
    </table>

    <!-- Summary -->
    <div style="border-top: 2px solid #eee; padding-top: 15px; margin-top: 20px;">
      <table style="width: 100%; max-width: 300px; margin-left: auto;">
        <tr>
          <td style="padding: 5px 0; text-align: right; color: #666;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right; font-weight: bold; width: 100px;">$\{{subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; text-align: right; color: #666;">Tax:</td>
          <td style="padding: 5px 0; text-align: right; font-weight: bold;">$\{{tax}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; text-align: right; color: #666;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right; font-weight: bold;">$\{{shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; text-align: right; color: #EF4444;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; font-weight: bold; color: #EF4444;">-$\{{discount}}</td>
        </tr>
        <tr style="border-top: 2px solid #333;">
          <td style="padding: 10px 0; text-align: right; font-size: 16px; font-weight: bold;">TOTAL:</td>
          <td style="padding: 10px 0; text-align: right; font-size: 18px; font-weight: bold; color: #4CAF50;">$\{{total}}</td>
        </tr>
      </table>
    </div>

    <!-- Payment & Shipping Info -->
    <div style="margin-top: 30px; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">
      <div style="margin-bottom: 15px;">
        <p style="margin: 0; color: #666; font-size: 12px;">PAYMENT METHOD</p>
        <p style="margin: 5px 0 0 0; font-weight: bold;">{{paymentMethod}}</p>
      </div>
      <div>
        <p style="margin: 0; color: #666; font-size: 12px;">SHIPPING ADDRESS</p>
        <p style="margin: 5px 0 0 0; font-weight: bold;">{{shippingAddress}}</p>
      </div>
    </div>

    <!-- Tracking Options -->
    <div style="margin: 30px 0; padding: 20px; background-color: #e8f5e9; border-radius: 8px;">
      <h3 style="color: #333; margin-top: 0;">📦 Track Your Order</h3>
      <p style="color: #666; margin: 10px 0;">Choose your preferred way to track your order:</p>
      
      <div style="margin: 20px 0;">
        <div style="margin-bottom: 15px;">
          <strong style="color: #333;">Option 1: Quick Track (No Login Required)</strong>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Get instant order status with just your order number</p>
          <a href="{{trackingUrl}}" style="display: inline-block; margin-top: 10px; background-color: #4CAF50; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Track Order Now
          </a>
        </div>
        
        <div style="border-top: 1px solid #c8e6c9; padding-top: 15px; margin-top: 15px;">
          <strong style="color: #333;">Option 2: Login to Dashboard</strong>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Access your full order history and account</p>
          <a href="{{orderUrl}}" style="display: inline-block; margin-top: 10px; background-color: #2196F3; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View in Dashboard
          </a>
        </div>
      </div>
      
      <p style="color: #666; margin: 15px 0 0 0; font-size: 13px;">
        💡 <em>PDF invoice is attached to this email for your records</em>
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
      <p style="color: #666; font-size: 12px; margin: 5px 0;">
        If you have any questions, please contact us at sundarbanshop.com@gmail.com
      </p>
      <p style="color: #999; font-size: 11px; margin: 15px 0 0 0;">
        This is an automated email. Please do not reply directly to this message.
      </p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© 2025 Sundarban Shop. All rights reserved.</p>
  </div>
</div>
    `.trim(),
    category: 'transactional',
    variables: ['orderNumber', 'customerName', 'orderItems', 'subtotal', 'tax', 'shipping', 'discount', 'total', 'paymentMethod', 'shippingAddress', 'orderUrl', 'trackingUrl']
  },
  {
    id: 'order-status-confirmed',
    name: 'Order Status: Confirmed',
    subject: 'Order Confirmed - #{{orderNumber}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="background-color: #4CAF50; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 30px;">✓</span>
      </div>
      <h1 style="color: #333; margin: 0;">Order Confirmed!</h1>
    </div>
    
    <p style="color: #666; line-height: 1.6;">Hi {{customerName}},</p>
    
    <p style="color: #666; line-height: 1.6;">
      Great news! Your order has been confirmed and is being prepared for shipment.
    </p>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; border-left: 4px solid #4CAF50; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Order Summary</h3>
      <p style="color: #666; margin: 5px 0;"><strong>Order Number:</strong> #{{orderNumber}}</p>
      <p style="color: #666; margin: 5px 0;"><strong>Order Date:</strong> {{orderDate}}</p>
      <p style="color: #666; margin: 5px 0;"><strong>Total Amount:</strong> $\{{total}}</p>
      <p style="color: #666; margin: 5px 0;"><strong>Items:</strong> {{itemCount}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderUrl}}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Track Your Order
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      We'll notify you once your order ships.
    </p>
    
    <p style="color: #666; line-height: 1.6;">
      Thank you for shopping with us!<br>
      The {{storeName}} Team
    </p>
  </div>
</div>
    `.trim(),
    category: 'transactional',
    variables: ['customerName', 'orderNumber', 'orderDate', 'total', 'itemCount', 'orderUrl', 'storeName']
  },
  {
    id: 'order-status-processing',
    name: 'Order Status: Processing',
    subject: 'Your Order is Being Processed - #{{orderNumber}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Order Being Processed 📦</h1>
    
    <p style="color: #666; line-height: 1.6;">Hi {{customerName}},</p>
    
    <p style="color: #666; line-height: 1.6;">
      Your order #{{orderNumber}} is now being processed. Our team is carefully preparing your items for shipment.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderUrl}}" style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        View Order Status
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      We'll send you another email once your order ships.
    </p>
    
    <p style="color: #666; line-height: 1.6;">
      Best regards,<br>
      The {{storeName}} Team
    </p>
  </div>
</div>
    `.trim(),
    category: 'notification',
    variables: ['customerName', 'orderNumber', 'orderUrl', 'storeName']
  },
  {
    id: 'order-status-shipped',
    name: 'Order Status: Shipped',
    subject: 'Your Order Has Shipped! 🚚 #{{orderNumber}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Your Order is On Its Way! 🚚</h1>
    
    <p style="color: #666; line-height: 1.6;">Hi {{customerName}},</p>
    
    <p style="color: #666; line-height: 1.6;">
      Exciting news! Your order has been shipped and is on its way to you.
    </p>
    
    <div style="background-color: #E3F2FD; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #1976D2; margin-top: 0;">Shipping Information</h3>
      <p style="color: #666; margin: 5px 0;"><strong>Order Number:</strong> #{{orderNumber}}</p>
      <p style="color: #666; margin: 5px 0;"><strong>Tracking Number:</strong> {{trackingNumber}}</p>
      <p style="color: #666; margin: 5px 0;"><strong>Expected Delivery:</strong> {{expectedDelivery}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{trackingUrl}}" style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin-right: 10px;">
        Track Package
      </a>
      <a href="{{orderUrl}}" style="background-color: #fff; color: #2196F3; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; border: 2px solid #2196F3;">
        View Order
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      We hope you enjoy your purchase!<br>
      The {{storeName}} Team
    </p>
  </div>
</div>
    `.trim(),
    category: 'notification',
    variables: ['customerName', 'orderNumber', 'trackingNumber', 'expectedDelivery', 'trackingUrl', 'orderUrl', 'storeName']
  },
  {
    id: 'order-status-delivered',
    name: 'Order Status: Delivered',
    subject: 'Order Delivered - #{{orderNumber}} 🎉',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Order Delivered! 🎉</h1>
    
    <p style="color: #666; line-height: 1.6;">Hi {{customerName}},</p>
    
    <p style="color: #666; line-height: 1.6;">
      Your order #{{orderNumber}} has been delivered successfully!
    </p>
    
    <div style="background-color: #F0FDF4; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
      <p style="color: #666; margin: 0;">We hope you're satisfied with your purchase. If you have any issues, please don't hesitate to contact us.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{reviewUrl}}" style="background-color: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        ⭐ Leave a Review
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      Thank you for choosing {{storeName}}!<br>
      We look forward to serving you again.
    </p>
  </div>
</div>
    `.trim(),
    category: 'notification',
    variables: ['customerName', 'orderNumber', 'reviewUrl', 'storeName']
  },
  {
    id: 'order-status-cancelled',
    name: 'Order Status: Cancelled',
    subject: 'Order Cancelled - #{{orderNumber}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Order Cancelled</h1>
    
    <p style="color: #666; line-height: 1.6;">Hi {{customerName}},</p>
    
    <p style="color: #666; line-height: 1.6;">
      Your order #{{orderNumber}} has been cancelled as requested.
    </p>
    
    <div style="background-color: #FEF2F2; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #EF4444;">
      <p style="color: #666; margin: 0;"><strong>Cancellation Reason:</strong> {{cancellationReason}}</p>
      <p style="color: #666; margin: 10px 0 0 0;">If you were charged, a refund will be processed within 3-5 business days.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{shopUrl}}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Continue Shopping
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      We're sorry to see this order cancelled. If you have any questions, please contact our support team.
    </p>
    
    <p style="color: #666; line-height: 1.6;">
      Best regards,<br>
      The {{storeName}} Team
    </p>
  </div>
</div>
    `.trim(),
    category: 'transactional',
    variables: ['customerName', 'orderNumber', 'cancellationReason', 'shopUrl', 'storeName']
  },
  {
    id: 'custom',
    name: 'Custom Email (Blank)',
    subject: '',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Hello {{name}},</h1>
    
    <p style="color: #666; line-height: 1.6;">
      <!-- Your custom message here -->
    </p>
    
    <p style="color: #666; line-height: 1.6;">
      Best regards,<br>
      The {{storeName}} Team
    </p>
  </div>
</div>
    `.trim(),
    category: 'custom',
    variables: ['name', 'storeName']
  }
]

// Helper function to replace variables in template
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, value || '')
  })
  return result
}

// Get template by ID
export function getTemplateById(id: string): EmailTemplate | undefined {
  return emailTemplates.find(t => t.id === id)
}

// Get templates by category
export function getTemplatesByCategory(
  category: EmailTemplate['category']
): EmailTemplate[] {
  return emailTemplates.filter(t => t.category === category)
}

