import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const P = {
  bg: '#0e0c0a', surface: '#1a1713', border: '#2e2a24',
  accent: '#f5c842', text: '#e8e0d4', muted: '#7a7060', danger: '#ff5f5f',
};

export default function AuthPage({ mode }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) await login(email, password);
      else await signup(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: "'Syne', sans-serif", color: P.text, letterSpacing: '-0.03em' }}>
            nota<span style={{ color: P.accent }}>.</span>
          </div>
          <div style={{ color: P.muted, fontSize: '13px', marginTop: '6px' }}>AI-powered notes</div>
        </div>

        {/* Card */}
        <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: '20px', padding: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Syne', sans-serif", color: P.text, marginBottom: '8px' }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ color: P.muted, fontSize: '13px', marginBottom: '28px' }}>
            {isLogin ? 'Sign in to access your notes.' : 'Start capturing ideas beautifully.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!isLogin && (
              <div>
                <label style={{ fontSize: '12px', color: P.muted, display: 'block', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Name</label>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" required
                  style={{ width: '100%', padding: '12px 16px', background: P.bg, border: `1px solid ${P.border}`, borderRadius: '12px', color: P.text, fontSize: '14px', fontFamily: "'Syne', sans-serif", outline: 'none' }}
                />
              </div>
            )}
            <div>
              <label style={{ fontSize: '12px', color: P.muted, display: 'block', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                style={{ width: '100%', padding: '12px 16px', background: P.bg, border: `1px solid ${P.border}`, borderRadius: '12px', color: P.text, fontSize: '14px', fontFamily: "'Syne', sans-serif", outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: P.muted, display: 'block', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? '••••••••' : 'At least 8 characters'} required
                style={{ width: '100%', padding: '12px 16px', background: P.bg, border: `1px solid ${P.border}`, borderRadius: '12px', color: P.text, fontSize: '14px', fontFamily: "'Syne', sans-serif", outline: 'none' }}
              />
            </div>

            {error && (
              <div style={{ color: P.danger, fontSize: '13px', background: `${P.danger}15`, border: `1px solid ${P.danger}30`, borderRadius: '10px', padding: '10px 14px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ marginTop: '8px', padding: '14px', background: P.accent, color: '#0e0c0a', border: 'none', borderRadius: '12px', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, letterSpacing: '0.02em' }}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: P.muted, fontSize: '13px', marginTop: '20px' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link to={isLogin ? '/signup' : '/login'} style={{ color: P.accent, textDecoration: 'none', fontWeight: 700 }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
}
