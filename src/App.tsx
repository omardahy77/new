import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './context/Store';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Wrench, Loader2, AlertTriangle, RefreshCcw, Trash2 } from 'lucide-react';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Courses = lazy(() => import('./pages/Courses').then(module => ({ default: module.Courses })));
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const Contact = lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })));
const CourseDetail = lazy(() => import('./pages/CourseDetail').then(module => ({ default: module.CourseDetail })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  
  handleReset = () => {
    // Clear all storage to remove any bad state causing the crash
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 text-white p-6 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                <AlertTriangle size={40} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-gray-400 mb-6 max-w-md">
                The application encountered an unexpected error. This might be due to a connection issue or cached data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => window.location.reload()} className="btn-gold px-8 py-3 flex items-center justify-center gap-2">
                    <RefreshCcw size={18} /> Refresh Page
                </button>
                <button onClick={this.handleReset} className="px-8 py-3 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors">
                    <Trash2 size={18} /> Clear Cache & Restart
                </button>
            </div>
        </div>
    );
    return this.props.children;
  }
}

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 text-gold-500">
    <div className="relative">
        <div className="w-16 h-16 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
        </div>
    </div>
    <p className="text-lg font-bold mt-4 animate-pulse tracking-widest">SNIPER FX</p>
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactElement, adminOnly?: boolean }) => {
  const { user, loading } = useStore();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

const MaintenanceScreen = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 text-white text-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      <div className="w-24 h-24 bg-navy-900 rounded-full flex items-center justify-center mb-6 border border-gold-500/20 animate-pulse shadow-[0_0_30px_rgba(255,215,0,0.1)] relative z-10">
        <Wrench size={48} className="text-gold-500" />
      </div>
      <h1 className="text-4xl font-bold mb-4 text-white relative z-10">{t('maintenance_title')}</h1>
      <p className="text-gray-400 max-w-md text-lg relative z-10">
        {t('maintenance_desc')}
      </p>
    </div>
  );
};

const AppContent = () => {
  const { siteSettings, user, loading } = useStore();
  const { dir } = useLanguage();
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

  if (siteSettings.maintenance_mode && user?.role !== 'admin') {
    if (location.pathname !== '/login') {
       return <MaintenanceScreen />;
    }
  }

  return (
    <div className={`min-h-screen flex flex-col text-white font-cairo bg-transparent ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
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
            {/* Catch all route for 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
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
        <LanguageProvider>
          <Router>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </Router>
        </LanguageProvider>
      </StoreProvider>
    </ToastProvider>
  );
}

export default App;
