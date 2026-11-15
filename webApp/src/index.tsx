import React from 'react';
import ReactDOM from 'react-dom/client';
import { InvoiceDashboard } from './components/Dashboard/InvoiceDashboard';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <InvoiceDashboard />
  </React.StrictMode>
);

// Register Service Worker for 100% Offline Capability & PWA Installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('Service Worker registered with scope: ', registration.scope);
      },
      (err) => {
        console.error('Service Worker registration failed: ', err);
      }
    );
  });
}
