import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from './api';
import { useAdminAuth } from './AuthContext';

export default function SecurityPage() {
  const { clear } = useAdminAuth();
  const [current, setCurrent] = useState(''), [next, setNext] = useState(''), [confirm, setConfirm] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (next !== confirm) { setError('The new passwords do not match.'); return; }
    setBusy(true);
    try { await api('/admin/auth/password', { method: 'POST', body: JSON.stringify({ current_password: current, new_password: next }) }); clear('Password changed. Sign in with your new password.'); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <section data-testid="admin-security-page"><div className="admin-page-title"><div><p className="admin-kicker">Private access</p><h1>Account security</h1></div></div><form className="admin-security-form" onSubmit={submit}>
    {error && <p className="admin-error" role="alert" data-testid="admin-password-error">{error}</p>}
    <div className="admin-field"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required data-testid="admin-current-password" /></div>
    <div className="admin-field"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} minLength={12} maxLength={72} required data-testid="admin-new-password" /></div>
    <div className="admin-field"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={12} maxLength={72} required data-testid="admin-confirm-password" /></div>
    <Button className="admin-primary" disabled={busy} data-testid="admin-change-password-submit">{busy ? 'Updating…' : 'Update password'}</Button>
  </form></section>;
}