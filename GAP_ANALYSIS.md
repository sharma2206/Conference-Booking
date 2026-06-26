# Gap Analysis

**Date:** 2026-06-26  
**System:** Enterprise Conference Hall Booking System

---

## Critical Gaps

| # | Category | Issue | Affected Files | Business Impact | Technical Impact | Recommended Fix | Effort |
|---|---|---|---|---|---|---|---|
| C-01 | Booking Engine | No timezone support — all booking times are naive strings with no UTC conversion or timezone column | `app/Models/Booking.php`, `app/Services/BookingService.php`, `database/migrations/*bookings*` | Bookings created across timezones or during DST transitions will appear at wrong times; meeting collisions | Overlap detection uses raw string comparison; `Carbon::parse($startTime)` has no timezone context | Add `timezone` column to bookings table; store start/end as UTC; convert on read using user/hall timezone | 3 days |
| C-02 | Testing | Test coverage ~5% — only 7 test files covering 2 features, no booking conflict tests, no RBAC matrix, no API contract tests, no E2E | `tests/` entire directory | Regressions ship undetected; approval workflow bugs undetected; RBAC gaps invisible | Zero automated regression safety net | Write 95%+ coverage: PHPUnit feature tests for all controllers + RBAC matrix + E2E Playwright | 10 days |
| C-03 | Security | `/api/auth/register` is publicly accessible with no invitation gate, CAPTCHA, or email verification | `routes/api.php:37-41`, `app/Http/Controllers/Auth/AuthController.php` | Attackers create unlimited fake accounts; potential spam/abuse vector | No rate limit on individual IP for registration flow (throttle:auth is shared with login) | Add email domain whitelist OR invitation token system OR reCAPTCHA | 1 day |
| C-04 | Security | No HTTP security headers — missing X-Frame-Options, HSTS, CSP, X-Content-Type-Options, Referrer-Policy | `app/Http/Middleware/` (missing) | Clickjacking, MIME-sniffing, XSS attacks possible | Browser has no security hints | Add `SecurityHeaders` middleware and register in bootstrap/app.php | 2 hours |
| C-05 | Booking Engine | No buffer time between bookings — back-to-back bookings are possible with zero gap | `app/Models/Hall.php:59-76` | Room not ready for next meeting; equipment/cleaning setup time ignored | Overlap check uses strict `<` and `>` with no configurable gap | Add `buffer_minutes` setting; extend end_time by buffer in overlap check | 4 hours |
| C-06 | Booking Engine | Booking cancellation has no advance-notice policy — same-day and same-hour cancellation allowed | `app/Models/Booking.php:129-132`, `app/Services/BookingService.php:147-166` | No-shows undetected; hall appears available at last minute with no time to reallocate | `isCancellable()` only checks `$this->booking_date->isFuture()` | Add `min_cancellation_hours` setting; check `booking_date >= now()->addHours($minHours)` | 2 hours |
| C-07 | Database | Missing DB-level unique constraint on `booking_number` — only application-level cache lock | `database/migrations/2026_06_18_200001_add_performance_indexes.php` | Duplicate booking numbers possible if lock times out or Redis is unavailable | Duplicate keys cause report grouping errors | Add `$table->unique('booking_number')` migration | 30 min |
| C-08 | API | Calendar endpoint unbounded — loads ALL bookings in a date range with no pagination or record limit | `app/Http/Controllers/Booking/BookingController.php:71-101` | Large date ranges (e.g. full year) cause memory exhaustion; DOS possible | `->get()` with no limit; no date range max enforcement | Add max 90-day range check; add `->limit(2000)` safety cap | 1 hour |

---

## High Gaps

| # | Category | Issue | Affected Files | Business Impact | Technical Impact | Recommended Fix | Effort |
|---|---|---|---|---|---|---|---|
| H-01 | Security | No CORS configuration — any origin can call the API | `config/cors.php` (missing) | Cross-origin API abuse; CSRF from malicious sites | Laravel defaults allow all origins in some configurations | Add `config/cors.php` with allowed_origins whitelist; register `\Illuminate\Http\Middleware\HandleCors` | 1 hour |
| H-02 | Security | JWT secret not rotated strategy — no documented key rotation procedure | `config/jwt.php` | Leaked JWT secret means all tokens are permanently compromised | Single static `JWT_SECRET` in .env | Document rotation procedure; add `php artisan jwt:secret --force` to deployment runbook | 4 hours |
| H-03 | Security | File upload validation uses only MIME type; no file content scanning | `app/Http/Controllers/Branding/BrandingController.php`, `HallController.php` | Malicious file upload (PHP shell disguised as image) could lead to RCE | `mimes:jpeg,jpg,png,gif,webp,svg` check is client-MIME-spoofable | Add `finfo_file()` content-based MIME check; block SVG uploads (XSS vector); add file size per-type limits | 1 day |
| H-04 | Performance | N+1 on calendar query — `$b->hall->name` and `$b->user->name` accessed inside `->map()` but eager load is present; however `->get()` with no limit loads unbounded rows | `BookingController.php:81-99` | Slow calendar load for high-volume months | Memory spike on large datasets | Already has `->with(['hall','user'])` — fix is adding limit (see C-08) | Combined with C-08 |
| H-05 | Booking Engine | No waitlist system — when a hall is full/booked, users get a flat rejection with no queue option | `app/Services/BookingService.php` | Users must repeatedly retry; hall time wasted when primary booking cancels | No `waitlist_bookings` table or logic | Add `booking_waitlist` table; auto-promote on cancellation with notification | 2 days |
| H-06 | Booking Engine | Recurring bookings cannot be modified after creation — no "modify all future instances" operation | `app/Services/BookingService.php`, routes | Users must cancel all and recreate for any change | No `updateRecurring` method | Add `PUT /bookings/recurring/{recurring}` route and method in BookingService | 1 day |
| H-07 | Reporting | `exportPdf` uses `Pdf::loadView("reports.{$request->type}")` — if validation ever weakens, this is a path-traversal via view name | `app/Http/Controllers/Report/ReportController.php:121` | Potential arbitrary view rendering | Validation is `in:bookings,halls,departments` which is safe now, but fragile | Use explicit `match()` statement instead of string interpolation in view name | 30 min |
| H-08 | Reporting | `hallUtilization` uses DB::raw with inline `$month` and `$year` interpolation | `ReportController.php:57` | Validated as integer so not currently exploitable; but fragile | Raw SQL bypasses query builder binding | Rewrite as parameterized subquery using `addSelect` with Closure | 1 hour |
| H-09 | Frontend | Two toast libraries installed simultaneously (`react-hot-toast` and `react-toastify`) | `package.json` | Inconsistent UX; larger bundle | ~15KB wasted bundle | Remove one (prefer react-hot-toast, already used in Login.jsx) | 1 hour |
| H-10 | Frontend | Both `@mui/material` and `@radix-ui/*` installed — inconsistent component foundations | `package.json` | Visual inconsistency; ~200KB bundle overhead | Two component systems with different theming models | Audit usage and consolidate to Radix (already Tailwind-based) | 2 days |

---

## Medium Gaps

| # | Category | Issue | Affected Files | Recommended Fix | Effort |
|---|---|---|---|---|---|
| M-01 | Booking Engine | No maintenance/block-out periods for halls — no way to mark a hall unavailable for renovation/events | Missing `hall_blocks` table | Add `hall_blocks` table with `hall_id, start_datetime, end_datetime, reason`; check in `isAvailable()` | 1 day |
| M-02 | Booking Engine | No capacity check on `update` when hall changes | `BookingService::update` line 108 uses `$data['hall_id'] ?? $booking->hall_id` but only checks capacity if `participant_count` is in payload | Check capacity whenever `hall_id` changes even without participant_count change | 2 hours |
| M-03 | API | No API versioning — all routes under `/api/` with no version prefix | `routes/api.php` | Breaking changes affect all clients simultaneously | Add `/api/v1/` prefix and version negotiation header | 4 hours |
| M-04 | API | No Swagger/OpenAPI annotations — `l5-swagger` is installed but no `@OA\` doc blocks exist | All controllers | API consumers have no contract | Add OpenAPI annotations to all controllers; generate docs at `/api/documentation` | 3 days |
| M-05 | DevOps | No health check for queue workers in Docker — supervisor restarts but no alerting | `docker/supervisor/supervisord.conf` | Failed queue workers go unnoticed; notifications/reminders silently drop | Add queue monitor command + alerting | 1 day |
| M-06 | DevOps | No database backup strategy in Docker Compose | `docker-compose.yml` | Data loss on container failure | Add `mysqldump` cron or Rclone backup service to compose | 1 day |
| M-07 | Security | Password policy not enforced — `min:8` only, no complexity requirement | `app/Http/Requests/Auth/RegisterRequest.php` | Weak passwords; brute force risk | Add `Password::min(8)->mixedCase()->numbers()->symbols()` rule | 30 min |
| M-08 | Security | `auth('api')->user()` called in calendar without null check — can panic if middleware somehow passes unauthenticated | `BookingController.php:78` | 500 error if token edge case | Use `request()->user()` which is safer; already under auth middleware | 10 min |
| M-09 | Frontend | No error boundary around page-level components — JS crash takes down whole app | `resources/js/src/` | White screen of death on any unhandled error | Wrap each lazy-loaded route in `<ErrorBoundary>` | 1 hour |
| M-10 | Frontend | `BookingList`, `HallList` etc. have no empty state illustration | Multiple page files | Poor UX on fresh install | Add `EmptyState` component with contextual message and CTA | 2 hours |
| M-11 | Database | `department_id` on bookings is nullable — bookings can exist without a department; reports group by dept will have NULLs | `app/Models/Booking.php` | Report gaps | Either make required or handle NULL department in reports | 2 hours |

---

## Low Gaps

| # | Category | Issue | Recommended Fix | Effort |
|---|---|---|---|---|
| L-01 | Code | `concurrently` listed in production dependencies — should be devDependency | Move to devDependencies in package.json | 5 min |
| L-02 | Code | `BookingController::destroy` uses `request('reason', '')` helper instead of typed param | Inject `Request $request` and use `$request->input()` | 10 min |
| L-03 | API | Inconsistent HTTP methods — `DELETE /bookings/{booking}` and `POST /bookings/{booking}/cancel` both exist | Remove legacy DELETE route or document deprecation | 1 hour |
| L-04 | Frontend | `react-icons` AND `lucide-react` both installed — icon library duplication | Standardize on lucide-react | 2 hours |
| L-05 | Code | `Calendar` page uses `?` nullish approach for timezone but no timezone is ever set | Blocked by C-01 timezone fix | — |
| L-06 | DevOps | No `APP_ENV=production` guard on dangerous artisan commands in Docker | Add `APP_ENV` check to Dockerfile entrypoint | 30 min |
| L-07 | Frontend | No `<html lang="">` attribute in SPA HTML template | Set `lang="en"` in `resources/views/app.blade.php` | 5 min |
| L-08 | API | `monthly` report endpoint accepts `year` but no minimum validation (year 1970 would be valid) | Add `min:2020` validation | 5 min |
