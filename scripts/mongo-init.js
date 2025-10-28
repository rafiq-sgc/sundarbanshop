// MongoDB initialization script
db = db.getSiblingDB('ekomart');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('orders');
db.createCollection('carts');
db.createCollection('reviews');
db.createCollection('coupons');
db.createCollection('notifications');
db.createCollection('activitylogs');
db.createCollection('chatconversations');
db.createCollection('loyaltyprograms');
db.createCollection('warehouses');
db.createCollection('inventoryadjustments');
db.createCollection('warehousetransfers');
db.createCollection('giftcards');
db.createCollection('emailcampaigns');
db.createCollection('supporttemplates');
db.createCollection('banners');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "phone": 1 });
db.users.createIndex({ "createdAt": -1 });

db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "price": 1 });
db.products.createIndex({ "isActive": 1 });
db.products.createIndex({ "createdAt": -1 });

db.categories.createIndex({ "slug": 1 }, { unique: true });
db.categories.createIndex({ "name": 1 });
db.categories.createIndex({ "isActive": 1 });

db.orders.createIndex({ "orderNumber": 1 }, { unique: true });
db.orders.createIndex({ "user": 1 });
db.orders.createIndex({ "orderStatus": 1 });
db.orders.createIndex({ "createdAt": -1 });

db.carts.createIndex({ "user": 1 });
db.carts.createIndex({ "updatedAt": -1 });

db.reviews.createIndex({ "product": 1 });
db.reviews.createIndex({ "user": 1 });
db.reviews.createIndex({ "rating": 1 });

db.coupons.createIndex({ "code": 1 }, { unique: true });
db.coupons.createIndex({ "isActive": 1 });
db.coupons.createIndex({ "expiresAt": 1 });

db.notifications.createIndex({ "user": 1 });
db.notifications.createIndex({ "isRead": 1 });
db.notifications.createIndex({ "createdAt": -1 });

db.activitylogs.createIndex({ "user": 1 });
db.activitylogs.createIndex({ "entity": 1 });
db.activitylogs.createIndex({ "createdAt": -1 });

db.chatconversations.createIndex({ "customerId": 1 });
db.chatconversations.createIndex({ "status": 1 });
db.chatconversations.createIndex({ "lastMessageTime": -1 });

db.loyaltyprograms.createIndex({ "user": 1 });
db.loyaltyprograms.createIndex({ "tier": 1 });

db.warehouses.createIndex({ "name": 1 });
db.warehouses.createIndex({ "isActive": 1 });

db.inventoryadjustments.createIndex({ "product": 1 });
db.inventoryadjustments.createIndex({ "warehouse": 1 });
db.inventoryadjustments.createIndex({ "createdAt": -1 });

db.warehousetransfers.createIndex({ "fromWarehouse": 1 });
db.warehousetransfers.createIndex({ "toWarehouse": 1 });
db.warehousetransfers.createIndex({ "status": 1 });

db.giftcards.createIndex({ "code": 1 }, { unique: true });
db.giftcards.createIndex({ "status": 1 });

db.emailcampaigns.createIndex({ "status": 1 });
db.emailcampaigns.createIndex({ "createdAt": -1 });

db.supporttemplates.createIndex({ "category": 1 });
db.supporttemplates.createIndex({ "isActive": 1 });

db.banners.createIndex({ "isActive": 1 });
db.banners.createIndex({ "position": 1 });

print('Database initialization completed successfully!');
