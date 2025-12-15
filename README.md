# Sniper FX Gold - Ultimate Edition 🏆

The #1 Arab platform for professional Gold & Forex trading education. 
**Version 4.0.0 (Ultimate Rebuild)**

## 🌟 System Status: **OPERATIONAL**
- **Architecture**: Single-Page Application (SPA) with React & Supabase.
- **Database**: PostgreSQL with Row Level Security (RLS).
- **Security**: Strict Role-Based Access Control (RBAC).

## 🚀 Key Features (Ultimate Edition)

### 1. Advanced Course Management
- **Free Courses**: Visible to all registered users.
- **Paid (VIP) Courses**: **Hidden** from students by default. Only visible after manual enrollment by Admin.
- **Content Protection**: Video links and lesson details are secured.

### 2. Super Admin Dashboard
- **CMS**: Edit website text (Hero, About, Contact) directly from the dashboard.
- **User Management**: Search users, approve accounts, and **Enroll** them in paid courses.
- **Course Builder**: Create/Edit courses and toggle "Is Paid" status.

### 3. Student Experience
- **My Learning**: Dedicated section for enrolled courses.
- **Progress Tracking**: Auto-save video progress.
- **Responsive Player**: Custom video player with subtitle support.

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

## 📂 Project Structure
- `/src/pages/AdminDashboard.tsx`: The command center.
- `/src/context/StoreProvider.tsx`: Handles the logic for hiding/showing paid courses.
- `/supabase/migrations`: Database schema definitions.

## 📄 License
Private Property of Sniper FX Gold.
