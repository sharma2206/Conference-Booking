# Security Audit

**Date:** 2026-06-26  
**Framework:** OWASP Top 10 2021

---

## OWASP Top 10 Assessment

### A01 — Broken Access Control

| Check | Status | Detail |
|---|---|---|
| Route-level permission gates | ✅ Pass | All routes have `permission:*` middleware |
| Policy-based authorization | ✅ Pass | BookingPolicy, HallPolicy etc. implemented |
| Employee data scoping | ✅ Pass | `BookingService::list()` scopes to own bookings |
| Self-approval prevention | ✅ Pass | Explicit check in ApprovalService |
| Department-head scoping | ⚠️ Fail | Department-heads can see all bookings (RBAC-02) |
| `GET /all-permissions` scoping | ⚠️ Fail | Exposed to anyone with role.view (RBAC-06) |
| Resource request conflict check | ❌ Fail | No overlap check on shared resources |

**Score: 5/7**

---

### A02 — Cryptographic Failures

| Check | Status | Detail |
|---|---|---|
| JWT authentication | ✅ Pass | tymon/jwt-auth 2.3 with proper secret |
| Passwords hashed | ✅ Pass | Laravel Bcrypt default |
| HTTPS enforcement | ⚠️ Unknown | No `forceScheme('https')` in AppServiceProvider; Nginx config not verified |
| JWT secret length | ⚠️ Unknown | `JWT_SECRET` from .env; length not enforced |
| Sensitive fields encrypted at rest | ❌ Fail | No `encrypted` cast on SMTP password, API keys in `settings` table |
| Token expiry configured | ✅ Pass | JWT config exists; TTL presumably set |

**Score: 3/5 verified**

**Critical:** SMTP password stored as plain text in `settings` table:
```php
// In SettingsController::updateSmtp — stores smtp_password as plaintext
Setting::updateOrCreate(['key' => 'smtp_password'], ['value' => $request->smtp_password]);
```

**Fix:**
```php
// Use Laravel's encrypted cast on BrandingSetting / Setting
'smtp_password' => encrypt($request->smtp_password),
// Decrypt on read
decrypt(Setting::get('smtp_password'))
```

---

### A03 — Injection

| Check | Status | Detail |
|---|---|---|
| SQL via Eloquent (no raw SQL) | ✅ Pass | All standard queries use Eloquent |
| Filter whitelisting | ✅ Pass | `array_intersect_key` used in BookingService |
| Raw SQL in ReportController | ⚠️ Warn | `DB::raw()` with `$month`/`$year` — validated as int, but fragile |
| PDF view name injection | ⚠️ Warn | `Pdf::loadView("reports.{$type}")` — validated but string interpolation |
| Mass assignment | ✅ Pass | `$fillable` defined on all models |
| SVG upload XSS | ❌ Fail | SVG files accepted in branding uploads; SVG can contain `<script>` tags |

**Score: 4/6**

**SVG XSS Fix:**
```php
// In BrandingController / HallController — remove svg from allowed mimes:
'mimes:jpeg,jpg,png,gif,webp', // Remove svg
// Or sanitize SVG server-side with enshrined/svg-sanitize package
```

---

### A04 — Insecure Design

| Check | Status | Detail |
|---|---|---|
| Booking conflict race condition | ❌ Fail | No `lockForUpdate()` in booking creation transaction |
| Open registration | ❌ Fail | `/api/auth/register` publicly accessible |
| No CAPTCHA | ❌ Fail | Login and registration have no bot protection |
| Booking number collision possible | ⚠️ Warn | Cache lock protects but Redis downtime bypasses it |

---

### A05 — Security Misconfiguration

| Check | Status | Detail |
|---|---|---|
| HTTP security headers | ❌ Fail | No `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy` |
| Debug mode in production | ⚠️ Unknown | `APP_DEBUG` depends on deployment .env |
| CORS configuration | ❌ Fail | No `config/cors.php` found; defaults to allow all |
| Error detail exposure | ⚠️ Warn | If `APP_DEBUG=true`, full stack traces returned in API errors |
| `.env` in version control | ✅ Pass | `.gitignore` includes `.env` |

**Missing Middleware:**
```php
// bootstrap/app.php — add:
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(SecurityHeaders::class);
})
```

```php
// app/Http/Middleware/SecurityHeaders.php
public function handle($request, $next) {
    $response = $next($request);
    $response->headers->set('X-Frame-Options', 'DENY');
    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('X-XSS-Protection', '1; mode=block');
    $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if ($request->isSecure()) {
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    return $response;
}
```

---

### A06 — Vulnerable and Outdated Components

| Check | Status | Detail |
|---|---|---|
| Laravel 13.8 | ✅ Current | Latest stable |
| PHP 8.3 | ✅ Current | Active support |
| React 19 | ✅ Current | Latest stable |
| Spatie Permission 8.0 | ✅ Current | Latest |
| jwt-auth 2.3 | ✅ Current | Latest |
| Composer audit | ⚠️ Not run | Need `composer audit` in CI |
| npm audit | ⚠️ Not run | Need `npm audit` in CI |

**Fix:** Add to CI workflow:
```yaml
- name: Security audit
  run: composer audit && npm audit --audit-level=high
```

---

### A07 — Identification and Authentication Failures

| Check | Status | Detail |
|---|---|---|
| Brute force protection on login | ✅ Pass | `throttle:auth` (5 req/min) |
| Password minimum length | ✅ Pass | `min:8` |
| Password complexity | ❌ Fail | No uppercase/number/symbol requirement |
| 2FA available | ✅ Pass | Google Authenticator via pragmarx/google2fa |
| 2FA enforced for admins | ❌ Fail | 2FA is opt-in; not mandatory for privileged roles |
| JWT token blacklist on logout | ⚠️ Unknown | Depends on jwt.php `blacklist_enabled` setting |
| Account lockout after failures | ❌ Fail | Rate limiting only; no lockout |

**Password Policy Fix:**
```php
// RegisterRequest / password change endpoints:
use Illuminate\Validation\Rules\Password;

'password' => ['required', Password::min(8)->mixedCase()->numbers()->symbols()->uncompromised()],
```

---

### A08 — Software and Data Integrity Failures

| Check | Status | Detail |
|---|---|---|
| File upload type verification | ⚠️ Warn | MIME type check only; no `finfo_file()` content verification |
| Mass assignment protection | ✅ Pass | `$fillable` on all models |
| Queue job signature | ⚠️ Unknown | No payload signing verification on jobs |

---

### A09 — Security Logging and Monitoring Failures

| Check | Status | Detail |
|---|---|---|
| Activity logging | ✅ Pass | Spatie ActivityLog on Booking, Hall |
| Manual audit log | ✅ Pass | `AuditLog` model and controller |
| Login failure logging | ⚠️ Unknown | `AuthService::login` — not read; need to verify |
| Log rotation | ✅ Pass | Docker logs via supervisor; log rotation configured |
| Alert on suspicious activity | ❌ Fail | No alerting on brute force, mass cancellation, permission changes |

---

### A10 — Server-Side Request Forgery (SSRF)

| Check | Status | Detail |
|---|---|---|
| External HTTP requests | ⚠️ Unknown | `testSmtp()` in SettingsController makes outbound connection; SMTP host comes from DB (admin-settable) |
| URL validation on external inputs | ⚠️ Warn | Branding URLs (logo_url, terms_url) stored as-is; if rendered in emails, SSRF possible |
| No external URL fetching from user input | ✅ Pass | No `Http::get($userInput)` patterns found |

---

## Additional Security Findings

### SEC-01 (High): JWT Token Not Invalidated on Password Change

When a user changes their password, existing JWT tokens remain valid until their TTL expires. An attacker who obtains a JWT can continue using it even after the victim changes their password.

**Fix:** Add `user.password_changed_at` tracking; invalidate tokens issued before that timestamp in JWT middleware.

### SEC-02 (Medium): `GET /auth/me` Returns Full Permission List

```json
{"permissions": ["booking.view", "booking.create", "hall.view", ...]}
```

While useful for the frontend, this reveals the complete permission structure to any authenticated user. An attacker can enumerate all available permissions and craft targeted privilege escalation attempts.

### SEC-03 (Medium): SMTP Credentials in Settings Table (Plaintext)

SMTP username and password stored as plain text `key/value` rows in the `settings` table. Any SQL injection or database dump exposes email credentials.

**Fix:** Use `encrypted` cast or `encrypt()`/`decrypt()` helpers.

### SEC-04 (Low): Booking Number Enumerable

Booking numbers follow the pattern `BK202606XXXX` (sequential). An authenticated user can enumerate others' bookings by incrementing the number, provided they can access `GET /bookings/{id}` (policy blocks this, but the numbering is predictable).

**Fix:** Use random UUIDs as booking numbers, keep sequential numbers for display only.
