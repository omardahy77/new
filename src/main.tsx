import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global Safety Net: Prevents unhandled async errors from crashing the app white
window.addEventListener('unhandledrejection', (event) => {
  console.warn('⚠️ Global Async Error Caught (Auto-Handled):', event.reason);
  // Prevent default browser error overlay
  event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
