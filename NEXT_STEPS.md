# 🚀 Next Steps: Production Launch

Your application is now **Technically Secure** and **Feature Complete**. 
However, there is **one final security setting** that must be enabled manually in the Supabase Dashboard, as it cannot be changed via SQL/Code.

## 1. Fix "Leaked Password Protection Disabled" Warning
This warning appears because Supabase recommends checking new passwords against a database of known leaked passwords (HaveIBeenPwned).

**Instructions:**
1. Go to your **Supabase Dashboard**.
2. Click on **Authentication** (Icon on the left).
3. Click on **Configuration** (under Policies) or **Security** (depending on UI version).
4. Look for the **"Password Protection"** section.
5. Toggle **ON**: `Enable Leaked Password Protection`.
6. Click **Save**.

_Once done, the warning in the "Security Advisor" will disappear._

## 2. Verify Email Templates
Since we are using "Email Confirmation" for Admins:
1. Go to **Authentication** -> **Email Templates**.
2. Customize the "Confirm Your Signup" email to match your brand (Sniper FX Gold).
3. Ensure the `{{ .ConfirmationURL }}` is present.

## 3. Deployment
You are ready to deploy!
- **Vercel / Netlify**: Connect your GitHub repo.
- **Environment Variables**: Copy your `.env` values to the hosting provider's environment variables.
- **Build Command**: `yarn build`
- **Output Directory**: `dist`

---
**Status**: ✅ Ready for Production (v18.0.0)
