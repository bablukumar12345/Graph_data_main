import React from 'react';
import { createRoot } from 'react-dom/client';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './styles/app.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root && !root.innerHTML.trim()) {
    root.innerHTML = `<div class="runtime-error"><h1>App error</h1><p>${event.message}</p></div>`;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error(event.reason);
});

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        console.log("Service Worker Registered");
      })
      .catch((err) => {
        console.log("Service Worker Error:", err);
      });
  });
}
