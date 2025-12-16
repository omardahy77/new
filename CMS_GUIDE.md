# 🛠️ Sniper FX CMS Guide

Your new Admin Dashboard is now fully equipped to manage the entire platform.

## 1. CMS (Content Management)
Go to **Dashboard > CMS** to edit:
- **General**: Site Name, Logo.
- **Hero Section**: The big title and description on the home page.
- **Social Links**: Add/Remove links for WhatsApp, Telegram, etc.
- **Features**: Toggle "Coming Soon", "Stats", or "Registration" ON/OFF.
- **Content**: Edit "About Us", "Contact Us", and "Footer" texts in both Arabic and English.

> **Note:** Changes are saved immediately to the database but might require a page refresh for you to see them if you are on the same page.

## 2. User Management
Go to **Dashboard > Users** to:
- **Approve Users**: Click "Activate" (تفعيل) to allow a pending user to log in.
- **Delete Users**: Click "Delete" (حذف) to **permanently** remove a user from the database. This action cannot be undone.
- **Enroll Users**: Click "Unlock Course" (فتح كورس) to give a specific user access to a paid course.

## 3. Course Management
Go to **Dashboard > Courses** to:
- **Add Course**: Create new courses.
- **Edit Course**: Change titles, descriptions, or toggle "Paid/Free" status.
- **Delete Course**: Remove courses.

## 4. Security
- The "Delete User" function is now secured via a custom database function (RPC).
- Only Admins can access the dashboard.
