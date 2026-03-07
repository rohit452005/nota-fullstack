import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import AppPage from './pages/AppPage';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e0c0a' }}>
      <div style={{ color: '#f5c842', fontSize: '28px', fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>nota<span style={{color:'#e8e0d4'}}>.</span></div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<RedirectIfAuth><AuthPage mode="login" /></RedirectIfAuth>} />
          <Route path="/signup" element={<RedirectIfAuth><AuthPage mode="signup" /></RedirectIfAuth>} />
          <Route path="/*" element={<RequireAuth><AppPage /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
