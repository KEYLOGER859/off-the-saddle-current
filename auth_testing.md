# Private admin authentication verification

- No public registration endpoint or admin links on the storefront.
- Credentials exist only in server-side environment/bootstrap and the private test handoff. Owner email is pending; verification uses a temporary test administrator, disabled at completion.
- `admin_users.email` is unique; hashes use bcrypt `$2b$`. Database role AND enabled status are checked on every protected request.
- Login requires the configured Origin; five failures lock the IP/email key for 15 minutes. Check MongoDB `login_attempts` and TTL indexes.
- Access JWT expires after 15 minutes; refresh JWT expires after seven days and is rotated server-side. Cookies are Secure, HttpOnly, SameSite=None; no browser localStorage tokens.
- All state-changing admin endpoints require exact Origin and `X-CSRF-Token` returned by login/me; refresh uses strict Origin validation and its HttpOnly refresh cookie.
- Check unauthorized, disabled/non-admin, tampered/expired JWT, missing/wrong Origin and CSRF rejection, refresh rotation, logout revocation, password-change session revocation.
- Use the external URL from frontend/.env for curl/browser requests, cookie jars, and matching Origin headers. Never use localhost for browser auth verification.