# Quick Start Guide

## Prerequisites

Before you begin, make sure you have:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - Either:
  - Local MongoDB installation, OR
  - MongoDB Atlas account (free tier available)
- **npm** (comes with Node.js)

## Step-by-Step Setup

### 1. Install Dependencies

From the project root directory, run:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

Or install both at once from root:
```bash
npm run install-all
```

### 2. Set Up MongoDB

**Option A: Local MongoDB**
- Install MongoDB locally
- Make sure MongoDB service is running
- Default connection: `mongodb://localhost:27017/restaurant-booking`

**Option B: MongoDB Atlas (Cloud)**
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster
- Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/restaurant-booking`)

### 3. Configure Backend

Create a `.env` file in the `backend` directory:

```bash
cd backend
```

Create `.env` file with:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/restaurant-booking
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/restaurant-booking

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Important:** Replace `JWT_SECRET` with a random secure string (you can generate one online or use any random string).

### 4. Configure Frontend

Create a `.env.local` file in the `frontend` directory:

```bash
cd ../frontend
```

Create `.env.local` file with:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 5. Start the Application

You need to run both backend and frontend servers. Open **two terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
MongoDB connected successfully
Server is running on port 5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
```

### 6. Access the Application

- **Home Page**: http://localhost:3000
- **Admin Portal**: http://localhost:3000/admin/login
- **Customer Portal**: http://localhost:3000/[hotelId] (after getting QR code from admin)

## First Time Usage

### For Hotel Admin:

1. Go to http://localhost:3000/admin/register
2. Register your restaurant with:
   - Hotel Name
   - Email
   - Password (min 6 characters)
   - Phone Number
   - Address (optional)
3. After registration, you'll be logged in automatically
4. Go to **Profile** page to see your QR code
5. Start adding:
   - **Tables**: Go to Tables page, click "Add Table"
   - **Menu Items**: Go to Menu page, click "Add Menu Item"
6. Share your QR code with customers

### For Customers:

1. Scan the QR code (or visit `http://localhost:3000/[qrCode]` where qrCode is from admin profile)
2. Enter your name and phone number
3. Browse menu and add items to cart
4. Select a table
5. Place your order
6. View order history in Profile

## Troubleshooting

### Backend won't start:
- Check if MongoDB is running (if using local)
- Verify `.env` file exists and has correct MongoDB URI
- Check if port 5000 is already in use

### Frontend won't start:
- Check if port 3000 is already in use
- Verify `.env.local` file exists
- Make sure backend is running first

### MongoDB connection error:
- Verify MongoDB is running (local) or connection string is correct (Atlas)
- Check if MongoDB URI in `.env` is correct
- For Atlas: Make sure your IP is whitelisted

### API errors:
- Make sure backend is running on port 5000
- Check browser console for errors
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`

## Development Commands

**Backend:**
```bash
cd backend
npm run dev    # Development with auto-reload
npm start      # Production mode
```

**Frontend:**
```bash
cd frontend
npm run dev    # Development server
npm run build  # Build for production
npm start      # Production server
```

## Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Update `FRONTEND_URL` to your production URL
3. Update `NEXT_PUBLIC_API_URL` to your production API URL
4. Build frontend: `cd frontend && npm run build`
5. Start both servers in production mode


