# Sundarban Shop - Complete Ecommerce Application

A comprehensive, production-ready ecommerce application built with Next.js 14+, MongoDB, and Tailwind CSS. This application provides a complete online grocery store experience with modern features and responsive design.

## 🚀 Features

### Frontend Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Product Catalog**: Advanced filtering, sorting, and search functionality
- **Shopping Cart**: Persistent cart with real-time updates
- **User Authentication**: Secure login/signup with NextAuth.js
- **Product Reviews**: Rating and review system
- **Wishlist**: Save favorite products
- **Multi-language Support**: Ready for internationalization
- **Multi-currency Support**: Flexible pricing system

### Backend Features
- **RESTful API**: Complete CRUD operations
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with NextAuth.js
- **File Upload**: Image handling for products
- **Search**: Full-text search capabilities
- **Pagination**: Efficient data loading
- **Validation**: Input validation and sanitization

### Admin Features
- **Dashboard**: Comprehensive admin panel
- **Product Management**: Add, edit, delete products
- **Order Management**: Track and manage orders
- **User Management**: Manage customer accounts
- **Analytics**: Sales and performance metrics
- **Inventory**: Stock management

### User Dashboard
- **Order History**: Track past and current orders
- **Profile Management**: Update personal information
- **Address Book**: Manage shipping addresses
- **Wishlist**: Saved favorite products
- **Order Tracking**: Real-time order status

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+, React 18, TypeScript
- **Styling**: Tailwind CSS v3
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **UI Components**: Radix UI, Lucide React
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Sundarban Shop
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/Sundarban Shop
   
   # NextAuth
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   
   # JWT
   JWT_SECRET=your-jwt-secret-here
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME=Sundarban Shop
   
   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Seed the database**
   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

### Core Models
- **User**: Customer and admin accounts
- **Product**: Product catalog with variants
- **Category**: Product categorization
- **Order**: Order management
- **Cart**: Shopping cart functionality
- **Review**: Product reviews and ratings

### Key Features
- **Flexible Product System**: Support for variants, attributes, and inventory tracking
- **Hierarchical Categories**: Parent-child category relationships
- **Order Management**: Complete order lifecycle tracking
- **User Roles**: Admin and customer role separation
- **Audit Trail**: Timestamps and change tracking

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#0ea5e9)
- **Secondary**: Gray (#64748b)
- **Accent**: Orange (#f2760a)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold weights (600-800)
- **Body**: Regular weight (400)
- **Captions**: Medium weight (500)

### Components
- **Buttons**: Primary, secondary, outline variants
- **Cards**: Product cards, feature cards
- **Forms**: Input fields, selectors, checkboxes
- **Navigation**: Header, footer, breadcrumbs
- **Layout**: Grid system, containers, spacing

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- Touch-friendly interface
- Swipe gestures for carousels
- Optimized images and loading
- Mobile-first navigation

## 🔐 Authentication

### Supported Methods
- **Email/Password**: Traditional authentication
- **Google OAuth**: Social login
- **JWT Tokens**: Secure session management

### Security Features
- Password hashing with bcrypt
- JWT token expiration
- CSRF protection
- Input validation and sanitization

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
- **Netlify**: Static site deployment
- **AWS**: EC2 or Lambda deployment
- **DigitalOcean**: Droplet deployment
- **Heroku**: Container deployment

## 📊 Performance

### Optimization Features
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Component and image lazy loading
- **Caching**: API response caching
- **Bundle Analysis**: Webpack bundle analyzer

### Performance Metrics
- **Lighthouse Score**: 90+ across all categories
- **Core Web Vitals**: Optimized for Google ranking
- **Mobile Performance**: Fast loading on mobile devices

## 🧪 Testing

### Test Setup
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Test Coverage
- Unit tests for components
- Integration tests for API routes
- E2E tests for critical user flows

## 📈 Analytics

### Built-in Analytics
- **User Behavior**: Page views, session duration
- **E-commerce**: Conversion tracking, revenue metrics
- **Performance**: Core Web Vitals monitoring

### Third-party Integration
- **Google Analytics**: Web analytics
- **Hotjar**: User behavior analysis
- **Mixpanel**: Event tracking

## 🔧 Configuration

### Environment Variables
All configuration is handled through environment variables for security and flexibility.

### Feature Flags
Toggle features on/off without code changes:
- `NEXT_PUBLIC_ENABLE_REVIEWS=true`
- `NEXT_PUBLIC_ENABLE_WISHLIST=true`
- `NEXT_PUBLIC_ENABLE_MULTI_CURRENCY=true`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Product Endpoints
- `GET /api/products` - List products with filtering
- `GET /api/products/[id]` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/[id]` - Update product (admin)
- `DELETE /api/products/[id]` - Delete product (admin)

### Order Endpoints
- `GET /api/orders` - List user orders
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get order details
- `PUT /api/orders/[id]` - Update order status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact: support@Sundarban Shop.com
- Documentation: [docs.Sundarban Shop.com](https://docs.Sundarban Shop.com)

## 🎯 Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-vendor marketplace
- [ ] AI-powered recommendations
- [ ] Voice search integration
- [ ] AR product visualization

### Version History
- **v1.0.0**: Initial release with core features
- **v1.1.0**: Added admin dashboard
- **v1.2.0**: Enhanced mobile experience
- **v1.3.0**: Performance optimizations

---

Built with ❤️ by the Sundarban Shop Team
