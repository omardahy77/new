import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './context/Store';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Courses } from './pages/Courses';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CourseDetail } from './pages/CourseDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { Wrench } from 'lucide-react';

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="p-10 text-center text-red-500">حدث خطأ غير متوقع. يرجى تحديث الصفحة.</div>;
    return this.props.children;
  }
}

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactElement, adminOnly?: boolean }) => {
  const { user, loading } = useStore();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gold-500">جاري التحميل...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

const MaintenanceScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 text-white text-center p-4 relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
    <div className="w-24 h-24 bg-navy-900 rounded-full flex items-center justify-center mb-6 border border-gold-500/20 animate-pulse shadow-[0_0_30px_rgba(255,215,0,0.1)] relative z-10">
      <Wrench size={48} className="text-gold-500" />
    </div>
    <h1 className="text-4xl font-bold mb-4 text-white relative z-10">الموقع تحت الصيانة</h1>
    <p className="text-gray-400 max-w-md text-lg relative z-10">
      نقوم حالياً بإجراء تحسينات هامة لتقديم تجربة تداول أفضل.
      <br />سنعود للعمل قريباً جداً.
    </p>
  </div>
);

const AppContent = () => {
  const { siteSettings, user, loading } = useStore();
  const location = useLocation();

  // Security: Disable Right Click & Copy
  useEffect(() => {
    const handleContext = (e: Event) => e.preventDefault();
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'u' || e.key === 's')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContext);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('contextmenu', handleContext);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gold-500 bg-navy-950">جاري التحميل...</div>;

  // منطق وضع الصيانة:
  // إذا كان مفعلاً، والمستخدم الحالي ليس مشرفاً (أو غير مسجل دخول)، والصفحة الحالية ليست صفحة الدخول
  if (siteSettings.maintenance_mode && user?.role !== 'admin') {
    if (location.pathname !== '/login') {
       return <MaintenanceScreen />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col text-white font-cairo bg-transparent">
      <Navbar />
      <main className="flex-grow w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/course/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <Router>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </Router>
      </StoreProvider>
    </ToastProvider>
  );
}

export default App;
