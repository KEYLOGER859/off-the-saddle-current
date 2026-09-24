import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Replace, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, mediaUrl } from './api';

export const ImageManager = ({ images, onChange, onUploaded, onBusy, disabled }) => {
  const fileRef = useRef(null), replaceRef = useRef(null), replaceId = useRef(null);
  const [uploading, setUploading] = useState(false), [error, setError] = useState('');
  const upload = async (event, replace = false) => {
    const files = [...event.target.files]; event.target.value = '';
    if (!files.length) return;
    if (files.length > 8 || (!replace && images.length + files.length > 20)) { setError('Upload up to 8 photographs at once, with 20 per product.'); return; }
    if (files.some((file) => file.size > 10 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) { setError('Use JPEG, PNG or WebP files of up to 10 MB each.'); return; }
    setError(''); setUploading(true); onBusy(true);
    const body = new FormData(); files.forEach((file) => body.append('files', file));
    try {
      const data = await api('/admin/images', { method: 'POST', body });
      const additions = data.images.map((image) => ({ ...image, alt: '', caption: '' }));
      onUploaded(additions.map((image) => image.id));
      onChange(replace ? images.map((image) => image.id === replaceId.current ? additions[0] : image) : [...images, ...additions]);
    } catch (err) { setError(err.message); } finally { setUploading(false); onBusy(false); }
  };
  const move = (index, direction) => { const next = [...images]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; onChange(next); };
  const changeText = (id, field, text) => onChange(images.map((image) => image.id === id ? { ...image, [field]: text } : image));
  return <section className="admin-image-manager" data-testid="admin-image-manager">
    <div className="admin-section-heading"><h2>Photographs</h2><span data-testid="admin-image-count">{images.length} / 20</span></div>
    <input type="file" ref={fileRef} multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e)} hidden data-testid="admin-image-upload-input" />
    <input type="file" ref={replaceRef} accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e, true)} hidden data-testid="admin-image-replace-input" />
    <Button type="button" variant="outline" className="admin-upload-button" onClick={() => fileRef.current.click()} disabled={disabled || uploading || images.length >= 20} data-testid="admin-upload-images"><ImagePlus size={18} />{uploading ? 'Uploading photographs…' : 'Upload photographs'}</Button>
    {error && <p className="admin-error" role="alert" data-testid="admin-image-error">{error}</p>}
    <p className="admin-muted admin-image-hint">JPEG, PNG or WebP · up to 10 MB each. The first photograph is the cover.</p>
    <div className="admin-image-list">
      {images.map((image, index) => <div key={image.id} className="admin-image-item" data-testid={`admin-image-${image.id}`}>
        <div className="admin-image-preview"><img src={mediaUrl(image.url)} alt={image.alt || `Product photograph ${index + 1}`} data-testid={`admin-image-preview-${image.id}`} /><span>{index === 0 ? 'Cover' : String(index + 1).padStart(2, '0')}</span></div>
        <div className="admin-image-tools">
          <Button type="button" variant="ghost" size="icon" title="Move earlier" aria-label="Move image earlier" disabled={disabled || uploading || index === 0} onClick={() => move(index, -1)} data-testid={`admin-image-earlier-${image.id}`}><ArrowLeft size={15} /></Button>
          <Button type="button" variant="ghost" size="icon" title="Move later" aria-label="Move image later" disabled={disabled || uploading || index === images.length - 1} onClick={() => move(index, 1)} data-testid={`admin-image-later-${image.id}`}><ArrowRight size={15} /></Button>
          <Button type="button" variant="ghost" size="icon" title="Replace photograph" aria-label="Replace photograph" disabled={disabled || uploading} onClick={() => { replaceId.current = image.id; replaceRef.current.click(); }} data-testid={`admin-image-replace-${image.id}`}><Replace size={15} /></Button>
          <Button type="button" variant="ghost" size="icon" title="Remove photograph" aria-label="Remove photograph" disabled={disabled || uploading} onClick={() => onChange(images.filter((item) => item.id !== image.id))} data-testid={`admin-image-remove-${image.id}`}><Trash2 size={15} /></Button>
        </div>
        <Input value={image.alt || ''} onChange={(e) => changeText(image.id, 'alt', e.target.value)} maxLength={300} placeholder="Alternative text" aria-label={`Alternative text for photograph ${index + 1}`} disabled={disabled || uploading} data-testid={`admin-image-alt-${image.id}`} />
        <Input value={image.caption || ''} onChange={(e) => changeText(image.id, 'caption', e.target.value)} maxLength={500} placeholder="Caption (optional)" aria-label={`Caption for photograph ${index + 1}`} disabled={disabled || uploading} data-testid={`admin-image-caption-${image.id}`} />
      </div>)}
    </div>
  </section>;
};