// Warehouse module - centralized exports

// Services
export * from './warehouse.service'
export * from './inventory.service'
export * from './transfer.service'
export * from './adjustment.service'
export * from './analytics.service'

// Re-export service instances
export { warehouseService } from './warehouse.service'
export { warehouseInventoryService } from './inventory.service'
export { stockTransferService } from './transfer.service'
export { inventoryAdjustmentService } from './adjustment.service'
export { warehouseAnalyticsService } from './analytics.service'

