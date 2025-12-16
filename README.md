# Sniper FX Gold - Production Edition 🏆

The #1 Arab platform for professional Gold & Forex trading education. 
**Version 18.3.0-GOLD (Final Production Release)**

## 🌟 System Status: **FULLY OPERATIONAL**
- **Security**: All database functions are locked down (Search Path Fixed).
- **Performance**: Turbo Mode Active (0ms load times for returning users).
- **Stability**: Infinite Recursion, Login Loops, and Trigger Crashes eliminated.

## 🚀 Key Features

### 1. ⚡ Turbo Performance
- **Instant Load**: Returning users see content in 0ms via `localStorage` caching.
- **Smart Fetching**: Data updates silently in the background (Stale-While-Revalidate).
- **Optimized DB**: Custom SQL indexes for lightning-fast queries.

### 2. 🛡️ Enterprise Security
- **Secure RPCs**: All backend functions run in a sandboxed `search_path`.
- **Bulletproof Login**: Distinguishes between Wrong Password, Banned, and Pending users.
- **Role-Based Access**: Strict separation between `student` and `admin`.

### 3. 👑 Super Admin Dashboard
- **CMS 2.0**: Edit ALL text (Arabic/English) and toggle features.
- **System Health**: Real-time indicator of database connection and API status.
- **User Management**: Search, Approve, Delete, and Enroll users in VIP courses.
- **Security Center**: Built-in tool to verify system integrity.

## 🛠️ Quick Start

### 1. Installation
```bash
yarn install
```

### 2. Development
```bash
yarn run dev
```

### 3. Admin Credentials
- **User**: `admin@sniperfx.com`
- **Pass**: `Hamza0100@`

## ⚠️ Final Manual Step
To clear the last security warning in Supabase:
1. Go to your **Admin Dashboard** (`/admin`).
2. Click **"Security Audit"**.
3. Click **"Enable Now"** next to "Leaked Password Protection".
4. Enable the toggle in the Supabase Dashboard.

## 📂 Project Structure
- `/src/pages/AdminDashboard.tsx`: The command center.
- `/src/context/StoreProvider.tsx`: The brain (Caching & State).
- `/supabase/migrations`: Database schema & optimization scripts.

## 📄 License
Private Property of Sniper FX Gold.
