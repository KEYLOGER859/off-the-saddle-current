import { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminAuth } from './AuthContext';

export default function LoginPage() {
  const { login, notice } = useAdminAuth();
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await login(email, password); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <main className="admin-login" data-testid="admin-login-page">
    <div className="admin-login__identity"><img src="/logo.png" alt="OFF THE SADDLE" /><span>Studio administration</span></div>
    <form className="admin-login__form" onSubmit={submit}>
      <LockKeyhole size={22} strokeWidth={1.3} />
      <h1>Welcome back.</h1>
      <p className="admin-muted">Sign in to your private catalogue.</p>
      {notice && <p role="status" className="admin-notice" data-testid="admin-session-notice">{notice}</p>}
      {error && <p role="alert" className="admin-error" data-testid="admin-login-error">{error}</p>}
      <div className="admin-field"><Label htmlFor="admin-email">Email</Label><Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required data-testid="admin-login-email" /></div>
      <div className="admin-field"><Label htmlFor="admin-password">Password</Label><Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required data-testid="admin-login-password" /></div>
      <Button type="submit" disabled={busy} className="admin-primary" data-testid="admin-login-submit">{busy ? 'Signing in…' : 'Sign in'}<ArrowRight size={17} /></Button>
    </form>
    <span className="admin-login__foot">OFF THE SADDLE / PRIVATE ACCESS</span>
  </main>;
}