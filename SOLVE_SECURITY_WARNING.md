# 🛡️ How to Fix: "Leaked Password Protection Disabled"

This security warning requires a **manual setting change** in your Supabase Dashboard. It cannot be fixed via code.

### ⏱️ Time Required: 30 Seconds

### 👣 Steps to Fix:

1.  **Open your Supabase Project Dashboard**:
    *   Go to: [https://supabase.com/dashboard/project/ioaddixwohaahtnnangb/auth/advanced](https://supabase.com/dashboard/project/ioaddixwohaahtnnangb/auth/advanced)
    *   *(Or click the "Security Center" button in your new Admin Dashboard)*

2.  **Locate the Security Section**:
    *   Scroll down to the **"Security"** section (usually near the bottom).

3.  **Enable the Setting**:
    *   Find **"Enable Leaked Password Protection"**.
    *   Toggle the switch to **ON** (Green).
    *   *Note: This feature checks new passwords against a database of known leaked passwords.*

4.  **Save Changes**:
    *   Click **"Save"** in the bottom right or top right corner if prompted.

### ✅ Verification
Once enabled, the warning in the "Security Advisor" panel will disappear after a few minutes.

---
**System Status:**
- **SQL Functions:** Secured ✅ (Fixed by previous migration)
- **RLS Policies:** Active ✅ (Fixed by previous migration)
- **Password Protection:** Pending Manual Fix ⚠️
