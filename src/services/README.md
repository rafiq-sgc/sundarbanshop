# Service Layer Architecture

## Overview

This project uses a **grouped service architecture** where related services are organized into feature-based directories. This provides better code organization, maintainability, and scalability.

## Directory Structure

```
src/services/
├── index.ts                    # Central exports
├── warehouse/                  # Warehouse feature group
│   ├── index.ts               # Warehouse exports
│   ├── warehouse.service.ts   # Warehouse CRUD
│   ├── inventory.service.ts   # Warehouse inventory
│   ├── transfer.service.ts    # Stock transfers
│   ├── adjustment.service.ts  # Inventory adjustments
│   └── analytics.service.ts   # Warehouse analytics
├── order/                      # Order feature group (future)
├── customer/                   # Customer feature group (future)
├── product/                    # Product feature group (future)
├── marketing/                  # Marketing feature group (future)
└── finance/                    # Finance feature group (future)
```

## Benefits of Grouped Services

### 1. **Feature Cohesion**
- Related services grouped together
- Easy to find and maintain
- Clear feature boundaries

### 2. **Scalability**
- Add new features without clutter
- Each group can grow independently
- Easy to split into microservices later

### 3. **Import Clarity**
```typescript
// ✅ Clear what feature you're using
import { warehouseService, stockTransferService } from '@/services/warehouse'

// ❌ Less clear with flat structure
import { warehouseService, stockTransferService } from '@/services'
```

### 4. **Team Collaboration**
- Different teams work on different feature groups
- Less merge conflicts
- Clear ownership

## Warehouse Services

### Architecture Pattern

```
Component (UI)
    ↓
warehouseService.getAll()
    ↓
/api/admin/warehouses (API Route)
    ↓
Warehouse Model (MongoDB)
    ↓
Database
```

### Available Services

#### 1. **Warehouse Service** (`warehouse/warehouse.service.ts`)

Basic warehouse CRUD operations.

```typescript
import { warehouseService } from '@/services/warehouse'

// List warehouses
const data = await warehouseService.getAll({ 
  search: 'Main',
  isActive: true,
  limit: 20 
})

// Get by ID
const warehouse = await warehouseService.getById('123')

// Create
await warehouseService.create(formData)

// Update
await warehouseService.update('123', { name: 'New Name' })

// Delete
await warehouseService.delete('123')
```

**Methods:**
- `getAll(params?)` - List with filtering, pagination, search
- `getById(id)` - Get single warehouse with stats
- `create(data)` - Create new warehouse
- `update(id, data)` - Update warehouse
- `delete(id)` - Delete warehouse

#### 2. **Inventory Service** (`warehouse/inventory.service.ts`)

Manage warehouse inventory.

```typescript
import { warehouseInventoryService } from '@/services/warehouse'

// Get inventory for a warehouse
const inventory = await warehouseInventoryService.getInventory('warehouseId', {
  search: 'laptop',
  lowStock: true
})

// Update inventory
await warehouseInventoryService.updateInventory('warehouseId', {
  productId: '123',
  quantity: 50,
  operation: 'add' // or 'set'
})
```

**Methods:**
- `getInventory(warehouseId, params?)` - Get warehouse stock
- `updateInventory(warehouseId, data)` - Add/set stock

#### 3. **Stock Transfer Service** (`warehouse/transfer.service.ts`)

Handle stock movements between warehouses.

```typescript
import { stockTransferService } from '@/services/warehouse'

// List transfers
const data = await stockTransferService.getAll({ 
  status: 'pending',
  warehouseId: '123' 
})

// Create transfer
await stockTransferService.create({
  fromWarehouse: '123',
  toWarehouse: '456',
  items: [{ product: 'prod1', quantity: 10 }]
})

// Workflow actions
await stockTransferService.approve('transferId')  // pending → in_transit
await stockTransferService.complete('transferId') // in_transit → completed
await stockTransferService.cancel('transferId')   // any → cancelled

// Get by ID
const transfer = await stockTransferService.getById('123')

// Delete
await stockTransferService.delete('123')
```

**Methods:**
- `getAll(params?)` - List transfers with filters
- `getById(id)` - Get transfer details
- `create(data)` - Create new transfer
- `approve(id)` - Approve pending transfer
- `complete(id)` - Complete in-transit transfer
- `cancel(id)` - Cancel transfer
- `delete(id)` - Delete transfer

#### 4. **Adjustment Service** (`warehouse/adjustment.service.ts`)

Manage inventory adjustments.

```typescript
import { inventoryAdjustmentService } from '@/services/warehouse'

// List adjustments
const data = await inventoryAdjustmentService.getAll({ 
  status: 'pending',
  type: 'damaged' 
})

// Create adjustment
await inventoryAdjustmentService.create({
  warehouse: '123',
  items: [{
    product: 'prod1',
    previousQuantity: 100,
    newQuantity: 95,
    difference: -5
  }],
  type: 'damaged',
  reason: 'Found damaged items during inspection'
})

// Approve/Reject
await inventoryAdjustmentService.approve('adjustmentId')
await inventoryAdjustmentService.reject('adjustmentId')

// Get by ID
const adjustment = await inventoryAdjustmentService.getById('123')

// Delete
await inventoryAdjustmentService.delete('123')
```

**Methods:**
- `getAll(params?)` - List adjustments
- `getById(id)` - Get adjustment details
- `create(data)` - Create new adjustment
- `approve(id)` - Approve and apply changes
- `reject(id)` - Reject adjustment
- `delete(id)` - Delete adjustment

#### 5. **Analytics Service** (`warehouse/analytics.service.ts`)

Inventory analytics and alerts.

```typescript
import { warehouseAnalyticsService } from '@/services/warehouse'

// Get low stock alerts
const alerts = await warehouseAnalyticsService.getLowStockAlerts({
  warehouseId: '123',
  critical: true
})

// Get comprehensive stats
const stats = await warehouseAnalyticsService.getStats()
```

**Methods:**
- `getLowStockAlerts(params?)` - Get low/out of stock items
- `getStats()` - Comprehensive inventory statistics

## Usage Examples

### Example 1: Warehouse List Component

```typescript
'use client'

import { useEffect, useState } from 'react'
import { warehouseService, type Warehouse } from '@/services/warehouse'
import { toast } from 'react-hot-toast'

export default function WarehouseList() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      setLoading(true)
      try {
        const data = await warehouseService.getAll({ search })
        setWarehouses(data.warehouses)
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchWarehouses, 300)
    return () => clearTimeout(debounce)
  }, [search])

  // Delete warehouse
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    
    try {
      await warehouseService.delete(id)
      toast.success('Deleted!')
      // Refresh list
      const data = await warehouseService.getAll({ search })
      setWarehouses(data.warehouses)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div>
      <input 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
        placeholder="Search..."
      />
      {loading ? (
        <div>Loading...</div>
      ) : (
        warehouses.map(w => (
          <div key={w._id}>
            {w.name}
            <button onClick={() => handleDelete(w._id)}>Delete</button>
          </div>
        ))
      )}
    </div>
  )
}
```

### Example 2: Create Warehouse Form

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { warehouseSchema, type WarehouseFormData } from '@/lib/validations/warehouse'
import { warehouseService } from '@/services/warehouse'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function CreateWarehouse() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: '',
      code: '',
      // ... other fields
    }
  })

  const onSubmit = async (data: WarehouseFormData) => {
    setSaving(true)
    try {
      await warehouseService.create(data)
      toast.success('Warehouse created!')
      router.push('/admin/warehouses')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
      <button type="submit" disabled={saving}>
        {saving ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
```

### Example 3: Transfer Workflow

```typescript
import { stockTransferService } from '@/services/warehouse'

// Create transfer
const handleCreateTransfer = async () => {
  try {
    await stockTransferService.create({
      fromWarehouse: 'wh1',
      toWarehouse: 'wh2',
      items: [{ product: 'prod1', quantity: 10 }]
    })
    toast.success('Transfer created and stock reserved!')
  } catch (error: any) {
    toast.error(error.message)
  }
}

// Approve transfer (reserves stock)
const handleApprove = async (id: string) => {
  try {
    await stockTransferService.approve(id)
    toast.success('Transfer approved and in transit!')
  } catch (error: any) {
    toast.error(error.message)
  }
}

// Complete transfer (moves stock)
const handleComplete = async (id: string) => {
  try {
    await stockTransferService.complete(id)
    toast.success('Transfer completed! Stock moved.')
  } catch (error: any) {
    toast.error(error.message)
  }
}
```

### Example 4: Inventory Adjustments

```typescript
import { inventoryAdjustmentService } from '@/services/warehouse'

// Create adjustment
const handleAdjustment = async () => {
  try {
    await inventoryAdjustmentService.create({
      warehouse: 'wh1',
      items: [{
        product: 'prod1',
        previousQuantity: 100,
        newQuantity: 95,
        difference: -5
      }],
      type: 'damaged',
      reason: 'Found damaged during inspection'
    })
    toast.success('Adjustment created!')
  } catch (error: any) {
    toast.error(error.message)
  }
}

// Approve adjustment (applies changes)
const handleApprove = async (id: string) => {
  try {
    await inventoryAdjustmentService.approve(id)
    toast.success('Adjustment approved and applied!')
  } catch (error: any) {
    toast.error(error.message)
  }
}
```

## Service Method Naming Convention

All services follow consistent naming:
- `getAll(params?)` - List with filters
- `getById(id)` - Get single item
- `create(data)` - Create new
- `update(id, data)` - Update existing
- `delete(id)` - Delete item
- Workflow methods: `approve()`, `complete()`, `cancel()`, `reject()`

## Error Handling Pattern

All services throw errors that should be caught:

```typescript
try {
  await warehouseService.create(data)
  // Success - show feedback, redirect, etc.
  toast.success('Created!')
  router.push('/list')
} catch (error: any) {
  // Error - show user-friendly message
  toast.error(error.message || 'Something went wrong')
}
```

## Type Safety

All services export TypeScript types:

```typescript
import type { 
  Warehouse, 
  WarehouseStats, 
  WarehouseQueryParams,
  StockTransfer,
  InventoryAdjustment
} from '@/services/warehouse'

// Use in components
const [warehouses, setWarehouses] = useState<Warehouse[]>([])
const [stats, setStats] = useState<WarehouseStats>({ total: 0, active: 0, inactive: 0 })
```

## Import Patterns

### Grouped Imports (Recommended)
```typescript
// Import from feature group
import { 
  warehouseService, 
  stockTransferService,
  type Warehouse,
  type StockTransfer 
} from '@/services/warehouse'
```

### Individual Imports
```typescript
// Import specific service
import { warehouseService } from '@/services/warehouse/warehouse.service'
```

### Root Imports
```typescript
// Import from root (re-exports all)
import { warehouseService } from '@/services'
```

## Adding New Service Groups

To add a new feature group (e.g., orders):

### 1. Create directory
```bash
mkdir src/services/order
```

### 2. Create service file
```typescript
// src/services/order/order.service.ts
class OrderService {
  private baseUrl = '/api/admin/orders'
  
  async getAll(params?: OrderQueryParams) {
    const response = await fetch(this.baseUrl)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch')
    }
    return response.json()
  }
  
  async create(data: OrderFormData) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create')
    }
    return response.json()
  }
  
  // ... other methods
}

export const orderService = new OrderService()
```

### 3. Create group index
```typescript
// src/services/order/index.ts
export * from './order.service'
export * from './invoice.service'
export { orderService } from './order.service'
export { invoiceService } from './invoice.service'
```

### 4. Update root index
```typescript
// src/services/index.ts
export * from './warehouse'
export * from './order'  // Add new group
```

## Best Practices

### 1. **Always Use Try-Catch**
```typescript
// ✅ Good
try {
  await warehouseService.create(data)
  toast.success('Success!')
} catch (error: any) {
  toast.error(error.message)
}

// ❌ Bad - unhandled errors
await warehouseService.create(data)
```

### 2. **Use Loading States**
```typescript
const [loading, setLoading] = useState(false)

const fetchData = async () => {
  setLoading(true)
  try {
    const data = await warehouseService.getAll()
    setWarehouses(data.warehouses)
  } catch (error: any) {
    toast.error(error.message)
  } finally {
    setLoading(false) // Always reset
  }
}
```

### 3. **Provide User Feedback**
```typescript
// Always show feedback
try {
  await warehouseService.delete(id)
  toast.success('Deleted!')  // Success message
} catch (error: any) {
  toast.error(error.message) // Error message
}
```

### 4. **Use TypeScript Types**
```typescript
// Import types from services
import type { Warehouse, WarehouseStats } from '@/services/warehouse'

// Type your state
const [warehouses, setWarehouses] = useState<Warehouse[]>([])
const [stats, setStats] = useState<WarehouseStats>({ total: 0, active: 0, inactive: 0 })
```

### 5. **Debounce Search**
```typescript
const [search, setSearch] = useState('')

useEffect(() => {
  const debounce = setTimeout(async () => {
    try {
      const data = await warehouseService.getAll({ search })
      setWarehouses(data.warehouses)
    } catch (error: any) {
      toast.error(error.message)
    }
  }, 300) // Wait 300ms after user stops typing

  return () => clearTimeout(debounce)
}, [search])
```

## Service Class Pattern

All services follow this pattern:

```typescript
class FeatureService {
  private baseUrl = '/api/admin/feature'

  async getAll(params?) {
    // Build query string
    // Fetch data
    // Handle errors
    // Return typed response
  }

  async getById(id: string) {
    // Similar pattern
  }

  async create(data) {
    // POST request
    // Error handling
    // Return response
  }

  async update(id, data) {
    // PUT/PATCH request
  }

  async delete(id) {
    // DELETE request
  }
}

export const featureService = new FeatureService()
```

## Comparison: Before vs After

### Before (Direct API Calls)
```typescript
// In every component - repetitive!
const response = await fetch('/api/admin/warehouses')
const data = await response.json()
if (!response.ok) throw new Error(data.error)
setWarehouses(data.warehouses)

// 10+ lines per API call
// Repeated in multiple files
// Hard to maintain
```

### After (Service Layer)
```typescript
// Clean and reusable
const data = await warehouseService.getAll()
setWarehouses(data.warehouses)

// 2 lines per API call
// Used everywhere
// Easy to maintain
```

**Benefits:**
- 80% less code in components
- Type-safe
- Reusable
- Maintainable
- Testable

## Testing Services

Services are easy to mock:

```typescript
// __mocks__/services/warehouse/warehouse.service.ts
export const warehouseService = {
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

// In tests
import { warehouseService } from '@/services/warehouse'

beforeEach(() => {
  jest.clearAllMocks()
})

test('fetches warehouses', async () => {
  warehouseService.getAll.mockResolvedValue({
    warehouses: [{ _id: '1', name: 'Test' }],
    stats: { total: 1, active: 1, inactive: 0 }
  })
  
  // Test your component
})
```

## Migration Checklist

When adding services to existing code:

- [ ] Create service class with methods
- [ ] Define TypeScript interfaces
- [ ] Export singleton instance
- [ ] Add to group index.ts
- [ ] Update components to use service
- [ ] Remove direct fetch calls
- [ ] Add proper error handling
- [ ] Test all CRUD operations
- [ ] Update documentation

## Summary

### Service Architecture:
✅ **Grouped by Feature** - Related services together
✅ **Type-Safe** - TypeScript throughout
✅ **Reusable** - DRY principle
✅ **Maintainable** - Update once, use everywhere
✅ **Testable** - Easy to mock
✅ **Scalable** - Add features easily
✅ **Clean Code** - Separation of concerns

### Current Implementation:
- ✅ **5 Warehouse Services** (Warehouse, Inventory, Transfer, Adjustment, Analytics)
- ✅ **25+ Service Methods** (Complete CRUD operations)
- ✅ **Type-Safe** (All interfaces exported)
- ✅ **Consistent API** (Same patterns across services)
- ✅ **Error Handling** (Centralized)
- ✅ **Documentation** (This README)

Use this pattern for all future feature development! 🚀
