/**
 * Dashboard Services
 * Centralized export for all user dashboard services
 */

export { dashboardOrderService } from './order.service'
export type { DashboardOrderFilters, DashboardOrderStats } from './order.service'

export { addressService } from './address.service'
export type { Address, AddressResponse } from './address.service'

export { profileService } from './profile.service'
export type { UserProfile, UpdateProfileData, ProfileResponse } from './profile.service'

export { paymentService } from './payment.service'
export type { PaymentMethod, PaymentMethodResponse } from './payment.service'

export { notificationService } from './notification.service'
export type { Notification, NotificationResponse } from './notification.service'

export { cartService } from './cart.service'
export type { Cart, CartItem, CartResponse, CartItemVariant } from './cart.service'

export { checkoutService } from './checkout.service'
export type { CheckoutData, CheckoutResponse } from './checkout.service'

