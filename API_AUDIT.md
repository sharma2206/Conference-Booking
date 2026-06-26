# API Audit

**Date:** 2026-06-26

---

## REST Compliance

| Principle | Status | Issues |
|---|---|---|
| Resource naming (nouns) | ✅ | `/bookings`, `/halls`, `/users` |
| Correct HTTP methods | ⚠️ | Two cancel endpoints (POST + DELETE) for same action |
| HTTP status codes | ⚠️ | Most use 200/201/422; 404 not consistently returned |
| Nested resources | ✅ | `/bookings/{booking}/approve`, `/halls/{hall}/availability` |
| Consistent response envelope | ⚠️ | Mix of `{data: [...]}` and raw paginator |

---

## Response Format Consistency

### ✅ Good Formats
```json
// Resource response (BookingController::store)
{"data": { BookingResource }}

// Paginated list (BookingController::index)
{"data": [...], "links": {...}, "meta": {...}}  // Laravel paginator
```

### ⚠️ Inconsistent Formats

```json
// DashboardController returns raw arrays (no data wrapper)
{"summary": {...}}

// ReportController returns raw paginator without wrapper
// (standard Laravel paginator object returned directly)

// CalendarController
{"data": [...]}  // Correct

// BrandingController
{"data": {"general": {...}, "colors": {...}}}  // Grouped format, different from resource format
```

**Fix:** Standardize all responses to `{"data": ..., "meta": ..., "message": ...}` envelope.

---

## Pagination

| Endpoint | Paginated | Cap | Notes |
|---|---|---|---|
| GET /bookings | ✅ | 100 | Good |
| GET /halls | ✅ | Unknown | Need to verify |
| GET /users | ✅ | Unknown | Need to verify |
| GET /reports/bookings | ✅ | None | Missing per_page cap |
| GET /bookings/calendar | ❌ | None | Returns all in range |
| GET /visitors | ✅ | Unknown | |
| GET /audit/logs | ✅ | Unknown | |

---

## Filtering & Sorting

### ✅ Implemented
- `GET /bookings?status=approved&hall_id=1&date_from=2026-01-01`
- `GET /reports/bookings?date_from=&date_to=&status=&hall_id=&department_id=`

### ❌ Missing
- No sorting parameter on any endpoint (`?sort=booking_date&direction=asc`)
- No global search endpoint
- No field selection (`?fields=id,title,status`)

---

## API Versioning

**None.** All routes at `/api/` with no version prefix.

**Recommended:**
```php
// routes/api.php — wrap in version prefix
Route::prefix('v1')->group(function() {
    // all existing routes
});
```

---

## Rate Limiting

| Route Group | Limit | Config |
|---|---|---|
| `throttle:auth` | 5 req/min | Login, register, forgot-password |
| `throttle:api` | 60 req/min | All authenticated routes |

**Issue:** 60 req/min applies to ALL authenticated routes equally. A calendar page refresh loop (polling) could consume the quota. Separate limits for read vs. write would be better.

**Issue:** Rate limit response returns 429 with Laravel default body. Should return structured JSON:
```json
{"error": "rate_limit_exceeded", "retry_after": 60, "message": "Too many requests"}
```

---

## Error Handling

### ✅ Good
- `ValidationException` returns 422 with field errors
- `AuthorizationException` returns 403
- Route model binding 404 on not found

### ⚠️ Missing
- No global exception handler returning JSON for all routes
- 500 errors return HTML error page if `APP_DEBUG=false` in some configurations
- No `error_code` field for client-side programmatic handling

**Fix — `bootstrap/app.php`:**
```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (\Throwable $e, Request $request) {
        if ($request->expectsJson()) {
            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
            return response()->json([
                'message' => $e->getMessage(),
                'error_code' => class_basename($e),
            ], $status);
        }
    });
})
```

---

## Swagger / OpenAPI Documentation

**Status: ❌ Not implemented**

`darkaonline/l5-swagger 11.1` is installed but no `@OA\` annotations exist in any controller. The `/api/documentation` endpoint likely returns an empty spec.

**Impact:** API consumers (mobile apps, integrations) have no contract. Onboarding new developers requires reading source code.

**Effort:** ~3 days to annotate all controllers with OpenAPI annotations.

---

## Endpoint Audit

### Authentication
| Endpoint | Method | Auth | Status |
|---|---|---|---|
| /auth/login | POST | None | ✅ |
| /auth/register | POST | None | ✅ (open — see C-03) |
| /auth/forgot-password | POST | None | ✅ |
| /auth/reset-password | POST | None | ✅ |
| /auth/me | GET | JWT | ✅ |
| /auth/logout | POST | JWT | ✅ |
| /auth/refresh | POST | JWT | ✅ |
| /auth/2fa/enable | POST | JWT | ✅ |
| /auth/2fa/disable | POST | JWT | ✅ |

### Bookings
| Endpoint | Method | Permission | Status |
|---|---|---|---|
| /bookings | GET | booking.view | ✅ |
| /bookings/calendar | GET | booking.view | ⚠️ Unbounded |
| /bookings/{id} | GET | booking.view | ✅ |
| /bookings | POST | booking.create | ✅ |
| /bookings/recurring | POST | booking.create | ✅ |
| /bookings/{id} | PUT | booking.edit | ✅ |
| /bookings/{id}/cancel | POST | booking.cancel | ✅ |
| /bookings/{id} | DELETE | booking.cancel | ⚠️ Duplicate |
| /bookings/{id}/approve | POST | booking.approve | ✅ |
| /bookings/{id}/reject | POST | booking.approve | ✅ |

### Branding
| Endpoint | Method | Permission | Status |
|---|---|---|---|
| /branding/public | GET | None | ✅ |
| /branding | GET | settings.view | ✅ |
| /branding | POST | settings.update | ✅ |
| /branding/upload | POST | settings.update | ✅ |
| /themes | GET | settings.view | ✅ |
| /themes/{id}/activate | POST | settings.update | ✅ |
| /menus | GET | settings.view | ✅ |
| /menus | POST | settings.update | ✅ |
| /modules/{id}/toggle | POST | settings.update | ✅ |

---

## Missing API Endpoints

| Feature | Endpoint Needed | Priority |
|---|---|---|
| Hall availability check (before submit) | GET /halls/{hall}/check-availability?date=&start=&end= | High |
| Booking waitlist join | POST /bookings/{id}/waitlist | Medium |
| Recurring booking modify-future | PUT /bookings/recurring/{id} | Medium |
| Hall block-out periods | POST/GET /halls/{hall}/blocks | Medium |
| User profile self-update | PUT /auth/profile | Medium |
| Bulk booking operations | POST /bookings/bulk-cancel | Low |
| API health (detailed) | GET /health/detailed | Low |
