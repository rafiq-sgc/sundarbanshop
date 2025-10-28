import mongoose, { Schema, Document } from 'mongoose'

export interface IInvoiceItem {
  product: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  image?: string
}

export interface IInvoice extends Document {
  _id: string
  invoiceNumber: string
  order: string
  customer: {
    _id: string
    name: string
    email?: string | null
    phone: string
  }
  billingAddress: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  items: IInvoiceItem[]
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  dueDate?: Date
  paidAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const invoiceItemSchema = new Schema({
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product',
    required: false // Allow null for custom items
  },
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1
  },
  unitPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  totalPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  image: { 
    type: String 
  }
})

const invoiceSchema = new Schema({
  invoiceNumber: { 
    type: String, 
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  order: { 
    type: Schema.Types.ObjectId, 
    ref: 'Order',
    required: true
  },
  customer: {
    _id: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String,
      required: false,
      default: null
    },
    phone: { 
      type: String,
      required: true
    }
  },
  billingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  items: [invoiceItemSchema],
  subtotal: { 
    type: Number, 
    required: true,
    min: 0
  },
  tax: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  shipping: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  discount: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  total: { 
    type: Number, 
    required: true,
    min: 0
  },
  currency: { 
    type: String, 
    required: true,
    default: 'USD'
  },
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  dueDate: { 
    type: Date 
  },
  paidAt: { 
    type: Date 
  },
  notes: { 
    type: String 
  }
}, {
  timestamps: true
})

// Indexes for better performance (invoiceNumber index is already defined as unique above)
invoiceSchema.index({ order: 1 })
invoiceSchema.index({ 'customer._id': 1 })
invoiceSchema.index({ status: 1 })
invoiceSchema.index({ createdAt: -1 })

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', invoiceSchema)
