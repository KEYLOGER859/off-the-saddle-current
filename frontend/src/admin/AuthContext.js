import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setCsrf } from './api';

const AuthContext = createContext(null);
export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState('');
  const adopt = useCallback((data) => { setAdmin(data.admin); setCsrf(data.csrf_token); setNotice(''); }, []);
  const clear = useCallback((message = '') => { setAdmin(null); setCsrf(''); setNotice(message); }, []);
  useEffect(() => {
    let active = true;
    api('/admin/auth/me').then((data) => { if (active) adopt(data); }).catch(() => {}).finally(() => { if (active) setChecking(false); });
    const expire = () => clear('Your session ended. Sign in again to continue.');
    window.addEventListener('admin-session-expired', expire);
    return () => { active = false; window.removeEventListener('admin-session-expired', expire); };
  }, [adopt, clear]);
  const login = async (email, password) => adopt(await api('/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }));
  const logout = async () => { await api('/admin/auth/logout', { method: 'POST' }); clear(); };
  return <AuthContext.Provider value={{ admin, checking, notice, login, logout, clear }}>{children}</AuthContext.Provider>;
};
export const useAdminAuth = () => useContext(AuthContext);