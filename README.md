# Fold Fox Laundry POS System

A comprehensive Point of Sale (POS) system designed for laundry businesses with features for customer management, order processing, service tracking, staff management, and business analytics.

## 🌟 Features

### Core Functionality
- **Customer Management**: Complete customer lifecycle with loyalty points and student discounts
- **Order Processing**: Full order management with status tracking and payment processing
- **Service Catalog**: Flexible pricing models (per kg, per piece, fixed) with clothing categories
- **Staff Management**: Employee tracking with performance analytics
- **Business Analytics**: Comprehensive reporting and dashboard insights
- **Landing Page**: Customer registration with campaign discount support

### Role-Based Access Control
- **Admin**: Full system access including user, staff, and service management
- **Cashier**: Customer and order management with read-only service access

### Payment Processing
- Cash, Card, Bank Transfer, and Mobile Payment support
- Automatic discount calculation (student discounts, campaign discounts)
- Email notifications for bank transfer details
- Receipt generation

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd Laundary-POS-System-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables in `.env` file**
   - Set `MONGO_URI` to your MongoDB connection string
   - Set `JWT_SECRET` to a strong secret key
   - Configure email service for notifications (optional)
   - Update business and bank account details

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

   Server will run on http://localhost:5000

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd Laundary-POS-System-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables in `.env` file**
   - Set `VITE_API_URL` to your backend API URL (default: http://localhost:5000/api)

4. **Start the development server**
   ```bash
   npm run dev
   ```

   Frontend will run on http://localhost:5173

5. **Build for production**
   ```bash
   npm run build
   ```

   Production files will be in the `dist` folder

## 🔐 Initial Setup

On first deployment, you'll need to create an admin user through your database or use the registration endpoint with appropriate role configuration.

⚠️ **Important**: Ensure strong passwords are used for all accounts in production!

## 📁 Project Structure

```
Laundary-POS-System/
├── Laundary-POS-System-Backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Authentication & validation
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic & notifications
│   │   └── utils/          # Helpers & utilities
│   ├── server.js           # Server entry point
│   └── package.json
│
└── Laundary-POS-System-Frontend/
    ├── src/
    │   ├── components/     # React components
    │   ├── pages/          # Page components
    │   ├── services/       # API services
    │   ├── context/        # React context
    │   ├── hooks/          # Custom hooks
    │   └── utils/          # Helper functions
    ├── public/             # Static assets
    └── package.json
```

## 🛠️ Technology Stack

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JWT Authentication
- Nodemailer (Email notifications)
- Twilio (SMS notifications - optional)
- PDFKit (Receipt generation)

### Frontend
- React 18
- React Router DOM
- Axios
- TanStack Query (React Query)
- Tailwind CSS
- React Hot Toast
- Recharts (Analytics)
- Vite (Build tool)

## 📊 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - Register new cashier
- `GET /auth/profile` - Get current user profile
- `PUT /auth/profile` - Update profile
- `PUT /auth/change-password` - Change password

### Main Endpoints
- `/customers` - Customer management
- `/orders` - Order processing
- `/services` - Service catalog
- `/staff` - Staff management (Admin only)
- `/users` - User management (Admin only)
- `/reports` - Business analytics

For detailed API documentation, see the [Backend README](./Laundary-POS-System-Backend/README.md)

## 🎨 Features in Detail

### Discount System
- **Student Discount**: Automatic 10% discount for verified students
- **Campaign Discount**: 20% first-order discount for registered customers
- **Automatic Application**: System automatically applies the best available discount

### Order Workflow
1. **Walk-in Orders**: Items received immediately, order confirmed
2. **Pickup Orders**: Items to be picked up, confirmation after pickup
3. **Status Tracking**: Draft → Confirmed → Processing → Ready → Completed
4. **Payment Processing**: Multiple payment methods with partial payment support

### Notifications
- Email notifications for order confirmations
- Bank transfer details sent via email/SMS
- Pickup scheduling notifications

## 🔧 Configuration

### Campaign Settings
Edit `Laundary-POS-System-Frontend/src/config/campaign.js` to configure:
- Campaign activation status
- Discount percentage
- Valid campaign codes
- Campaign duration

### Business Settings
Update `.env` files with:
- Business name and contact information
- Bank account details
- Email/SMS service credentials
- Tax rates and currency

## 📈 Production Deployment

### Backend Deployment (Vercel/Railway/Heroku)
1. Set environment variables in your hosting platform
2. Ensure MongoDB connection string is set
3. Update `FRONTEND_URL` for CORS
4. Deploy using provided `vercel.json` or platform-specific config

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Set `VITE_API_URL` environment variable
4. Configure redirects for React Router

### Environment Variables Checklist
- [ ] `MONGO_URI` - Production MongoDB connection
- [ ] `JWT_SECRET` - Strong secret key
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` - Production frontend URL
- [ ] `VITE_API_URL` - Production API URL
- [ ] Email service credentials (if using notifications)
- [ ] Business and bank account details

## 🐛 Troubleshooting

### Backend Issues
- **MongoDB Connection**: Ensure MongoDB is running and connection string is correct
- **Port Already in Use**: Change `PORT` in `.env` file
- **Authentication Errors**: Verify `JWT_SECRET` is set

### Frontend Issues
- **API Connection**: Check `VITE_API_URL` in `.env`
- **Build Errors**: Clear `node_modules` and reinstall dependencies
- **CORS Errors**: Ensure `FRONTEND_URL` in backend `.env` matches frontend URL

## 📄 License

This project is proprietary software developed for Fold Fox Laundry.

## 🤝 Support

For support and questions:
- Email: info@foldfoxlaundry.com
- Phone: +94-XX-XXXXXXX

## 📝 Version

**Version**: 1.0.0  
**Last Updated**: October 15, 2025

---

**Built with ❤️ for Fold Fox Laundry**

