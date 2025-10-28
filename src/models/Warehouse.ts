import mongoose, { Schema, Document } from 'mongoose'

export interface IWarehouseInventory {
  product: string
  quantity: number
  reserved: number
}

export interface IWarehouse extends Document {
  _id: string
  name: string
  code: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  phone?: string
  email?: string
  manager?: string
  isActive: boolean
  inventory: IWarehouseInventory[]
  createdAt: Date
  updatedAt: Date
  getAvailableStock(productId: string): number
  updateStock(productId: string, quantity: number, operation: 'add' | 'subtract'): Promise<void>
}

const warehouseInventorySchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  reserved: {
    type: Number,
    default: 0,
    min: [0, 'Reserved quantity cannot be negative']
  }
}, { _id: false })

// Virtual for available stock
warehouseInventorySchema.virtual('available').get(function() {
  return this.quantity - this.reserved
})

const addressSchema = new Schema({
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true }
}, { _id: false })

const warehouseSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Warehouse code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
    minlength: [2, 'Code must be at least 2 characters'],
    maxlength: [10, 'Code cannot exceed 10 characters']
  },
  address: {
    type: addressSchema,
    required: [true, 'Address is required']
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  inventory: [warehouseInventorySchema]
}, {
  timestamps: true
})

// Indexes for better performance
warehouseSchema.index({ code: 1, isActive: 1 })
warehouseSchema.index({ 'inventory.product': 1 })
warehouseSchema.index({ manager: 1, isActive: 1 })

// Ensure virtual fields are serialized
warehouseSchema.set('toJSON', { virtuals: true })
warehouseSchema.set('toObject', { virtuals: true })

// Get available stock for a product
warehouseSchema.methods.getAvailableStock = function(productId: string): number {
  const item = this.inventory.find(
    (inv: IWarehouseInventory) => inv.product.toString() === productId
  )
  return item ? item.quantity - item.reserved : 0
}

// Update stock for a product
warehouseSchema.methods.updateStock = async function(
  productId: string, 
  quantity: number, 
  operation: 'add' | 'subtract'
): Promise<void> {
  const itemIndex = this.inventory.findIndex(
    (inv: IWarehouseInventory) => inv.product.toString() === productId
  )
  
  if (itemIndex === -1) {
    if (operation === 'add') {
      this.inventory.push({ product: productId, quantity, reserved: 0 })
    } else {
      throw new Error('Product not found in warehouse inventory')
    }
  } else {
    if (operation === 'add') {
      this.inventory[itemIndex].quantity += quantity
    } else {
      const available = this.inventory[itemIndex].quantity - this.inventory[itemIndex].reserved
      if (quantity > available) {
        throw new Error('Insufficient available stock')
      }
      this.inventory[itemIndex].quantity -= quantity
    }
  }
  
  await this.save()
}

export default mongoose.models.Warehouse || mongoose.model<IWarehouse>('Warehouse', warehouseSchema)

