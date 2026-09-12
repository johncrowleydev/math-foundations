import { useEffect, useState, type ReactNode } from 'react';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { initializeAuth, signIn, useAuth } from './auth';
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, ready } = useAuth();
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    initializeAuth();
  }, []);
  if (!ready)
    return (
      <div className="auth-page">
        <span className="spinner" aria-label="Checking sign-in" />
      </div>
    );
  if (session) return children;
  return (
    <main className="auth-page">
      <form
        className="auth-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await signIn(email, password);
            setPassword('');
          } catch (e) {
            setError(
              e instanceof Error ? e.message : 'Could not connect. Check your internet connection.',
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="brand">
          <BookOpen size={25} />
          foundations
        </div>
        <h1>Sign in</h1>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <div className="password-field">
            <input
              type={visible ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="icon-button"
              aria-label={visible ? 'Hide password' : 'Show password'}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy && <span className="spinner" />}
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {!navigator.onLine && <p className="muted">Connect to the internet to sign in.</p>}
      </form>
    </main>
  );
}
