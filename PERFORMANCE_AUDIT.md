# Performance Audit

**Date:** 2026-06-26

---

## Database Performance

### Existing Indexes ✅

The performance migration `2026_06_18_200001_add_performance_indexes` added:

| Table | Index | Covers |
|---|---|---|
| bookings | `(booking_date, status)` | Date-range + status filter queries |
| bookings | `(hall_id, booking_date)` | Hall availability check |
| bookings | `(user_id, status)` | User booking list |
| bookings | `created_at` | Pagination ordering |
| booking_approvals | `(booking_id, step_level, status)` | Approval step lookup |
| halls | `status` | Active hall filtering |
| visitors | `(booking_id, status)` | Visitor check by booking |
| audit_logs | `(module, action)` | Audit log filtering |
| resources | `code` UNIQUE | Resource lookup by code |
| holidays | `date` UNIQUE | Holiday date lookup |

### Missing Indexes ⚠️

```sql
-- department_id on bookings (GROUP BY in reports)
ALTER TABLE bookings ADD INDEX idx_bookings_department (department_id);

-- booking_number unique index (see C-07 in GAP_ANALYSIS)
ALTER TABLE bookings ADD UNIQUE INDEX uq_booking_number (booking_number);

-- user_id on bookings (calendar queries for non-admin users)
-- Already covered by (user_id, status) composite — OK for most queries

-- catering_orders.booking_id (catering order lookup by booking)
ALTER TABLE catering_orders ADD INDEX idx_catering_booking (booking_id);

-- booking_resources.booking_id (resource lookup by booking)  
ALTER TABLE booking_resources ADD INDEX idx_booking_resources_booking (booking_id);

-- pages.slug (page builder lookup by slug)
ALTER TABLE pages ADD INDEX idx_pages_slug (slug);
```

---

## Query Analysis

### ✅ Good — N+1 Prevented

`BookingService::list()` eager loads:
```php
Booking::with(['hall', 'user', 'department', 'approvals.approver'])
```

`BookingController::show()` eager loads nested relations:
```php
$booking->load(['hall.facilities', 'user', 'department', 'approvals.approver', 'attendees', 'visitors', 'cateringOrder.items.menu', 'resources.resource'])
```

### ⚠️ Potential N+1 Issues

**`CalendarPage` / `BookingController::calendar`:**
The map callback accesses `$b->hall->name` and `$b->user->name`. These ARE eager loaded via `->with(['hall','user'])` so N+1 is avoided. However, `->get()` with no LIMIT loads all records in the date range into memory.

**`ApprovalService::notifyApprovers`:**
```php
User::role($roleName)->each(function (User $approver) use ($booking) {
    $approver->notify(new ApprovalRequiredNotification($booking));
});
```
Each notification is sent synchronously in a loop. With 50 approvers, this delays the API response by 50× email send time.
**Fix:** Use `->chunk(100)` or implement `ShouldQueue` on the notification class.

**`BookingService::createRecurring` loop:**
Approval initiation inside loop = N queries per recurring instance. 52-week recurring = 52 separate approval workflow queries.

---

## Cache Opportunities

### Currently Cached ✅
- Dashboard summary per user: `Cache::forget("dashboard_summary_{$booking->user_id}")`
- Booking number generation: `Cache::lock("booking_number_{$yearMonth}")`
- Branding settings: `GET /branding/public` should be cached (not verified without reading BrandingController)

### Missing Cache ⚠️

| Data | Cache Key | TTL |
|---|---|---|
| Default approval workflow | `default_approval_workflow` | 5 min |
| Active holidays list | `active_holidays` | 24 hours |
| Hall list (no changes) | `halls_active` | 5 min |
| Role permissions list | `role_permissions_{role_id}` | 10 min |
| Branding public config | `branding_public` | 10 min |
| Module active states | `modules_active` | 5 min |

```php
// Example fix in ApprovalService:
$workflow = Cache::remember('default_approval_workflow', 300, fn() =>
    ApprovalWorkflow::with('steps')
        ->where('is_default', true)
        ->where('is_active', true)
        ->first()
);
```

---

## Frontend Performance

### Bundle Analysis

**Dependencies flagged:**
- `@mui/material` (~200KB gzipped) — appears unused if Radix/Tailwind is the primary UI library
- `react-toastify` + `react-hot-toast` — duplicate toast libraries (~30KB combined)
- `react-icons` + `lucide-react` — duplicate icon libraries (~150KB combined if not tree-shaken)
- `@fullcalendar/*` — 5 packages totaling ~250KB gzipped; only used in CalendarPage

**Fix:** Dynamic import FullCalendar:
```js
// CalendarPage.jsx — already lazy loaded via AppRoutes, but also lazy-import the FC modules:
const FullCalendar = lazy(() => import('@fullcalendar/react'));
```

### Code Splitting ✅
All pages are lazy-loaded via `React.lazy()` in `AppRoutes.jsx`. This is correctly implemented.

### React Query Configuration ✅
TanStack Query v5 used throughout. `staleTime` and `placeholderData` patterns used in DashboardBuilder.

### Missing Optimizations

**No `React.memo` on heavy list components:**
`BookingList`, `HallList` re-render on any parent state change. Wrap with `React.memo` or use `useMemo` for expensive derived state.

**No virtual scrolling:**
For organizations with 1000+ bookings, the booking list will render all visible rows. Implement `react-window` or TanStack Virtual for large lists.

**Image optimization:**
Hall images uploaded via API are stored as-is. No WebP conversion, no thumbnail generation, no CDN URL.

---

## Redis Usage

### ✅ Configured
- Cache driver: Redis
- Session driver: Redis  
- Queue driver: Redis
- Rate limiting: Redis

### ⚠️ No Redis persistence configured

Docker Redis service runs without `--appendonly yes`. On container restart, all cached data (including session tokens) is lost.

**Fix:** Add to `docker-compose.yml`:
```yaml
redis:
  command: redis-server --appendonly yes
  volumes:
    - redis_data:/data
```

---

## Queue Worker Configuration

**Current:** 2 workers for `default` queue, 1 for `notifications`.

**Concern:** All notifications go to the `notifications` queue with only 1 worker. Under high booking load (100 concurrent bookings), the notification queue will back up.

**Fix:** Scale to 3 notification workers; add `--timeout=60 --memory=256` flags.

---

## Pagination

All list endpoints use `paginate($perPage)` with a max cap of 100. ✅  
Reports use `paginate($request->per_page ?? 20)` without the 100-cap — potential resource exhaustion on reports.  
**Fix:** Apply same `min(100, max(1, (int)$perPage))` pattern to ReportController.
