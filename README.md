# Gadget Grid Backend

A comprehensive e-commerce backend API for an IT product shop built with Node.js, TypeScript, and MongoDB. This project provides a full-featured backend solution for managing products, orders, users, and various e-commerce functionalities.

## 🚀 Features

### Core E-commerce Features

- **Product Management**: Complete CRUD operations for products with categories, brands, and attributes
- **Order Management**: Full order lifecycle from creation to delivery with status tracking
- **User Management**: Customer and admin user management with role-based access control
- **Authentication & Authorization**: JWT-based authentication with refresh tokens and email verification
- **Payment Integration**: Stripe payment gateway integration with webhook support
- **Shopping Cart**: Session-based cart management
- **Address Management**: Multiple shipping and billing addresses per user

### Advanced Features

- **Real-time Notifications**: Socket.IO powered real-time notifications system
- **Bulk Product Upload**: CSV/Excel bulk upload functionality with field mapping
- **Deal Management**: Time-based deals and flash sales with discount management
- **Product Filtering**: Advanced filtering system with custom attributes
- **Image Management**: Cloudinary integration for image upload and optimization
- **Email System**: Automated email notifications for orders and user actions
- **Search Functionality**: Full-text search across products
- **Product Comparison**: Compare multiple products side by side
- **Gallery Management**: Hierarchical folder structure for media management
- **Chat System**: Basic chat functionality for customer support

### Admin Features

- **Dashboard Analytics**: Order and product analytics
- **User Management**: Admin panel for user management
- **Role Management**: Granular permission system
- **Bulk Operations**: Mass product updates and management
- **Notification Management**: Admin notification system

## 🛠 Technology Stack

### Backend Framework & Language

- **Node.js**: Runtime environment
- **TypeScript**: Primary programming language
- **Express.js**: Web application framework
- **MongoDB**: Primary database
- **Mongoose**: MongoDB object modeling

### Authentication & Security

- **JWT (JSON Web Tokens)**: Authentication tokens
- **bcrypt**: Password hashing
- **CORS**: Cross-origin resource sharing
- **Cookie Parser**: Cookie management

### Real-time Communication

- **Socket.IO**: Real-time bidirectional communication
- **Redis**: Caching and session management

### Payment & External Services

- **Stripe**: Payment processing
- **Cloudinary**: Image and media management
- **Nodemailer**: Email service
- **BullMQ**: Job queue management

### Development Tools

- **ESLint**: Code linting
- **Husky**: Git hooks
- **ts-node-dev**: Development server
- **Sharp**: Image processing

### Deployment

- **Vercel**: Cloud deployment platform
- **Railway**: Redis hosting

## 📁 Project Structure

```
src/
├── app/
│   ├── builder/                 # Query builder utilities
│   │   └── queryBuilder.ts
│   ├── config/                  # Configuration management
│   │   └── index.ts
│   ├── errors/                  # Custom error handlers
│   │   ├── AppError.ts
│   │   ├── handleCastError.ts
│   │   ├── handleDuplicateError.ts
│   │   ├── handleMulterError.ts
│   │   ├── handleValidationError.ts
│   │   └── handleZodError.ts
│   ├── interface/               # TypeScript interfaces
│   │   ├── common.ts
│   │   ├── customRequest.ts
│   │   └── error.interface.ts
│   ├── lib/                     # External library configurations
│   │   └── image/
│   │       ├── image.config.ts
│   │       └── image.multer.ts
│   ├── middleware/              # Express middleware
│   │   ├── auth.ts
│   │   ├── checkPermission.ts
│   │   ├── globalErrorHandler.ts
│   │   ├── notFound.ts
│   │   ├── socketAuth.ts
│   │   └── validateRequest.ts
│   ├── modules/                 # Feature modules
│   │   ├── address/             # Address management
│   │   ├── auth/                # Authentication & authorization
│   │   ├── banner/              # Banner management
│   │   ├── brand/               # Brand management
│   │   ├── bulkUpload/          # Bulk upload functionality
│   │   ├── category/            # Product categories
│   │   ├── chat/                # Chat system
│   │   ├── customer/            # Customer management
│   │   ├── deals/               # Deal management
│   │   ├── flashSales/          # Flash sales
│   │   ├── gallery/             # Media gallery
│   │   ├── Images/              # Image management
│   │   ├── notification/        # Notification system
│   │   ├── order/               # Order management
│   │   ├── product/             # Product management
│   │   ├── productDetailsCategory/ # Product detail categories
│   │   ├── productFilters/      # Product filtering
│   │   ├── roles/               # Role management
│   │   └── user/                # User management
│   ├── routes/                  # API routes
│   │   └── index.ts
│   ├── templates/               # Email templates
│   │   ├── sendOrderConfirmationMail.ts
│   │   └── sendPaymentCofimationMail.ts
│   └── utils/                   # Utility functions
│       ├── catchAsync.ts
│       ├── makeFullName.ts
│       ├── sendEmail.ts
│       ├── sendResponse.ts
│       ├── sendSourceSocket.ts
│       └── verifyToken.ts
├── app.ts                       # Express app configuration
├── redis.ts                     # Redis configuration
├── scripts/                     # Database scripts
│   └── seed.ts
├── server.ts                    # Server entry point
└── socket.ts                    # Socket.IO configuration
```

## 🗄 Database Schema

### Core Models

- **User**: Customer and admin user management
- **Product**: Product catalog with categories, attributes, and pricing
- **Order**: Order management with status tracking
- **Category**: Hierarchical product categories
- **Brand**: Product brand management
- **Address**: User address management
- **Deal**: Time-based deals and promotions
- **Notification**: Real-time notification system
- **Chat**: Customer support chat system

### Key Relationships

- Users can have multiple addresses
- Products belong to categories and brands
- Orders contain multiple order items
- Notifications are linked to users
- Deals can contain multiple products

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis
- Stripe account (for payments)
- Cloudinary account (for image storage)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd gadget-grid-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   PORT=5000
   DATABASE_URL=mongodb://localhost:27017/gadget-grid
   REDIS_URL=redis://localhost:6379
   CLOUD_NAME=your_cloudinary_name
   CLOUD_API_KEY=your_cloudinary_api_key
   CLOUD_API_SECRET=your_cloudinary_api_secret
   BCRYPT_HASH_ROUNDS=12
   ACCESS_SECRET=your_jwt_access_secret
   REFRESH_SECRET=your_jwt_refresh_secret
   VERIFY_SECRET=your_jwt_verify_secret
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   OTP_EXPIRES_IN=10m
   SMTP_APP_PASSWORD=your_gmail_app_password
   SMTP_USER=your_gmail_email
   CLIENT_URL=http://localhost:3000
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISH_KEY=your_stripe_publishable_key
   STRIPE_ENDPOINT_SECRET=your_stripe_webhook_secret
   ```

4. **Run the application**

   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm start
   ```

## 📚 API Endpoints

### Authentication

- `POST /api/v1/auth/admin-login` - Admin login
- `POST /api/v1/auth/user-login` - User login
- `POST /api/v1/auth/register-customer` - Customer registration
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Forgot password
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/send-verification-email` - Send verification email
- `POST /api/v1/auth/verify-email` - Verify email

### Products

- `GET /api/v1/product` - Get all products (with pagination, filtering, search)
- `GET /api/v1/product/:id` - Get single product
- `GET /api/v1/product/slug/:slug` - Get product by slug
- `GET /api/v1/product/featured` - Get featured products
- `GET /api/v1/product/category/:slug` - Get products by category
- `GET /api/v1/product/search` - Search products
- `GET /api/v1/product/compare` - Compare products
- `POST /api/v1/product` - Create product (Admin)
- `PUT /api/v1/product/:id` - Update product (Admin)
- `POST /api/v1/product/bulk-upload` - Bulk upload products (Admin)

### Orders

- `POST /api/v1/order` - Create order
- `GET /api/v1/order/my-orders` - Get user orders
- `GET /api/v1/order/:orderNumber` - Get order by order number

### Categories

- `GET /api/v1/category` - Get all categories
- `POST /api/v1/category` - Create category (Admin)
- `PUT /api/v1/category/:id` - Update category (Admin)

### Brands

- `GET /api/v1/brand` - Get all brands
- `POST /api/v1/brand` - Create brand (Admin)
- `PUT /api/v1/brand/:id` - Update brand (Admin)

### Deals

- `GET /api/v1/deal` - Get all deals
- `GET /api/v1/deal/:id` - Get deal by ID
- `POST /api/v1/deal` - Create deal (Admin)
- `PUT /api/v1/deal/:id` - Update deal (Admin)

### Notifications

- `GET /api/v1/notification` - Get user notifications

### Chat

- `POST /api/v1/chat` - Create chat

### Address

- `GET /api/v1/address` - Get user addresses
- `POST /api/v1/address` - Create address
- `PUT /api/v1/address/:id` - Update address
- `DELETE /api/v1/address/:id` - Delete address

## 🔧 Configuration

### Environment Variables

The application uses environment variables for configuration. Key variables include:

- Database connection strings
- JWT secrets and expiration times
- External service API keys (Stripe, Cloudinary, SMTP)
- Redis connection URL
- CORS origins

## 🚀 Deployment

The application is configured for deployment on Vercel with the following setup:

- Build command: `npm run build`
- Output directory: `dist`
- Entry point: `dist/server.js`

### Vercel Configuration

The `vercel.json` file contains deployment configuration for Vercel platform.

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- CORS protection
- Input validation with Zod
- Error handling middleware
- Rate limiting (can be added)
- SQL injection protection through Mongoose

## 📊 Performance Features

- Redis caching for frequently accessed data
- Database indexing for optimized queries
- Pagination for large datasets
- Image optimization with Sharp
- Query builder for efficient database queries
- Background job processing with BullMQ

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions, please contact:

- Email: gadgetGrid@gmail.com
- Phone: +088334-343-343

---

**Gadget Grid Backend** - A comprehensive e-commerce solution built with modern technologies and best practices.
