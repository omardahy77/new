import { translations } from './translations';

type Language = 'ar' | 'en';

/**
 * Converts technical errors into professional, user-friendly messages.
 */
export const getErrorMessage = (error: any, lang: Language): string => {
  const message = error?.message || 'Unknown error';
  const status = error?.status || 0;

  // 1. LOGIN & AUTH ERRORS
  if (message.includes('Invalid login credentials') || message.includes('invalid_grant')) {
    return lang === 'ar' 
      ? 'معلومات الحساب خاطئة. يرجى التأكد من البريد الإلكتروني وكلمة المرور.' 
      : 'Invalid account info. Please check your credentials.';
  }

  // CUSTOM STATUS: PENDING
  if (message === 'ACCOUNT_PENDING') {
    return lang === 'ar'
      ? 'طلبك قيد المراجعة وانتظار قبوله من المشرف.'
      : 'Your request is under review, waiting for admin approval.';
  }

  // CUSTOM STATUS: BANNED
  if (message === 'ACCOUNT_BANNED') {
    return lang === 'ar'
      ? 'تم إيقاف هذا الحساب من قبل الإدارة.'
      : 'This account has been suspended by the admin.';
  }

  if (message === 'ACCOUNT_DELETED' || message.includes('User not found')) {
    return lang === 'ar'
      ? 'معلومات الحساب خاطئة.'
      : 'Invalid account info.';
  }

  if (message.includes('Email not confirmed')) {
    return lang === 'ar'
      ? 'البريد الإلكتروني غير مفعل. يرجى التحقق من بريدك الوارد.'
      : 'Email not confirmed. Please check your inbox.';
  }

  if (message.includes('User already registered') || message.includes('unique constraint')) {
    return lang === 'ar'
      ? 'هذا البريد الإلكتروني مسجل مسبقاً. حاول تسجيل الدخول.'
      : 'This email is already registered. Please login instead.';
  }

  if (message.includes('Password should be at least')) {
    return lang === 'ar'
      ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.'
      : 'Password must be at least 6 characters.';
  }

  // 2. NETWORK & SYSTEM ERRORS
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return lang === 'ar'
      ? 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.'
      : 'Connection failed. Please check your internet connection.';
  }

  if (status === 500) {
    return lang === 'ar'
      ? 'حدث خطأ غير متوقع في النظام. فريقنا يعمل على حله الآن.'
      : 'Unexpected system error. Our team is working on it.';
  }

  if (status === 429) {
    return lang === 'ar'
      ? 'تم تجاوز حد المحاولات. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.'
      : 'Too many requests. Please wait a moment before trying again.';
  }

  // 3. GENERIC FALLBACK
  return lang === 'ar'
    ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
    : 'An unexpected error occurred. Please try again.';
};
