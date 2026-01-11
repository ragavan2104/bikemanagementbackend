# Bike Dealership Management System - Backend

A robust Node.js/Express backend for managing bike dealership operations with Firebase integration.

## Features

- 🔐 Firebase Authentication with role-based access control (Admin/Worker)
- 🗄️ Firestore database for bikes and sales management
- 📊 Analytics API for KPIs and monthly sales data
- 🔒 Secure API with JWT validation
- 📝 Request validation and error handling
- 🚀 TypeScript for type safety

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Firebase project created
- Firebase Admin SDK service account credentials

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure `.env` file with your Firebase credentials:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Copy the credentials to your `.env` file

### Running the Server

Development mode (with hot reload):
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## API Endpoints

### Bikes
- `POST /api/bikes` - Add new bike
- `GET /api/bikes` - Get all bikes (query: ?status=available|sold)
- `GET /api/bikes/:id` - Get bike by ID
- `PUT /api/bikes/:id` - Update bike
- `DELETE /api/bikes/:id` - Delete bike

### Sales
- `POST /api/sales/bike/:id/sold` - Mark bike as sold
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get sale by ID

### Analytics (Admin only)
- `GET /api/analytics/kpi` - Get KPI data
- `GET /api/analytics/monthly-sales` - Get monthly sales data

## Authentication

All API requests (except /health) require a Bearer token:
```
Authorization: Bearer <firebase-id-token>
```

## Database Collections

### bikes
- make, model, year, purchasePrice
- imageUrl, status (available/sold)
- addedBy, createdAt, updatedAt

### sales
- bikeId, bikeMake, bikeModel, bikeYear
- purchasePrice, salePrice, profit
- customerName, customerEmail, customerPhone
- soldBy, saleDate, createdAt

## Setting User Roles

Use Firebase Admin SDK or Firebase Console to set custom claims:
```javascript
admin.auth().setCustomUserClaims(uid, { role: 'admin' });
```
