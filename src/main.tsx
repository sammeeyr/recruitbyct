import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AppContent } from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  </React.StrictMode>
);

// Register Progressive Web App Service Worker for offline performance and push notifications
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        console.log('[Recruitbyct PWA] Service Worker registered:', reg.scope);
      })
      .catch(err => {
        console.warn('[Recruitbyct PWA] Service Worker registration failed:', err);
      });
  });
}
