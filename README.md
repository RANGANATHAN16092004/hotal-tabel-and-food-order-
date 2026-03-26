# Restaurant Table & Food Booking System

A full-stack restaurant management system with dual portals: Hotel Admin Portal and Customer Portal accessed via QR codes.

## Features

### Hotel Admin Portal
- Secure registration and login
- Create and manage restaurant tables with capacity
- Create and manage menu items with categories and pricing
- View and manage customer orders with status updates
- Generate and display unique QR code for customers to scan
- Dashboard with statistics (tables, menu items, orders)

### Customer Portal
- Scan hotel QR code to access restaurant portal
- Quick login with name and phone number
- Browse menu by categories
- View available tables and select one
- Add items to cart and place orders
- Track order status
- View order history in profile

## Technology Stack

- **Frontend**: Next.js 14 (App Router) with React, Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens
- **QR Codes**: qrcode library

## Project Structure

```
restaurant-booking-system/
├── backend/                  # Express.js API
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   ├── middleware/          # Auth middleware
│   ├── utils/               # QR generation, helpers
│   └── server.js
├── frontend/                 # Next.js app
│   ├── app/
│   │   ├── (admin)/         # Hotel admin routes
│   │   ├── [hotelId]/       # Customer routes
│   │   └── page.js          # Home page
│   ├── components/
│   │   ├── admin/
│   │   └── customer/
│   └── lib/                 # API and auth utilities
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/restaurant-booking
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

4. Start the backend server:
```bash
npm run dev
```

The backend API will be running on `http://localhost:5000`

### Frontend Setup

#### Optional: Enable OTP CAPTCHA (Customer phone lookups)

To require CAPTCHA before sending OTPs from the customer phone lookup UI add the following to your frontend environment (e.g. `.env.local`):

```
NEXT_PUBLIC_OTP_REQUIRE_CAPTCHA=true
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key-here
```

If you do not have a reCAPTCHA site secret for server validation, the backend supports a development fallback token — set `captchaToken: 'dev'` when sending requests (only recommended for local testing).


1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be running on `http://localhost:3000`

## Usage

### For Hotel Admins

1. Register a new hotel account at `/admin/register`
2. Login at `/admin/login`
3. Access the dashboard to:
   - Create and manage tables
   - Add menu items
   - View and manage orders
   - View your unique QR code in the Profile section

### For Customers

1. Scan the hotel's QR code (or visit `/{hotelId}` where hotelId is the QR code)
2. Enter your name and phone number to login
3. Browse the menu and add items to cart
4. Select an available table
5. Place your order
6. View order history in your profile

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new hotel
- `POST /api/auth/login` - Hotel login

### Hotel (Protected)
- `GET /api/hotel/profile` - Get hotel profile
- `PUT /api/hotel/profile` - Update hotel profile
- `GET /api/hotel/qr` - Get hotel QR code

### Tables (Protected)
- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create a table
- `PUT /api/tables/:id` - Update a table
- `DELETE /api/tables/:id` - Delete a table

### Menu (Protected)
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create a menu item
- `PUT /api/menu/:id` - Update a menu item
- `DELETE /api/menu/:id` - Delete a menu item

### Orders (Protected)
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get a single order
- `PUT /api/orders/:id/status` - Update order status

### Customer (Public)
- `GET /api/customer/hotel/:qrCode` - Get hotel by QR code
- `POST /api/customer/login` - Customer login
- `GET /api/customer/menu/:hotelId` - Get menu for hotel
- `GET /api/customer/tables/:hotelId` - Get available tables
- `POST /api/customer/orders` - Create an order
- `GET /api/customer/orders/:customerId` - Get customer orders
- `GET /api/customer/order/:orderId` - Get a single order

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Hotel-specific data isolation
- Input validation and sanitization
- CORS configuration

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev  # Next.js development server
```

## Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Update `FRONTEND_URL` in backend `.env` to your production frontend URL
3. Update `NEXT_PUBLIC_API_URL` in frontend `.env.local` to your production API URL
4. Build the frontend: `cd frontend && npm run build`
5. Start the backend: `cd backend && npm start`
6. Start the frontend: `cd frontend && npm start`

## License

ISC


"# Hotel-Table-booking-and-Menu-Ordering" 











