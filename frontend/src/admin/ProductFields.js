import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const ProductFields = ({ value, onChange, disabled }) => {
  const field = (name, label, props = {}) => <div className="admin-field" key={name}><Label htmlFor={`product-${name}`}>{label}</Label><Input id={`product-${name}`} data-testid={`admin-field-${name}`} value={value[name]} onChange={(e) => onChange(name, e.target.value)} disabled={disabled} {...props} /></div>;
  return <div className="admin-product-fields">
    <section className="admin-form-section"><h2>Product identity</h2>
      {field('name', 'Product name', { required: true, maxLength: 160 })}
      <div className="admin-field-grid">{field('chronicle_number', 'Chronicle number', { type: 'number', min: 1, step: 1, placeholder: 'Assigned automatically' })}{field('sku', 'SKU', { required: true, maxLength: 80, pattern: '[a-zA-Z0-9._-]+' })}</div>
      <div className="admin-field"><Label htmlFor="product-description">Description</Label><Textarea id="product-description" data-testid="admin-field-description" rows={6} value={value.description} onChange={(e) => onChange('description', e.target.value)} maxLength={12000} disabled={disabled} /></div>
    </section>
    <section className="admin-form-section"><h2>Provenance</h2>
      {field('origin', 'Origin', { maxLength: 200 })}{field('material', 'Material', { maxLength: 300 })}{field('maker', 'Maker', { maxLength: 200 })}
    </section>
    <section className="admin-form-section"><h2>Price & inventory</h2><div className="admin-field-grid">{field('price', 'Price (INR)', { type: 'number', min: 0, step: '0.01', required: true })}{field('stock_quantity', 'Stock quantity', { type: 'number', min: 0, step: 1, required: true })}</div>
      <div className="admin-field"><Label htmlFor="product-published">Publication status</Label><select id="product-published" value={value.published ? 'published' : 'draft'} onChange={(e) => onChange('published', e.target.value === 'published')} disabled={disabled} data-testid="admin-field-published"><option value="draft">Unpublished</option><option value="published">Published</option></select></div>
    </section>
  </div>;
};