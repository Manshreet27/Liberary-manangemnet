# Library Management System

A full-featured library management system built with **Next.js 14**, **MongoDB**, and **Tailwind CSS**.

## Features

- **Role-based access**: Super Admin, Admin, Receptionist
- **Multi-library support**: Super Admin manages all libraries
- **Member management**: Registration form with package assignment
- **Monthly & Yearly packages**
- **Biometric attendance sync**: Fetches from biometric device REST API
- **Auto WhatsApp alerts**: Sends reminders 5 days before package expiry (if fee unpaid)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.local` and fill in your values:
```
MONGODB_URI=mongodb://localhost:27017/library_management
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
BIOMETRIC_API_URL=http://your-biometric-device-ip/api
BIOMETRIC_API_KEY=your_key
```

### 3. Seed the database
```bash
npx ts-node --project tsconfig.json scripts/seed.ts
```
Default credentials:
- `superadmin@library.com` / `password123`
- `admin@library.com` / `password123`
- `receptionist@library.com` / `password123`

### 4. Run the app
```bash
npm run dev
```

### 5. WhatsApp Cron Job
Run the cron scheduler separately:
```bash
npx ts-node --project tsconfig.json scripts/cron.ts
```
Or call `POST /api/alerts` with header `x-cron-secret: <NEXTAUTH_SECRET>` from any external cron service (e.g., cron-job.org, AWS EventBridge).

## Biometric Integration

Each library has its own `biometricApiUrl` and `biometricApiKey`. The sync endpoint (`POST /api/attendance/sync`) calls:
```
GET {biometricApiUrl}/attendance/today
Authorization: Bearer {biometricApiKey}
```
Expected response format:
```json
[
  { "biometricId": "001", "checkIn": "2024-01-15T09:00:00Z", "checkOut": "2024-01-15T17:00:00Z" }
]
```
Members must have their `biometricId` set to match the device records.

## Role Permissions

| Feature | Super Admin | Admin | Receptionist |
|---|---|---|---|
| All Libraries | ✅ | ❌ | ❌ |
| Own Library | ✅ | ✅ | ✅ |
| Add Members | ✅ | ✅ | ✅ |
| Manage Packages | ✅ | ✅ | ❌ |
| Sync Biometric | ✅ | ✅ | ❌ |
| Create Admins | ✅ | ❌ | ❌ |
| Create Receptionists | ✅ | ✅ | ❌ |
