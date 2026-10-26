import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SetPasswordPage } from './components/auth/SetPasswordPage';
import './index.css';

try {
  const cachedTheme = localStorage.getItem('udpvecsmart_site_theme');
  if (cachedTheme === 'mono' || cachedTheme === 'gray' || cachedTheme === 'province') {
    document.documentElement.classList.add(`theme-${cachedTheme}`);
  }
} catch {
  /* ใช้ localStorage ไม่ได้ก็ข้าม */
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {window.location.pathname.replace(/\/+$/, '') === '/set-password' ? <SetPasswordPage /> : <App />}
  </React.StrictMode>
);
