import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './context/Store';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Wrench, Loader2 } from 'lucide-react';

// Lazy Load Pages for Better Performance
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Courses = lazy(() => import('./pages/Courses').then(module => ({ default: module.Courses })));
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const Contact = lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })));
const CourseDetail = lazy(() => import('./pages/CourseDetail').then(module => ({ default: module.CourseDetail })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

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

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 text-gold-500">
    <Loader2 size={48} className="animate-spin mb-4" />
    <p className="text-lg font-bold animate-pulse">جاري التحميل...</p>
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactElement, adminOnly?: boolean }) => {
  const { user, loading } = useStore();
  if (loading) return <LoadingScreen />;
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

  if (loading) return <LoadingScreen />;

  // منطق وضع الصيانة
  if (siteSettings.maintenance_mode && user?.role !== 'admin') {
    if (location.pathname !== '/login') {
       return <MaintenanceScreen />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col text-white font-cairo bg-transparent">
      <Navbar />
      <main className="flex-grow w-full">
        <Suspense fallback={<LoadingScreen />}>
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
        </Suspense>
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
