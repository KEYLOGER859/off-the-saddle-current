import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Pencil, Plus, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, mediaUrl } from './api';
import { formatPrice, pad } from '@/data/products';

export default function ProductsPage() {
  const [search, setSearch] = useState(''), [term, setTerm] = useState(''), [status, setStatus] = useState('all'), [page, setPage] = useState(1);
  useEffect(() => { const timeout = setTimeout(() => { setTerm(search); setPage(1); }, 250); return () => clearTimeout(timeout); }, [search]);
  const query = useQuery({ queryKey: ['admin-products', term, status, page], queryFn: () => api(`/admin/products?page=${page}&search=${encodeURIComponent(term)}&status=${status}`), staleTime: 0 });
  const products = query.data?.items || [];
  return <section data-testid="admin-products-page">
    <div className="admin-page-title"><div><p className="admin-kicker">Catalogue</p><h1>Products</h1><p className="admin-muted" data-testid="admin-product-count">{query.data ? `${query.data.total} products` : 'Loading catalogue…'}</p></div><Button asChild className="admin-primary"><Link to="/admin/products/new" data-testid="admin-add-product"><Plus size={17} />Add product</Link></Button></div>
    <div className="admin-toolbar">
      <div className="admin-search"><Search size={17} /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product name or SKU" aria-label="Search products" data-testid="admin-product-search" /></div>
      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Publication status" data-testid="admin-status-filter"><option value="all">All products</option><option value="published">Published</option><option value="draft">Unpublished</option></select>
    </div>
    {query.isError ? <div className="admin-error" role="alert" data-testid="admin-products-error">{query.error.message}<Button variant="ghost" onClick={() => query.refetch()} data-testid="admin-products-retry">Retry</Button></div> : <div className="admin-table-wrap">
      <table className="admin-products-table" data-testid="admin-products-table"><thead><tr><th>Chronicle / Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th><th><span className="sr-only">Edit</span></th></tr></thead><tbody>
        {products.map((product) => <tr key={product.id} data-testid={`admin-product-row-${product.id}`}>
          <td><Link to={`/admin/products/${product.id}`} className="admin-product-name" data-testid={`admin-product-link-${product.id}`}>{product.images[0] ? <img src={mediaUrl(product.images[0].url)} alt={product.images[0].alt || product.name} /> : <div className="admin-no-image" aria-label="No product image" /> }<div><span className="admin-product-number">{pad(product.chronicle_number)}</span><strong>{product.name}</strong><small>{product.origin || 'Origin not set'}</small></div></Link></td>
          <td data-testid={`admin-product-sku-${product.id}`}>{product.sku}</td><td data-testid={`admin-product-price-${product.id}`}>{formatPrice(Number(product.price))}</td>
          <td data-testid={`admin-product-stock-${product.id}`}><span className={product.stock_quantity === 0 ? 'admin-stock-zero' : ''}>{product.stock_quantity}</span></td>
          <td><span className={`admin-status ${product.published ? 'is-published' : ''}`} data-testid={`admin-product-status-${product.id}`}>{product.published ? 'Published' : 'Unpublished'}</span></td>
          <td><Button asChild variant="ghost" size="icon"><Link to={`/admin/products/${product.id}`} aria-label={`Edit ${product.name}`} data-testid={`admin-edit-${product.id}`}><Pencil size={16} /></Link></Button></td>
        </tr>)}
      </tbody></table>
      {!products.length && <p className="admin-empty" data-testid="admin-product-empty">{query.isPending ? 'Loading products…' : 'No products match this view.'}</p>}
    </div>}
    <div className="admin-pagination"><Button variant="outline" disabled={page === 1 || query.isFetching} onClick={() => setPage(page - 1)} data-testid="admin-products-previous"><ArrowLeft size={15} />Previous</Button><span data-testid="admin-products-page-number">Page {page}</span><Button variant="outline" disabled={!query.data?.has_more || query.isFetching} onClick={() => setPage(page + 1)} data-testid="admin-products-next">Next<ArrowRight size={15} /></Button></div>
  </section>;
}