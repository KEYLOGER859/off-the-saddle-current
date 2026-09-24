import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { api, productPayload } from './api';
import { ProductFields } from './ProductFields';
import { ImageManager } from './ImageManager';

const empty = () => ({ name: '', chronicle_number: '', sku: '', price: '', stock_quantity: 0, origin: '', material: '', maker: '', description: '', published: false, images: [] });
export default function ProductEditor() {
  const { id } = useParams(), navigate = useNavigate(), cache = useQueryClient();
  const [value, setValue] = useState(empty), [dirty, setDirty] = useState(false), [saving, setSaving] = useState(false), [uploading, setUploading] = useState(false), [error, setError] = useState(''), [confirmDelete, setConfirmDelete] = useState(false);
  const uploaded = useRef(new Set()), originalImages = useRef([]);
  const query = useQuery({ queryKey: ['admin-product', id], queryFn: () => api(`/admin/products/${id}`), enabled: !!id, staleTime: 0 });
  useEffect(() => {
    if (query.data) { setValue(query.data); originalImages.current = query.data.images.map((image) => image.id); setDirty(false); }
    else if (!id) { setValue(empty()); originalImages.current = []; }
  }, [id, query.data]);
  useEffect(() => {
    const before = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [dirty]);
  useEffect(() => {
    const pending = uploaded.current;
    return () => { pending.forEach((imageId) => api(`/admin/images/${imageId}`, { method: 'DELETE' }).catch(() => {})); };
  }, []);
  const change = (field, next) => { setValue((current) => ({ ...current, [field]: next })); setDirty(true); };
  const cleanup = async (ids) => Promise.all(ids.map((imageId) => api(`/admin/images/${imageId}`, { method: 'DELETE' }).catch(() => {})));
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const result = await api(id ? `/admin/products/${id}` : '/admin/products', { method: id ? 'PUT' : 'POST', body: JSON.stringify(productPayload(value)) });
      const retained = new Set(result.images.map((image) => image.id));
      await cleanup([...new Set([...originalImages.current, ...uploaded.current])].filter((imageId) => !retained.has(imageId)));
      originalImages.current = [...retained]; uploaded.current.clear(); setValue(result); setDirty(false);
      cache.setQueryData(['admin-product', result.id], result);
      cache.invalidateQueries({ queryKey: ['admin-products'] }); cache.invalidateQueries({ queryKey: ['published-products'] });
      toast.success('Product saved');
      if (!id) navigate(`/admin/products/${result.id}`, { replace: true });
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const remove = async () => {
    setSaving(true); setError('');
    try {
      await api(`/admin/products/${id}?version=${value.version}`, { method: 'DELETE' });
      await cleanup(originalImages.current); cache.invalidateQueries({ queryKey: ['admin-products'] });
      setDirty(false); toast.success('Product deleted'); navigate('/admin');
    } catch (err) { setError(err.message); } finally { setSaving(false); setConfirmDelete(false); }
  };
  if (id && query.isPending) return <p role="status" data-testid="admin-product-loading">Loading product…</p>;
  if (query.isError) return <div role="alert" className="admin-error" data-testid="admin-product-load-error">{query.error.message}<Button onClick={() => query.refetch()} data-testid="admin-product-load-retry">Retry</Button></div>;
  return <form onSubmit={save} data-testid="admin-product-editor">
    <Button type="button" variant="ghost" className="admin-back" onClick={() => { if (!dirty || window.confirm('Discard unsaved changes?')) navigate('/admin'); }} data-testid="admin-product-back"><ArrowLeft size={16} />All products</Button>
    <div className="admin-page-title"><div><p className="admin-kicker">Catalogue / {id ? 'Edit product' : 'New product'}</p><h1>{id ? value.name : 'A new Chronicle'}</h1>{id && <p className="admin-muted" data-testid="admin-product-timestamps">Created {new Date(value.created_at).toLocaleDateString()} · Updated {new Date(value.updated_at).toLocaleString()}</p>}</div><Button type="submit" className="admin-primary" disabled={saving || uploading} data-testid="admin-product-save"><Save size={16} />{saving ? 'Saving…' : 'Save product'}</Button></div>
    {error && <div className="admin-error" role="alert" data-testid="admin-product-save-error">{error}</div>}
    <div className="admin-editor-grid"><ProductFields value={value} onChange={change} disabled={saving} /><ImageManager images={value.images} onChange={(images) => change('images', images)} onUploaded={(ids) => ids.forEach((imageId) => uploaded.current.add(imageId))} onBusy={setUploading} disabled={saving} /></div>
    {id && <div className="admin-danger-zone"><Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)} disabled={saving || uploading} data-testid="admin-delete-product"><Trash2 size={15} />Delete product</Button><span data-testid="admin-product-id">Product ID: {id}</span></div>}
    <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}><AlertDialogContent className="admin-dialog" data-testid="admin-delete-dialog"><AlertDialogHeader><AlertDialogTitle>Delete {value.name}?</AlertDialogTitle><AlertDialogDescription>This removes the product from the catalogue and deletes photographs that are no longer used. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel data-testid="admin-delete-cancel">Keep product</AlertDialogCancel><AlertDialogAction onClick={remove} data-testid="admin-delete-confirm">Delete product</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </form>;
}