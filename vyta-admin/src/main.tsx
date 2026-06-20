import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

try {
  createRoot(rootEl).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  );
} catch (e) {
  rootEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#232f3e;color:white;font-family:sans-serif;padding:20px;text-align:center">
    <div><h1 style="font-size:24px;margin-bottom:8px">Failed to load</h1>
    <p style="color:#aaa;font-size:14px">${e instanceof Error ? e.message : 'Unknown error'}</p>
    <button onclick="location.reload()" style="margin-top:16px;padding:8px 16px;background:#ff9900;color:black;border:none;border-radius:4px;font-weight:bold;cursor:pointer">Reload</button></div>
  </div>`;
}
