import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Package, ShieldCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import { AdminAuthProvider, useAdminAuth } from './AuthContext';
import LoginPage from './LoginPage';
import ProductsPage from './ProductsPage';
import ProductEditor from './ProductEditor';
import SecurityPage from './SecurityPage';
import './admin.css';

const AdminConsole = () => {
  const { admin, checking, logout } = useAdminAuth();
  const location = useLocation();
  if (checking) return <div className="admin-loading" role="status" data-testid="admin-checking-session">Checking secure session…</div>;
  if (!admin) return <LoginPage />;
  return <>
    <header className="admin-header">
      <Link to="/admin" className="admin-brand" data-testid="admin-brand-link"><img src="/logo.png" alt="OFF THE SADDLE" /><span>Catalogue / Admin</span></Link>
      <div className="admin-header__right"><span data-testid="admin-signed-in-email">{admin.email}</span><Button variant="ghost" size="sm" onClick={() => logout().catch((e) => toast.error(e.message))} data-testid="admin-sign-out"><LogOut size={15} />Sign out</Button></div>
    </header>
    <div className="admin-workspace">
      <nav className="admin-nav" aria-label="Administration">
        <Link to="/admin" aria-current={!location.pathname.includes('security') ? 'page' : undefined} data-testid="admin-products-nav"><Package size={17} />Products</Link>
        <Link to="/admin/security" aria-current={location.pathname.includes('security') ? 'page' : undefined} data-testid="admin-security-nav"><ShieldCheck size={17} />Account security</Link>
      </nav>
      <main className="admin-main"><Routes>
        <Route path="/admin" element={<ProductsPage />} />
        <Route path="/admin/products/new" element={<ProductEditor />} />
        <Route path="/admin/products/:id" element={<ProductEditor />} />
        <Route path="/admin/security" element={<SecurityPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes></main>
    </div>
  </>;
};

export default function AdminApp() {
  return <div className="admin-app" data-testid="admin-app"><BrowserRouter><AdminAuthProvider><AdminConsole /><Toaster position="bottom-right" richColors /></AdminAuthProvider></BrowserRouter></div>;
}