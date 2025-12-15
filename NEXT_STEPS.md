# 🏆 Sniper FX Gold - Ultimate Edition (User Manual)

Congratulations! Your platform is now fully rebuilt and operational. Here is how to manage your new system.

## 🔑 1. Login Credentials
- **URL**: `/login`
- **Email**: `admin@sniperfx.com`
- **Password**: `Hamza0100@`

---

## 📚 2. Managing Courses (Free vs. Paid)

### Creating a Paid Course (Hidden)
1. Go to **Dashboard** > **Courses Tab**.
2. Click **"Add Course"**.
3. Fill in the details.
4. **IMPORTANT**: Check the box **"Is this course Paid?"**.
   - **Result**: This course will be **HIDDEN** from all students. It will NOT appear in the "Courses" page for them.
   - It is only visible to You (Admin) and students you explicitly enroll.

### Creating a Free Course
1. Uncheck the "Is this course Paid?" box.
2. **Result**: This course will be visible to **everyone** (registered users).

---

## 👥 3. Enrolling Students (The "Manual Add" Feature)
You requested that paid courses be accessible *only* when you add a student manually. Here is how:

1. Go to **Dashboard** > **Users Tab**.
2. Find the student in the list (you can search by email).
3. Click the **"Unlock Course"** button next to their name.
4. Select the **Paid Course** you want to give them access to.
5. Click **Confirm**.
   - **Result**: The student can now see the course in their "My Learning" section on the Home page.

---

## 🎨 4. CMS (Content Management)
You can edit the website text without touching code.
1. Go to **Dashboard** > **CMS Tab**.
2. Edit the **Hero Title**, **Description**, or **Social Links**.
3. Click **Save**. The changes appear immediately on the Home page.

---

## 🛡️ 5. Troubleshooting
- **If you see a "500 Error"**: Run the `repair_kit.sql` in Supabase Dashboard.
- **If a student can't see a course**: Check if they are enrolled in the **Users Tab**.

**System Version**: v4.0.0 (Ultimate)
