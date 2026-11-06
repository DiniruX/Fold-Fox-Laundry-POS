# Fold Fox Laundry POS — Project Documentation

A complete reference for the Fold Fox Laundry point-of-sale system. It was written from a file-by-file read of all 156 tracked files (about 39,000 lines): the backend, the frontend, configuration and the existing docs.

> **Snapshot:** branch `main` at commit `cbceb6a`, 2026-09-23. File and line references (`file:line`) point to that commit.

---

## Table of Contents

1. [Critical: Read First](#1-critical-read-first)
2. [System Overview](#2-system-overview)
3. [Tech Stack](#3-tech-stack)
4. [Repository Layout](#4-repository-layout)
5. [Local Setup & Environment Variables](#5-local-setup--environment-variables)
6. [Backend Architecture](#6-backend-architecture)
7. [Data Models](#7-data-models)
8. [API Reference](#8-api-reference)
9. [Roles & Permissions](#9-roles--permissions)
10. [Business Logic & Workflows](#10-business-logic--workflows)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Frontend Pages](#12-frontend-pages)
13. [Frontend Components](#13-frontend-components)
14. [Deployment (Vercel)](#14-deployment-vercel)
15. [Existing Docs: Inventory & Contradictions](#15-existing-docs-inventory--contradictions)
16. [Known Issues](#16-known-issues)
17. [Dead Code & Duplication](#17-dead-code--duplication)

---

## 1. Critical: Read First

| # | Issue | Location | Action |
|---|---|---|---|
| 1 | **Live secrets committed to git.** A MongoDB Atlas connection string (with username and password) and both JWT secrets are in plain text. The file has been tracked since commit `dc5ba0d`. | `ENV_FIX_SUMMARY.md:37,40,41,60,62,64` | Rotate the DB password and both JWT secrets **now**. Then remove the values from the file and purge them from git history (e.g. `git filter-repo`). |
| 2 | **Real-looking bank and business details** are in a tracked template file. | `Laundary-POS-System-Backend/ENV_TEMPLATE.txt:17-21,32-36` | Replace them with placeholders. |
| 3 | **Anyone can create a cashier account.** `POST /api/auth/register` needs no login and creates an active cashier, who has full customer and order CRUD. | `routes/auth.js:24`, `authController.js:20-54` | Remove the route or protect it with `requireAdmin`. |
| 4 | **Refresh tokens are accepted as access tokens** when `JWT_REFRESH_SECRET` is unset, because the auth middleware doesn't check the token `type`. | `authController.js:13,252`, `middleware/auth.js` | Always set a separate refresh secret and reject `type:'refresh'` in `authenticateToken`. |
| 5 | **Mass assignment.** `updateOrder` runs `Object.assign(order, req.body)`, so a client can set `paidAmount`, `totalAmount` or `isDeleted`. Customer create and update accept the raw body, including `loyaltyPoints`. | `orderController.js:691`, `customerController.js:18,240` | Whitelist the fields each endpoint may change. |
| 6 | **Order confirmation emails never send.** `sendOrderConfirmation` calls `formatPlainCurrency` and `formatEstimatedTime`, which only exist inside `sendBankAccountDetails`. The resulting `ReferenceError` is caught and swallowed. | `notificationService.js:150` vs `455+` | Move the helpers to module scope. |

---

## 2. System Overview

Fold Fox is a POS and back-office system for a laundry business in Sri Lanka (currency LKR). It has two separately deployed apps:

- **Backend:** a REST API with Express 5 and MongoDB (Mongoose). It deploys to Vercel as a single serverless function.
- **Frontend:** a React 19 + Vite single-page app. It includes a public marketing landing page with customer self-registration, and the staff POS behind a login.

**Main features**

- Customer management, with student and campaign discounts and loyalty points.
- Walk-in and pickup orders. Pricing depends on the clothing category and is either per kg or per piece. There are express, pickup and delivery fees.
- Order lifecycle tracking: a *phase* (`draft → confirmed → processing → completed`) plus a laundry *status* (`pickup → received → washing … → complete`).
- Cash and bank-transfer payments, with extra charges (hangers, bags).
- Transactional email: pickup scheduled, order confirmation, receipt, bank details.
- Reports with charts and Excel export.
- Admin-only management of services, staff (HR records) and login users.

**Two roles:** `admin` and `cashier` (see [§9](#9-roles--permissions)).

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js (Express 5 needs **Node ≥ 18**; `package.json` says `>=14`) |
| API | Express 5.1, helmet, cors, compression, morgan, express-rate-limit 8, express-validator 7 |
| Database | MongoDB via Mongoose 8.18 |
| Auth | jsonwebtoken (access + refresh tokens), bcryptjs (cost 12) |
| Email | nodemailer (pooled; Gmail by default) |
| Exports | exceljs (reports). `pdfkit` is present but its PDF util is unused. |
| Unused deps | `twilio`, `multer` |
| Frontend | React 19.2, react-router-dom 7, @tanstack/react-query 5, axios, react-hook-form + yup |
| UI | Tailwind CSS 3.4 (+ `@tailwindcss/forms`), Headless UI 2, Heroicons, lucide-react, react-icons, recharts 3, react-hot-toast |
| Build | Vite 5 (dev server on port **3000**) |
| Hosting | Vercel (two projects) |
| Tests | None. jest and supertest are installed, but there is no test script and no tests. |

---

## 4. Repository Layout

```
Fox-Fold-Laundary-POS/
├── README.md, *.md                      # Root docs (see §15)
├── .gitignore
├── Laundary-POS-System-Backend/
│   ├── server.js                        # Local long-running server (npm start / npm run dev)
│   ├── api/index.js                     # Vercel serverless entry (lazy DB connect → app)
│   ├── index.js                         # Duplicate of api/index.js — unused
│   ├── vercel.json, .vercelignore
│   ├── ENV_TEMPLATE.txt, ENV_SETUP.md, QUICK_START_ADMIN.md, ADMIN_USER_GUIDE.md (empty)
│   └── src/
│       ├── app.js                       # Express app: security, CORS, limits, routers
│       ├── config/database.js           # Serverless-safe Mongoose connect
│       ├── controllers/                 # auth, customer, order, report, service, staff, user
│       ├── middleware/                  # auth, errorHandler, rateLimitConfig, registrationValidation, roleCheck, validation
│       ├── models/                      # Counter, Customer, Order, Service, Staff, User
│       ├── routes/                      # auth, customers, orders, reports, services, staff, users
│       ├── services/notificationService.js  # All email
│       └── utils/                       # generatePDF (unused), helpers, permissions, validators
└── Laundary-POS-System-Frontend/
    ├── index.html, vite.config.js, tailwind.config.js, postcss.config.js, vercel.json
    ├── ENV_TEMPLATE.txt, ENV_SETUP.md
    ├── public/                          # webp images, manifest.json
    └── src/
        ├── index.js, App.js             # Entry + routing
        ├── index.css                    # Global styles (App.css exists but is never imported)
        ├── context/AuthContext.jsx      # Auth state (useReducer)
        ├── hooks/                       # useAuth, useStaffService
        ├── services/                    # api.js (axios) + per-domain service modules
        ├── config/campaign.js           # Landing-page campaign settings
        ├── constants/index.js           # Roles, routes, statuses, categories, storage keys
        ├── utils/                       # helpers, studentIdValidator
        ├── pages/                       # Route-level screens (see §12)
        └── components/                  # customers, landing, layout, modals, orders, reports, services, staff, ui, users
```

### Backend file index

| File | Purpose |
|---|---|
| `server.js` | Loads `.env`, calls `connectDB()` (**not awaited**), listens on `PORT` (default 5000). Handles `unhandledRejection`, `SIGTERM` and `SIGINT`. |
| `api/index.js` | Vercel handler. Keeps a module-level `isConnected` flag and connects to the DB before passing the request to `app`. |
| `src/app.js` | Middleware pipeline, CORS, rate limits, router mounts, `/api/health`, `/api`, 404 and error handler. |
| `src/config/database.js` | Reuses an open connection. `strictQuery=false`, 5 s server-selection timeout. Exits the process on failure, except in production on Vercel. |
| `middleware/auth.js` | `authenticateToken`, `authorizeRole(roles)`, `authorizeResource(resource, action)`. |
| `middleware/errorHandler.js` | Maps Mongoose and JWT errors to JSON (CastError→404, duplicate key→400, ValidationError→400, JWT→401). |
| `middleware/rateLimitConfig.js` | `registrationLimiter`, `loginLimiter`, `strictLimiter`, and `apiLimiter` / `readLimiter` (these two are unused). |
| `middleware/registrationValidation.js` | Validation and sanitising for the public landing sign-up. |
| `middleware/roleCheck.js` | Prebuilt role and permission middleware: `requireAdmin`, `requireCashierOrAdmin`, `canX…`. |
| `middleware/validation.js` | express-validator chains: customer, order, payment (unused), login, user. |
| `controllers/authController.js` | Register, login, profile, change password, refresh, logout, check email. |
| `controllers/customerController.js` | Customer CRUD, search, analytics, loyalty, bulk update, landing registration, discount info. |
| `controllers/orderController.js` | Order create/update/status/payment/confirm/delete, analytics, bank details, receipt. |
| `controllers/reportController.js` | Dashboard KPIs, revenue, status, customer and service reports, Excel exports. |
| `controllers/serviceController.js` | Service catalog CRUD, stats, analytics, duplicate, price calculator, bulk ops. |
| `controllers/staffController.js` | Staff CRUD. Six more handlers are defined but not exported. |
| `controllers/userController.js` | User CRUD, password, toggle status, stats. |
| `services/notificationService.js` | nodemailer transport and 4 email templates. |
| `utils/helpers.js` | Formatting, pagination, search, category helpers, and `generateOrderNumber` (unused). |
| `utils/permissions.js` | `ROLE_PERMISSIONS`, `hasPermission`, `getUserPermissions`. |
| `utils/validators.js` | Hand-written user and staff validators. |
| `utils/generatePDF.js` | pdfkit receipt generator. **Not used anywhere.** |

---

## 5. Local Setup & Environment Variables

### Run locally

```bash
# Backend
cd Laundary-POS-System-Backend
npm install
cp ENV_TEMPLATE.txt .env     # then fill in real values
npm run dev                  # nodemon server.js → http://localhost:5000

# Frontend
cd Laundary-POS-System-Frontend
npm install
cp ENV_TEMPLATE.txt .env     # set VITE_API_URL=http://localhost:5000/api
npm run dev                  # Vite → http://localhost:3000
```

There is **no admin seed script.** `npm run seed:admin` is mentioned in `QUICK_START_ADMIN.md` but does not exist. To create the first admin, add a `User` document with `role: 'admin'` directly in MongoDB (the password is hashed by the model's pre-save hook, so create it through Mongoose), or register a cashier and promote it in the database.

### Backend environment variables (read by code)

| Variable | Used by | Notes |
|---|---|---|
| `MONGODB_URI` | database.js | Required. (Some docs wrongly say `MONGO_URI`.) |
| `JWT_SECRET` | auth middleware, authController | Required. |
| `JWT_REFRESH_SECRET` | authController | Falls back to `JWT_SECRET`. **Always set it** (see §1 #4). |
| `JWT_EXPIRES_IN` | authController | Default `24h`. "Remember me" forces `30d`. |
| `JWT_REFRESH_EXPIRES_IN` | authController | Default `7d`. |
| `PORT` | server.js | Default 5000. |
| `NODE_ENV` | many | Controls rate limits, morgan, and error detail in responses. |
| `VERCEL` | database.js | Set automatically by Vercel. |
| `FRONTEND_URL` | app.js | Optional comma-separated list of extra CORS origins. |
| `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD` | notificationService | Email is disabled unless both user and password are set. |
| `BUSINESS_NAME`, `BUSINESS_ADDRESS`, `BUSINESS_PHONE`, `BUSINESS_EMAIL`, `CURRENCY` | emails, `/api` | No fallbacks in several templates, so an unset value prints `undefined`. |
| `BANK_NAME`, `BANK_ACCOUNT_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_BRANCH`, `BANK_SWIFT_CODE` | orderController | Used for the bank-transfer email. |

### Frontend environment variables (`import.meta.env`, baked in at build time)

| Variable | Used by |
|---|---|
| `VITE_API_URL` | `constants/index.js`. Default `http://localhost:5000/api`. |
| `VITE_BUSINESS_NAME/ADDRESS/PHONE/EMAIL`, `VITE_CURRENCY` | ReceiptModal, PaymentModal, OrderDetailsPage, Contact |
| `VITE_BANK_NAME/ACCOUNT_NAME/ACCOUNT_NUMBER/BRANCH/SWIFT_CODE` | paymentService. These values ship in the public JS bundle. |

---

## 6. Backend Architecture

### Request pipeline (`src/app.js`)

1. `trust proxy = 1`
2. `helmet()`
3. `cors(...)`: see below
4. Global rate limiter, 100 requests per 15 min per IP. Skipped in development.
5. `express.json` / `urlencoded` (10 MB limit)
6. `compression()`
7. `morgan('dev')` in development only
8. **Outside development only:** a second limiter (50 / 15 min, so the effective cap is 50) and manual security headers
9. Routers under `/api/{auth,users,staff,customers,orders,services,reports}`
10. `GET /api/health`, `GET /api`
11. 404 JSON, then `errorHandler`

### CORS

- **Always allowed:** `http://localhost:5173`, `http://localhost:3000`, `https://www.foldfox.lk`, `https://foldfox.lk`.
- **Plus:** each entry in `FRONTEND_URL`.
- **Production only:** any `https://*.vercel.app` origin. This matches *any* Vercel account, and `credentials: true` is set.
- Requests without an `Origin` header are allowed.
- A disallowed origin currently returns **500** instead of 403.

### Rate limits

| Limiter | Window / max | Applies to |
|---|---|---|
| Global (app.js) | 15 min / 100 (+ a 50 cap outside development) | All routes |
| `registrationLimiter` | 15 min / 5 | `POST /api/customers/register-from-landing` |
| `loginLimiter` | 15 min / 10 (successful logins not counted), keyed on email + IP | `POST /api/auth/login`, production only |
| `strictLimiter` | 1 h / 3 | `PUT /api/auth/change-password` |

The custom key generators trust the raw `X-Forwarded-For` header, which a client can spoof.

### Database connection

`connectDB()` can safely be called more than once. The serverless entry calls it on every cold start. Locally, `server.js` starts listening before the connection completes.

---

## 7. Data Models

All models have `createdAt` and `updatedAt` timestamps.

### User (login accounts)

| Field | Type / rules |
|---|---|
| `name` | String, required, max 50 |
| `email` | String, required, unique, lowercase |
| `password` | String, required, min 6. bcrypt-hashed in the pre-save hook. |
| `role` | `admin` \| `cashier` (default `cashier`) |
| `isActive` | Boolean, default true |
| `lastLogin` | Date |
| `phoneNumber` | 10–15 digits |

Method: `comparePassword(candidate)`.

### Customer

| Field | Type / rules |
|---|---|
| `fullName` | required, max 100 |
| `phoneNumber` | required, **unique**, 10–15 digits |
| `email` | optional, not unique |
| `address` | `{street, city, country='Sri Lanka'}` |
| `isStudent`, `campusId`, `studentId` | Student info. The IDs are stored uppercase. |
| `registeredViaCampaign`, `campaignCode`, `campaignRegistrationDate` | Campaign tracking |
| `firstOrderCompleted`, `firstOrderDate`, `firstOrderId` | Controls the one-time campaign discount |
| `eligibleForCampaignDiscount`, `eligibleForStudentDiscount` | Booleans |
| `registrationSource` | `landing_page` \| `pos_system` \| `walk_in` \| `phone` |
| `totalOrders`, `totalSpent`, `loyaltyPoints` | Running totals |
| `notes` | String |

**Methods**

- `getApplicableDiscount()` returns one of:
  - **Campaign, 20%, one time:** when the first order isn't completed yet and the customer is campaign-eligible.
  - **Otherwise student, 10% (`STUDENT10`):** when the customer is a student and eligible for the student discount.
  - **Otherwise** no discount.
- `markFirstOrderCompleted(orderId)`
- `getDiscountSummary()`

### Service (catalog)

| Field | Type / rules |
|---|---|
| `name` | required, unique |
| `description` | String |
| `clothingPrices` | Map\<category, Number\>, the price for each clothing category |
| `clothingPriceTypes` | Map\<category, `per_kg` \| `per_piece`\> |
| `priceType`, `basePrice` | Legacy fields. `basePrice` is the lowest category price. |
| `statuses` | Processing steps: `wash`, `dry`, `iron`, `dry_clean`, `fold` (default `[wash, dry]`) |
| `estimatedTime` | Minutes, default 60 |
| `isActive`, `icon`, `color` | Display and availability |

**Clothing categories:**
- **Built-in (11, can't be deleted):** `normal_clothes`, `bed_sheets`, `towels`, `blazers`, `saree`, `curtains`, `pillowcases`, `suits`, `jeans`, `blankets`, `other`. Defined in `src/constants/clothingCategories.js`.
- **Custom:** admins can add their own with the "+ Add custom category" button on the service form (Pricing step). These are stored in the `ClothingCategory` collection as `{key, label, createdBy}` and are shared by every service.
- **Keys:** a custom key is generated from its name, e.g. "Wedding Dress" becomes `wedding_dress`. All keys must match `[a-z0-9_]+`.
- **Deleting:** a custom category can only be deleted when no service has a price for it.

### Order

**Order items**

| Field | Type / rules |
|---|---|
| `service` | ref Service |
| `serviceName` | String |
| `quantity` | ≥ 1 |
| `weight` | ≥ 0 |
| `clothingCategory` | One of the clothing categories |
| `unitPrice`, `totalPrice` | Numbers |
| `estimatedTime` | Minutes |
| `notes` | Max 200 |

**Payments**

| Field | Type / rules |
|---|---|
| `method` | The model allows `cash`, `card`, `digital_wallet`, `bank_transfer`, `upi`, `cheque`. The API and UI only use cash and bank transfer. |
| `amount` | Number |
| `status` | `pending` \| `completed` \| `failed` \| `refunded` |
| `transactionId` | String |
| `notes` | String |
| `processedAt` | Date |

**Order fields**

| Group | Fields |
|---|---|
| Identity | `orderNumber` (unique, auto `FL` + YYMMDD + last 6 digits of `Date.now()`), `customer` (ref), `customerInfo` {name, phone, email, address} (snapshot) |
| Workflow | `status` (see [§10](#order-lifecycle)), `orderPhase` (`draft`/`confirmed`/`processing`/`completed`/`cancelled`), `serviceStatuses`, `itemsConfirmed`, `confirmedAt`, `confirmedBy`, `confirmationHistory` {estimatedTotal, actualTotal, difference, …}, `isEditable` |
| Logistics | `pickupRequired`, `pickupAddress`, `deliveryRequired`, `deliveryAddress`, `deliveryDistance`, `actualDeliveryDate` |
| Money | `subtotal`, `taxAmount` (always 0), `isExpressService`, `expressServiceFee`, `extraCharges` {items[], total}, `pickupCharges`, `deliveryCharges`, `discount` {type, percentage, amount, description, code, isFirstOrderDiscount}, `discountAmount`, `totalAmount`, `paidAmount`, `balanceAmount`, `payments[]` |
| Loyalty | `loyaltyPointsUsed`, `loyaltyPointsEarned` |
| Meta | `specialInstructions`, `staffNotes`, `createdBy`, `assignedStaff[]`, `tags[]`, `isActive`, `isDeleted` (soft delete) |

**Virtuals:** `paymentStatus` (paid / partial / unpaid), `ageInDays`, `estimatedCompletion`.

**Pre-save hooks:**
1. Generates the order number and sets `balanceAmount`.
2. When items change, recomputes `subtotal` and `totalAmount`.

These run in the wrong order: the balance can end up calculated from the old total.

**Methods:** `updateStatus`, `addPayment`, `calculateLoyaltyPoints`, `applyDiscount`, `recalculateTotal`, `canEdit`, `canConfirm`, `transitionPhase`. `transitionPhase` enforces draft→confirmed→processing→completed, and allows any phase except completed to move to cancelled.

**Statics:** `getOrderStats(filters)`, `getOrdersByStatus()`.

### Staff (HR records; staff cannot log in)

| Group | Fields |
|---|---|
| Identity | `employeeId`, auto-generated `EMP` + YYMM + a 4-digit sequence per month (from `Counter`) |
| Personal info | `personalInfo` {idNumber (unique), firstName, lastName, dateOfBirth, gender, phoneNumber, email (unique, sparse), address (country defaults to `'India'`, which is inconsistent with the rest of the app), emergencyContact} |
| Employment info | `employmentInfo` {position, employmentType (`full_time`/`part_time`/`contract`/`intern`), hireDate, workSchedule {startTime, endTime, workingDays, shiftType}, reportingManager, salary {amount, currency='LKR', paymentFrequency}} |
| Audit | `createdBy`, `updatedBy` |

**Virtuals:** `fullName`, `age`, `yearsOfService`. These are not included in JSON output.

### Counter

`{key (unique), seq}`. An atomic sequence, used for staff employee IDs.

---

## 8. API Reference

- **Base path:** `/api`.
- **Response shape:** `{ success, message?, data? }`. Several endpoints put payloads at the top level instead (e.g. `user`, `customer`, `stats`, `service`).
- **Auth:** send `Authorization: Bearer <token>`.
- **Legend:** 🌐 public · 🔑 any logged-in user · 👤 cashier or admin · 🛡 admin only.

### Auth: `/api/auth`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register` | 🌐 | Creates a **cashier** (a request for `role=admin` is rejected). Returns tokens. |
| POST | `/login` | 🌐 | `{email, password, rememberMe}`. Returns `{token, refreshToken, user{…, permissions}}`. Rate-limited in production. |
| POST | `/refresh-token` | 🌐 | `{refreshToken}`. Returns a new token pair. |
| POST | `/check-email` | 🌐 | `{email}`. Returns `{exists}`, which allows email enumeration. |
| GET | `/profile` | 🔑 | Current user and permissions |
| PUT | `/profile` | 🔑 | `{name, email}` |
| PUT | `/change-password` | 🔑 | `{currentPassword, newPassword}`. Limited to 3 per hour. |
| POST | `/logout` | 🔑 | Does nothing on the server; tokens are not revoked. |

### Users: `/api/users`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/profile/me` | 🔑 | Own profile |
| GET | `/stats` | 🛡 | Counts by role and active status |
| GET | `/`, `/search` | 🛡 | List users. Query: `page, limit, role, isActive, search, sortBy, sortOrder` |
| GET | `/:id` | 🔑 | The controller limits cashiers to their own record |
| POST | `/` | 🛡 | Create a user |
| PUT | `/:id` | 🔑 | Cashiers can change only their own name and email. Admins can change anything. |
| PUT | `/:id/password` | 🔑 | Cashiers must give their current password. Admins can reset anyone's. |
| PUT | `/:id/toggle-status` | 🛡 | Flips `isActive`. Admins can't toggle themselves. |
| DELETE | `/:id` | 🛡 | Hard delete. Admins can't delete themselves. |

### Staff: `/api/staff` (all 🛡)

| Method | Path | Description |
|---|---|---|
| GET | `/` | Paginated list with search |
| GET | `/:id` | One staff member |
| POST | `/` | Create. `idNumber`, email and phone must each be unique. |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Hard delete |

The frontend's `staffService` also calls 8 staff endpoints that **don't exist** (status, attendance, skills, training, bulk-update, stats, search, analytics).

### Customers: `/api/customers`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register-from-landing` | 🌐 | Landing-page self-registration. Limited to 5 per 15 min. Accepts a `campaignCode`. |
| GET | `/` | 👤 | List. Query: `page, limit≤100, search, isStudent, sortBy, sortOrder, campusId, hasOrders, loyaltyPoints` |
| GET | `/stats` | 👤 | Totals, loyalty tier buckets, top campuses |
| GET | `/search?q=` | 👤 | Search (at least 2 characters) on name, phone, campus ID or email |
| GET | `/phone/:phoneNumber` | 👤 | Look up by phone |
| GET | `/:id` | 👤 | One customer |
| GET | `/:id/orders` | 👤 | Order history plus lifetime aggregates |
| GET | `/:id/analytics?period=` | 👤 | Overview, monthly trend, top services |
| GET | `/:id/discount-info` | 👤 | Applicable discount |
| POST | `/` | 👤 | Create |
| PUT | `/:id` | 👤 | Update |
| PUT | `/:id/loyalty-points` | 👤 | `{points, action: add\|subtract\|set, reason}` |
| PUT | `/bulk-update` | 🛡 | ⚠ **Unreachable.** It is declared after `PUT /:id`, which catches the request first. |
| DELETE | `/:id` | 👤 | Hard delete. The customer's orders are left without a customer. |

### Orders: `/api/orders` (all require login)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | 🔑 | List with stats. Query: `page, limit, status, paymentStatus, customerId, startDate, endDate, search, sortBy, sortOrder, isExpressService` |
| GET | `/analytics` | 🔑 | Overview, orders by status, daily stats |
| GET | `/:id` | 🔑 | One order, populated |
| POST | `/` | 🔑 | Create an order (pricing in [§10](#pricing)) |
| PUT | `/:id` | 🔑 | Edit. Allowed only in draft, or confirmed with no payments. |
| PATCH | `/:id/status` | 🔑 | `{status, notes, autoProgress}` |
| PUT | `/:id/confirm-items` | 🔑 | Enter actual quantities and weights for a pickup order |
| POST | `/:id/payments` | 🔑 | `{method: cash\|bank_transfer, amount, transactionId, notes, extraCharges}` |
| POST | `/:id/send-bank-details` | 🔑 | Email bank-transfer instructions |
| POST | `/:id/send-receipt` | 🔑 | Email the receipt. The address may be overridden in the request body. |
| DELETE | `/:id?force=` | 🛡 | Hard delete and reverse the loyalty points credited for the order. Blocked when the order has been paid or is being processed, unless `force` is passed. `force=false` also forces, because any value is truthy. |
| POST | `/bulk-update` | 🛡 | `{orderIds, action: updateStatus\|assignStaff\|delete}` (delete is a soft delete) |

### Services: `/api/services`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/`, `/stats`, `/search`, `/statuses`, `/:id`, `/:id/analytics` | 👤 | Read endpoints |
| POST | `/:id/calculate-price` | 👤 | `{quantity, weight, clothingCategory}`. Returns the price breakdown. |
| POST | `/` | 🛡 | Create |
| PUT | `/:id` | 🛡 | Update |
| PATCH | `/:id/toggle-status` | 🛡 | Activate or deactivate |
| POST | `/:id/duplicate` | 🛡 | Copy under a new name |
| DELETE | `/:id` | 🛡 | Delete |
| PUT | `/bulk-update` | 🛡 | ⚠ **Unreachable**, for the same reason as the customers route |

### Clothing categories: `/api/clothing-categories`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | 👤 | Built-in categories first, then custom ones. Returns `[{key, label, isCustom}]`. |
| POST | `/` | 🛡 | `{label}` (2–40 characters). Adds a custom category. Rejects a name that duplicates a built-in or existing custom category. |
| DELETE | `/:key` | 🛡 | Custom categories only. Refused while any service has a price for it. |

### Reports: `/api/reports` (🔑 plus `canViewReports`, which both roles have)

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | Today's and this month's orders and paid revenue, customer count, pending orders |
| GET | `/revenue?startDate&endDate&groupBy=day\|week\|month` | Paid orders only |
| GET | `/order-status` | Counts by status (⚠ broken, see §16) |
| GET | `/customers?limit` | Top customers by spend |
| GET | `/services` | Quantity and revenue per service |
| GET | `/export/{revenue,order-status,customers,services}` | `.xlsx` download |

### Misc

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/health` | 🌐 | Health check. Its `corsEnabled` field only reflects `NODE_ENV`. |
| GET | `/api` | 🌐 | API index |

---

## 9. Roles & Permissions

Defined in `utils/permissions.js`, enforced by `middleware/roleCheck.js` and mirrored on the frontend (`AuthContext.canAccess`, `Sidebar`, `AdminRoute`).

| Resource | Admin | Cashier |
|---|---|---|
| users | CRUD | none (own profile and password only) |
| customers | CRUD | CRUD |
| orders | CRUD | CRUD, except delete and bulk update, which are admin-only at the route level |
| services | CRUD | read |
| staff | CRUD | none |
| reports | read | read |

**Frontend navigation**
- **Admin:** Dashboard, Orders, Customers, Services, Staff, Users, Reports.
- **Cashier:** Dashboard, New Order, Orders, Customers, Reports.

---

## 10. Business Logic & Workflows

### Authentication

1. `login` checks the password and whether the account is active, then updates `lastLogin`. It issues:
   - an **access token** (`{userId}`, signed with `JWT_SECRET`, valid 24h, or 30d with "remember me")
   - a **refresh token** (`{userId, type:'refresh'}`, valid 7d)
2. The frontend stores `auth_token`, `refresh_token` and `user_data` in `localStorage`.
3. The axios interceptor attaches the token to requests. On a 401 it calls `/auth/refresh-token` once and retries the request. If the refresh fails, it clears storage and redirects to `/login`.
4. Logout clears storage on the client only.

### Pricing

This logic lives in `orderController.createOrder`. It is duplicated in `confirmOrderItems`, `updateOrder`, `serviceController.calculateServicePrice` and three frontend components.

```
unitPrice  = service.clothingPrices[clothingCategory]           (400 error if missing or ≤ 0)
priceType  = service.clothingPriceTypes[category] ?? service.priceType
lineTotal  = unitPrice × weight   (per_kg)
           = unitPrice × quantity (per_piece)
subtotal   = Σ lineTotal
discount   = subtotal × customer.getApplicableDiscount().percentage / 100
express    = LKR 100 flat if isExpressService
pickup     = body.pickupCharges (default 50)
delivery   = body.deliveryCharges, or (distance − 40) × 10 if 0 and distance > 40 km
tax        = 0
total      = subtotal + tax + express + extras + pickup + delivery − discount
```

### Discounts

| Type | Rate | Who qualifies | How long |
|---|---|---|---|
| Campaign | 20% | Registered on the landing page with a valid code (`GRAND_OPENING_2025`, `STUDENT_WELCOME_2025`, `CAMPAIGN2025`; the list is hard-coded) | First order only |
| Student | 10% (`STUDENT10`) | `isStudent` with a campus or student ID | Every order |
| None | 0 | Everyone else | n/a |

The campaign's date window (2025-10-13 → 2025-12-31, in `config/campaign.js`) is **only checked in the browser**. The backend accepts the codes at any time.

### Order lifecycle

There are two walk-in/pickup flows. Each order carries two state fields that move together:

```
WALK-IN:  create → phase=confirmed, status=received → "Order Confirmation" email
PICKUP:   create → phase=draft, status=pickup → "Pickup Scheduled" email
          → confirm-items (enter actual qty/weight, re-price, re-apply discount)
          → phase=confirmed, status=received → "Order Confirmation" email

status:   pickup → received → washing → drying → ironing → dry_cleaning → folding
          → packing → deliver (if deliveryRequired) → complete
          (only the processing steps needed by the order's services are used)

phase:    draft → confirmed → processing (on first payment) → completed (on deliver/complete)
          any phase except completed → cancelled
```

- **Editing** is allowed only in `draft`, or in `confirmed` with no payments. Editing a confirmed pickup order sends it back to `draft`.
- **Status changes in the UI** (`OrderStatusManager`) can only move forward, by at most 2 steps at a time.
- **Auto-progress** (`autoProgress: true`) is currently broken. Services store `wash`/`dry` while the progression logic looks for `washing`/`drying` (§16).

### Payments

- Methods are **cash** and **bank transfer**. A bank transfer needs a transaction ID.
- The UI always charges the **full balance**, plus any extra items such as hangers or bags. The extras are added to `extraCharges` and the total is recalculated.
- `paidAmount += amount` and `balanceAmount = total − paid`. The first payment moves the order to the `processing` phase.
- When the balance reaches 0 or less and the customer has an email, a receipt is sent automatically.
- "Send bank details" emails the account details from env. If the email fails, the UI still shows the details so they can be copied into an SMS.

### Loyalty points

- **Earned:** `floor(totalAmount)`, i.e. 1 point per LKR, credited **when the order is created** (before payment).
- **Reversed:** when an order is hard-deleted.
- **Manual adjustment:** `PUT /customers/:id/loyalty-points`.
- **Tiers** (display only): Bronze < 100 ≤ Silver < 500 ≤ Gold < 1000 ≤ VIP.
- `loyaltyPointsUsed` is deducted from the customer's balance but **does not reduce the order price** (§16).

### Notifications (email only)

| Trigger | Email |
|---|---|
| Pickup order created | "Pickup Scheduled" (no amounts) |
| Walk-in order created / pickup items confirmed | "Order Confirmation" (**currently always fails**, §1 #6) |
| Balance paid in full / manual send | Receipt (HTML + text) |
| Manual | Bank transfer details |

Email failures never fail the API call, except `send-receipt`, which returns 500.

### Reports

- **Revenue** counts only fully paid orders (`balanceAmount ≤ 0`) that aren't deleted.
- **Excel exports:** one sheet per report, with a styled header row.
- **Frontend charts:** recharts line, bar and pie charts.

---

## 11. Frontend Architecture

### Routing (`src/App.js`)

| Path | Page | Guard |
|---|---|---|
| `/`, `/landing` | LandingPage | public |
| `/login` | Login | `PublicRoute` (logged-in users are sent to `/dashboard`) |
| `/dashboard` | Dashboard | logged in |
| `/customers`, `/customers/new`, `/customers/edit/:id`, `/customers/:id` | Customers, CustomerFormPage, CustomerDetailsPage | logged in |
| `/orders`, `/orders/new`, `/orders/edit/:id`, `/orders/:id` | Orders, OrderFormPage, OrderDetailsPage | logged in |
| `/services/*` (list/new/edit/details) | Services pages | **AdminRoute** |
| `/staff/*` | Staff pages | **AdminRoute** |
| `/users/*` | Users pages | **AdminRoute** |
| `/reports/*` | Reports | logged in |
| `*` | redirect to `/` | n/a |

Authenticated routes render inside `ProtectedRoute` → `Layout` (Sidebar + Header + `<Outlet>`). `Register.jsx` exists but **has no route**.

**App-wide providers:** a React Query client (`retry: 1`, no refetch on window focus), `AuthProvider`, and a `react-hot-toast` `Toaster` at the top right.

### State and data

- **Auth:** `context/AuthContext.jsx` uses `useReducer`. On load, it validates the stored token by calling `GET /auth/profile`. It exposes `login`, `register`, `logout`, `updateProfile`, `changePassword`, `hasRole`, `isAdmin`, `isCashier` and `canAccess`. `hooks/useAuth.js` wraps it with display helpers. Components import from both places inconsistently.
- **Server data:** React Query hooks (`orderService`, `serviceService`, `useStaffService`) plus promise-based services (`customerService`, `userService`, `reportService`). A few pages use a manual `useEffect` fetch instead.
- **HTTP:** `services/api.js`: axios with a 10 s timeout, a bearer-token interceptor and the 401 → refresh → retry logic.

### Service modules → endpoints

| Module | Endpoints |
|---|---|
| `api.js` | Grouped raw calls: `authAPI`, `usersAPI`, `customersAPI`, `ordersAPI`, `servicesAPI`, `staffAPI`, `reportsAPI` |
| `customerService.js` | `/customers/*`. `registerFromLanding` retries 3× with backoff. |
| `orderService.js` | Hooks: `useOrders`, `useOrder`, `useOrderAnalytics`, `useCreateOrder`, `useUpdateOrder`, `useUpdateOrderStatus`, `useAddPayment`, `useDeleteOrder`, `useBulkUpdateOrders`. Also status and label helpers and `calculateOrderProgress`. |
| `paymentService.js` | `sendBankAccountDetails`, `getBankAccountDetails` (from env), `validateTransactionId` |
| `reportService.js` | `/reports/*` and Excel blob downloads |
| `serviceService.js` | Hooks for everything under `/services/*`, plus price and label helpers |
| `staffService.js` | Singleton class for `/staff/*`. Only 5 of its 13 endpoints exist on the backend. |
| `userService.js` | `/users/*` plus validation helpers |

### Config and constants

- `constants/index.js`: `ROLES`, `ROUTES`, `ORDER_STATUS`, `PAYMENT_METHODS` (cash, bank_transfer), `SERVICE_STATUSES`, `CLOTHING_CATEGORIES`, `STORAGE_KEYS`, `VALIDATION`, `PAGINATION`, `DATE_FORMATS`.
- `config/campaign.js`: the "Grand Opening Special" (20%, `GRAND_OPENING_2025`, 2025-10-13 → 2025-12-31), plus banner, badge and button text helpers. The campaign has **expired**, but `isActive` is still `true`.
- `utils/studentIdValidator.js`: ID patterns for SLIIT, CINEC, Horizon, KIU, University of Colombo, University of Moratuwa and "Other".

### Styling

- **Tailwind:** brand tokens `navy` (#233d4d) and `orange` (#fe7f2d); Open Sans and Lato fonts; fade, slide, bounce and blob animations.
- **Hard-coded colours:** most pages use inline hex `style={{…}}` instead of the Tailwind tokens.
- **Off-brand utilities:** `index.css` defines `.btn-*`, `.card`, `.badge-*` and `.form-*` classes in blue, which doesn't match the brand.
- **Classes that don't exist:** `animate-fadeIn`, `border-b-3`, `border-3`, `xs:`. They are used in many places and do nothing (§16).

---

## 12. Frontend Pages

| Page | Summary |
|---|---|
| **LandingPage** | Public marketing page: Navigation, Hero, About, WhyChooseUs, Services, Contact, Footer, and a `PopupRegistrationForm` modal. |
| **Login** | Email and password (yup), "remember me", a client-side lockout (5 failures → 5 min, reset on page refresh). Shows hard-coded demo credentials. |
| **Register** | Cashier sign-up form. **Not routed.** Uses old "LP" branding. |
| **Dashboard** | Role-aware welcome, 4 KPI cards (the trend percentages are hard-coded), quick actions, recent orders (**always empty**, wrong response path), an admin quick-access panel or a cashier tip. |
| **Customers** | Quick search (doesn't work), quick actions, recent 5 customers, and tabs for CustomerList and CustomerAnalytics. Includes LoyaltyManager. |
| **CustomerDetailsPage** | Profile header with student and tier badges; tabs for Overview, Orders and Analytics; create order; manage loyalty. |
| **CustomerFormPage** | Create and edit: name, phone, email, student and campus ID (live format validation), address, loyalty points (edit only). |
| **Orders** | 4 stat cards (3 always show 0 because the backend doesn't return those fields), tabs for OrderList and OrderAnalytics, PaymentModal. |
| **OrderFormPage** | 3-step wizard: 1) customer search, 2) items (service, category, quantity or weight, live price), 3) pickup, delivery, express, charges and instructions. |
| **OrderDetailsPage** | Phase and status badges, progress bar. Actions: confirm items, pay, print receipt, edit (locked when not allowed), copy info, delete (admin). Tabs for details, status management (OrderStatusManager) and timeline. Copy-to-SMS templates. |
| **Services** (admin) | Stat cards, ServiceList and ServiceAnalytics tabs, PriceCalculator, BulkOperations. |
| **ServiceDetailsPage** | Per-category prices, configuration, performance analytics by period, duplicate and delete. |
| **ServiceFormPage** | 3-step wizard: basic info → price and price type per clothing category → processing steps, time, icon, colour, active. |
| **Staff** (admin) | Stats computed in the browser, StaffList and StaffAnalytics tabs (analytics shows zeros). |
| **StaffDetailsPage** | Personal and employment details, schedule and salary. |
| **StaffFormPage** | Tabs for personal info (ID number, date of birth, contact, address, emergency contact) and employment info (position, type, hire date, schedule, salary). |
| **Users** (admin) | Stat cards, UserList and UserAnalytics tabs, PasswordChangeModal. |
| **UserDetailsPage** | Profile, timestamps, a hard-coded permission list for each role. |
| **UserFormPage** | Name, email, password (create only), phone, role cards, active toggle. |
| **Reports** | Tabs for Revenue, Order Status, Customer and Service reports. |

---

## 13. Frontend Components

### `components/customers/`
- **CustomerList:** table and grid views, search (at least 2 characters, triggered by Enter), filters, pagination, delete confirmation.
- **CustomerAnalytics:** KPI cards, loyalty tier distribution, top loyalty customers, insights.
- **LoyaltyManager:** modal to add, subtract or set points, with presets, a preview and a reason (5–200 characters).

### `components/orders/`
- **CustomerSearch:** customer picker used in the order form. ⚠ Shows two fake "demo" customers when a search returns nothing.
- **OrderList:** clickable stat cards, filters, selection and bulk bar, row actions. Edit and delete lock rules are applied here. Print and Export only log to the console.
- **OrderStatusManager:** timeline built from the order's services and the pickup/delivery flags. The status-change modal allows moving forward at most 2 steps.
- **ConfirmItemsModal:** enter the actual quantity or weight for each item. Re-prices, highlights changes of 20% or more, and asks for confirmation if the total moves more than 30%.
- **PaymentModal:** cash or bank-transfer flow. Bank transfer has three steps: method → bank details (send or copy) → transaction ID. Supports extra items. ⚠ The quick-add extras have no quantity, which makes the amount `NaN`.
- **ReceiptModal:** receipt preview. Print opens a new window; there is also copy as text and send by email.
- **OrderAnalytics:** KPIs, status breakdown and a daily table for a date range.

### `components/services/`
- **ServiceList:** table and grid views, filters, and actions: view, edit, duplicate, toggle, delete.
- **ServiceAnalytics:** KPIs, breakdown by price type, popular services.
- **PriceCalculator:** calls the backend price endpoint every time an input changes.
- **BulkOperations:** bulk activate, deactivate, delete or update, with a confirmation step.

### `components/staff/`
- **StaffList:** filtering, sorting and pagination done in the browser; delete.
- **StaffAnalytics:** only displays the data it is given.

### `components/users/`
- **UserList:** list paginated on the server; prevents deleting or deactivating yourself.
- **UserAnalytics**
- **PasswordChangeModal**

### `components/reports/`
- **RevenueReport, OrderStatusReport, CustomerReport, ServiceReport:** date filters, an Apply button, recharts charts, a table and an Excel export.

### `components/layout/`
- **Layout:** the app shell with a scroll-to-top button.
- **Sidebar:** navigation filtered by role.
- **Header:** clock, user menu, profile and logout. The search box and bell icon are placeholders.

### `components/modals/`
- **ProfileModal:** edit profile and change password.
- **LogoutModal**

### `components/landing/`
- **Navigation:** hides on scroll down; campaign badge.
- **Hero:** with the campaign announcement.
- **About, WhyChooseUs, Services, Contact, Footer**
- **PopupRegistrationForm:** 5-step self-registration: personal → contact → address → student → review, then a success screen showing the discount.
- **ErrorModal**
- `ui/Button`, `ui/Input`, `ui/Toast`: landing-page copies of the shared UI components.

### `components/ui/`
- **Button:** 8 variants, loading spinner.
- **Input:** forwards its ref for react-hook-form. ⚠ Ignores icons and has a broken class merge.
- **Modal:** Headless UI.
- **LoadingSpinner:** plus `FullScreenLoader`, `PageLoader`, `ButtonLoader`, `InlineLoader` (all unused).
- **PasswordStrength**
- `index.js`: barrel file, unused.

### `components/ProtectedRoute.jsx`
- `ProtectedRoute`, `AdminRoute`, `CashierRoute` (unused), `PublicRoute`.

---

## 14. Deployment (Vercel)

There are **two Vercel projects** built from the same repository.

| Setting | Backend project | Frontend project |
|---|---|---|
| Root directory | `Laundary-POS-System-Backend` | `Laundary-POS-System-Frontend` |
| Build | none | `npm run build`, output to `dist` |
| Routing | `vercel.json` sends everything to `/api` (`api/index.js`) | `vercel.json` rewrites everything to `/index.html` (SPA). Adds security headers and caches `/assets/*` for a year as immutable. |
| Environment variables | All backend variables in §5. `NODE_ENV=production` is set in `vercel.json`. | `VITE_*` variables, baked in at build time. **Redeploy after changing them.** |

**Checking a deployment:**
- `GET https://<backend>/api/health` should return 200.
- The frontend should be able to log in without CORS errors. Any `*.vercel.app` origin is allowed in production. Add a custom domain through `FRONTEND_URL`, or it is already hard-coded for `foldfox.lk`.

**Notes:**
- `.gitignore` ignores **all lock files**, so Vercel builds can't be reproduced exactly. Consider committing `package-lock.json`.
- `index.html` and `manifest.json` reference `favicon.ico` and `logo192.png`, which aren't in `public/`.

---

## 15. Existing Docs: Inventory & Contradictions

| Doc | Content | Status |
|---|---|---|
| `README.md` | Overview, setup, stack, API summary, discounts | Partly outdated (see below) |
| `CORS_FIX_SUMMARY.md` | Explains the `*.vercel.app` CORS fix | OK. Links to a missing `ENVIRONMENT_VARIABLES.md`. |
| `DEPLOYMENT_GUIDE.md` | CORS options, environment variable tables, troubleshooting | Mostly OK |
| `ENV_FIX_SUMMARY.md` | Variable renames (`MONGO_URI`→`MONGODB_URI`, etc.) | ⚠ **Contains live secrets** (§1) |
| `QUICK_DEPLOYMENT_CHECKLIST.md` | Short Vercel checklist | Uses different URLs from the other docs |
| `VERCEL_DEPLOYMENT_GUIDE.md` | Full Vercel walkthrough | Contradicts other docs on `FRONTEND_URL` |
| Backend `ENV_SETUP.md` | Backend environment variables | Uses **wrong names** (`MONGO_URI`, `JWT_EXPIRE`, `EMAIL_HOST`, `TWILIO_*`) |
| Backend `QUICK_START_ADMIN.md` | Admin seeding | References `npm run seed:admin` and `scripts/seedAdmin.js`, **neither of which exists** |
| Backend `ADMIN_USER_GUIDE.md` | n/a | **Empty file** |
| Frontend `ENV_SETUP.md` | `VITE_API_URL` only | Doesn't mention the other 10 `VITE_*` variables |

**Contradictions to resolve**

1. **Deployment URLs don't agree.** The quick checklist names a different frontend host and uses the *frontend* host of the other docs as its backend.
2. **Environment variable names:**
   - The code uses `MONGODB_URI`; README and the backend ENV_SETUP say `MONGO_URI`.
   - The code uses `JWT_EXPIRES_IN`; some docs say `JWT_EXPIRE`.
3. **`FRONTEND_URL` / `NODE_ENV`:** one guide says not to set them; three others say to set them.
4. **Frontend dev port:** the docs say 5173, but `vite.config.js` uses **3000**.
5. **README vs code:**
   - README says React 18; the code uses 19.
   - README lists payment methods Card and Mobile; only cash and bank transfer exist.
   - README describes the workflow as "Draft → … → Ready → Completed"; the real statuses differ.
   - README mentions a "fixed" price type, which doesn't exist.
   - README says Node ≥14; Node 18 or later is needed.
   - README links to a backend README that doesn't exist.
6. **Demo credentials:** two docs give different demo passwords for the same admin email.

---

## 16. Known Issues

Grouped by severity. Items already listed in §1 are not repeated here.

### High: wrong data or broken features

| # | Issue | Location |
|---|---|---|
| H1 | The order-status report and its export group by `$orderStatus`, but the field is `status`, so every order falls into one "Unknown" bucket. | `reportController.js:187,447` |
| H2 | The dashboard customer count is always 0: it filters on `isActive`, which Customer doesn't have. | `reportController.js:55` |
| H3 | Dashboard "Recent Orders" is always empty: it reads `response.data.orders` instead of `response.data.data.orders`. | `Dashboard.jsx:64` |
| H4 | Auto-progress stalls: service steps are stored as `wash`/`dry`/…, but the code looks for `washing`/`drying`/…. | `orderController.js:32,41` |
| H5 | Customer and service bulk-update routes can't be reached (route order). | `routes/customers.js:78-81`, `routes/services.js:64-67` |
| H6 | PaymentModal quick-add extras have no `quantity`, so the payment amount becomes `NaN`. | `PaymentModal.jsx:15-22,76-78` |
| H7 | CustomerSearch offers fake "demo" customers that a cashier can select for an order. | `CustomerSearch.jsx:9-28,60` |
| H8 | `ui/Input` passes an object to `cn()`, so the class `[object Object]` is applied and border and error styles never appear. It also ignores icons, so password show/hide toggles never render. | `ui/Input.jsx:8-21`, `utils/helpers.js:4-6` |
| H9 | Service analytics always shows zeros: a string ID is used in an aggregate `$match` without casting to ObjectId. | `serviceController.js:570+` |
| H10 | `updateCustomer` removes the student discount whenever `isStudent`/`campusId` are missing from the request body. | `customerController.js:243-249` |
| H11 | `confirmOrderItems` changes the order total but never updates the customer's `loyaltyPoints` or `totalSpent`, so the totals drift. | `orderController.js:1291` |
| H12 | Loyalty points are credited at order creation, before payment. Redeemed points don't reduce the price. | `orderController.js:341-347` |
| H13 | Payment amounts aren't validated: a negative amount, an overpayment, or a payment with `status:'pending'` still increases `paidAmount`. | `orderController.js:793-849` |
| H14 | Soft-deleted orders still appear in dashboard counts, reports, exports and customer history. | several |
| H15 | The UserList ↔ Users page stats callback can cause an infinite render loop. | `UserList.jsx:75-85`, `Users.jsx:83` |
| H16 | StaffAnalytics is given the staff list rather than stats data, so every figure shows 0. | `Staff.jsx:245` |
| H17 | Orders page stat cards read fields the backend never returns (`processingOrders`, `readyOrders`, `todayRevenue`). | `Orders.jsx:144-173` |
| H18 | ProfileModal: the phone regex rejects an empty value, so users without a phone number can't save their profile. | `ProfileModal.jsx:31-34` |
| H19 | `customerService` create and update read `response.data.customer`, but the backend nests it under `data.data.customer`. | `customerService.js:83,102` |

### Medium: security and robustness

- The `*.vercel.app` CORS rule trusts every Vercel deployment, from any account, with credentials allowed.
- Rate-limit key generators trust the spoofable `X-Forwarded-For` header.
- User input goes into `$regex` without escaping (ReDoS and injection risk). `sortBy` is not whitelisted. Some `limit` values have no maximum.
- Customer names, addresses and instructions are inserted into email HTML without escaping.
- Raw `error.message` is returned in 500 responses, including on public endpoints.
- Personal data is logged: full staff personal info, and customer analytics responses.
- `send-receipt` will email order details to any address supplied in the request body.
- Cashiers can hard-delete customers, which leaves their orders without a customer.
- Tokens can't be revoked, and "remember me" issues a 30-day access token.
- Order numbers (last 6 digits of `Date.now()`) can collide under load and hit the unique index.
- The Order pre-save hooks run in the wrong order, so the balance can be computed from the old total.
- `force=false` on order delete still forces, because query-string values are truthy strings.
- The API client doesn't queue concurrent 401 refreshes and doesn't save the rotated refresh token.
- React Query v5 is used with v4 APIs in many places:
  - `isLoading` on mutations (should be `isPending`)
  - `keepPreviousData`
  - `cacheTime` (should be `gcTime`)
  - `invalidateQueries([key])` with a bare array

### Low: UI and polish

- Tailwind classes that don't exist: `animate-fadeIn`, `border-b-3`, `border-3` (the medium spinner is invisible), `xs:`, `to-blue/10`.
- `group-hover` is used without a `group` parent, so grid-view action buttons are invisible in CustomerList, StaffList and ServiceList.
- The OrderStatusReport colour map uses old status names, so every pie slice is grey.
- The Dashboard shows fake "+12%" trend badges; the Header search box and notification bell are placeholders.
- `window.confirm` and `alert` are still used in several places.
- Business rules are hard-coded in the UI: the LKR 100 express fee, the 10% student discount, "LKR" labels.
- `PasswordChangeModal` requires at least 6 characters while `PasswordStrength` asks for 8.
- Staff address country defaults to India while everything else uses Sri Lanka.
- The campaign config has expired but is still marked `isActive: true`.

---

## 17. Dead Code & Duplication

### Unused files and exports

| Backend | Frontend |
|---|---|
| `index.js` (duplicate of `api/index.js`) | `App.css` (never imported) |
| `utils/generatePDF.js` | `pages/Auth/Register.jsx` (not routed) |
| `helpers.generateOrderNumber`, `helpers.hasPermission`, `generateQRCodeData` | `landing/ui/Input.jsx`, `landing/ui/Toast.jsx`, `ui/index.js` |
| `apiLimiter`, `readLimiter`, `validatePayment`, most of the `canX` role middleware | `landing/HighlightCard.jsx` (imported, never rendered) |
| 6 staff controller handlers that aren't exported (they call model methods that don't exist) | `CashierRoute`; `FullScreenLoader`, `PageLoader`, `ButtonLoader`, `InlineLoader` |
| `twilio`, `multer` dependencies | 8 `staffService` methods for missing endpoints; `ordersAPI.getByCustomer` and `generateReceipt` |

### Duplication worth consolidating

- **Pricing logic:** 4 places in the backend and 3 frontend components. Extract one shared function.
- **Buttons and inputs:**
  - Three Button implementations: `ui/`, `landing/ui/`, and an inline one in PopupRegistrationForm.
  - Two Input implementations.
- **Repeated helpers:**
  - Loyalty tier helpers: 3 copies.
  - `getCategoryPriceType`: 3 frontend copies.
  - Report filter bar and `formatCurrency`: copied across all 4 reports.
- **Tab bar markup:** copy-pasted across 8 or more pages.
- **`useAuth` import source:** `context/AuthContext` in some files, `hooks/useAuth` in others. Pick one.
- **Order totals:** computed both in the Order pre-save hook and in `recalculateTotal()`.

---

*Generated from a full static read of the repository. Nothing was executed; `node_modules` is not installed.*
