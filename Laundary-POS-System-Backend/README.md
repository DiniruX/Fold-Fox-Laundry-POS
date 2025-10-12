# Laundry POS System - Backend

A comprehensive backend API for a laundry management system with role-based access control.

## Features

### Core Functionality
- **Authentication & Authorization**: JWT-based authentication with role-based permissions
- **User Management**: Admin and Cashier roles with appropriate permissions
- **Customer Management**: Complete customer lifecycle management
- **Order Management**: Full order processing with status tracking
- **Service Management**: Laundry service catalog management
- **Staff Management**: Employee information and performance tracking
- **Reporting**: Business analytics and reporting

### Role-Based Access Control

#### Admin Role
- Full access to all system features
- User management (create, read, update, delete users)
- Staff management (create, read, update, delete staff)
- Service management (create, read, update, delete services)
- Customer management (create, read, update, delete customers)
- Order management (create, read, update, delete orders)
- Reports access

#### Cashier Role
- Customer management (create, read, update, delete customers)
- Order management (create, read, update, delete orders)
- Service viewing (read-only access to services)
- Reports access

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (cashier only)
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update current user profile
- `PUT /api/auth/change-password` - Change password

### Users (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/toggle-status` - Toggle user active status
- `DELETE /api/users/:id` - Delete user

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `POST /api/services` - Create new service (Admin only)
- `PUT /api/services/:id` - Update service (Admin only)
- `DELETE /api/services/:id` - Delete service (Admin only)

### Staff (Admin Only)
- `GET /api/staff` - Get all staff
- `GET /api/staff/:id` - Get staff by ID
- `POST /api/staff` - Create new staff
- `PUT /api/staff/:id` - Update staff
- `DELETE /api/staff/:id` - Delete staff

### Reports
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/customers` - Customer analytics
- `GET /api/reports/orders` - Order analytics

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `env.example`:
   ```bash
   cp env.example .env
   ```

4. Configure environment variables in `.env`:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/laundry-pos
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   ```

5. Start the server:
   ```bash
   npm start
   ```

## Database Models

### User
- Basic user information with role-based access
- Roles: admin, cashier
- Authentication and profile management

### Customer
- Customer information and contact details
- Order history and loyalty tracking
- Campus ID for student identification

### Order
- Order details with items and services
- Payment and status tracking
- Delivery and pickup information

### Service
- Service catalog with pricing
- Category and time estimation
- Active/inactive status management

### Staff
- Comprehensive employee information
- Performance and attendance tracking
- Document management and access control

## Security Features

- JWT-based authentication
- Role-based authorization
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation and sanitization
- Helmet security headers

## Development

### Running in Development
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Code Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utility functions
└── app.js           # Express app configuration
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment | development |
| PORT | Server port | 5000 |
| MONGO_URI | MongoDB connection string | - |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRE | JWT expiration time | 7d |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |

## License

This project is proprietary software developed for internal use.