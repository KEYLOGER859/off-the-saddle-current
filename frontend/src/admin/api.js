const BASE_URL = process.env.REACT_APP_BACKEND_URL;
if (!BASE_URL) throw new Error('REACT_APP_BACKEND_URL is required');
let csrf = '';
let refreshPromise;
export const setCsrf = (value) => { csrf = value || ''; };
export const mediaUrl = (path) => path?.startsWith('/api/') ? `${BASE_URL}${path}` : path;

const errorText = (detail) => Array.isArray(detail) ? detail.map((item) => item.msg).join('. ') : typeof detail === 'string' ? detail : 'The request could not be completed';

async function send(path, options) {
  const headers = { ...options.headers };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (csrf && options.method && options.method !== 'GET') headers['X-CSRF-Token'] = csrf;
  return fetch(`${BASE_URL}/api${path}`, { ...options, headers, credentials: 'include', cache: 'no-store' });
}

export async function api(path, options = {}, retry = true) {
  let response = await send(path, options);
  if (response.status === 401 && retry && !['/admin/auth/login', '/admin/auth/refresh'].includes(path)) {
    if (!refreshPromise) refreshPromise = api('/admin/auth/refresh', { method: 'POST' }, false)
      .then((data) => { setCsrf(data.csrf_token); return true; }).catch(() => false).finally(() => { refreshPromise = null; });
    if (await refreshPromise) response = await send(path, options);
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(errorText(data.detail));
    error.status = response.status;
    if (response.status === 401 && !path.startsWith('/admin/auth')) window.dispatchEvent(new Event('admin-session-expired'));
    throw error;
  }
  return data;
}

export const productPayload = (product) => ({
  name: product.name.trim(), chronicle_number: product.chronicle_number === '' ? null : Number(product.chronicle_number),
  sku: product.sku.trim(), price: String(product.price), stock_quantity: Number(product.stock_quantity),
  origin: product.origin, material: product.material, maker: product.maker || '', description: product.description,
  published: product.published, images: product.images.map(({ id, alt = '', caption = '' }) => ({ id, alt, caption })),
  ...(product.version ? { version: product.version } : {}),
});