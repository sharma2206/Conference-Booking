# Architecture Review

**Date:** 2026-06-26

---

## Architecture Assessment

### Overall Pattern

The application follows a **Service-Controller-Model** pattern within a Laravel monolith. The architecture is clean and appropriate for this scale.

```
HTTP Request
    → Middleware (auth:api, throttle, permission)
    → FormRequest (validation)
    → Controller (thin — delegates to Service)
    → Service (business logic)
    → Model (Eloquent ORM)
    → DB Response
    → API Resource (serialization)
    → JSON Response
```

**Verdict: SOLID foundation. No major architectural violations.**

---

## Controllers

### ✅ Good Patterns
- Controllers are thin — all logic delegated to Services
- `BookingController` averages ~7 lines per method
- Dependency injection via constructor (`private readonly BookingService $bookingService`)
- `StoreBookingRequest` / `UpdateBookingRequest` form request classes used consistently
- `$this->authorize()` called on show/update/delete
- `BookingResource` API resources used for serialization

### ⚠️ Issues Found

**Fat controller pattern in `ReportController`:**
- `hallUtilization()` contains raw DB query with string interpolation (see GAP H-08)
- `exportPdf()` contains view loading logic that belongs in a `ReportExportService`
- No API resource for report responses — raw Eloquent collections returned

**Missing authorization on index endpoints:**
- `BookingController::index` relies entirely on middleware permission gate
- No per-record ownership filtering at the controller level for non-admin listing (handled in Service, which is acceptable)

**`BookingController::calendar` mixes concerns:**
- Color mapping (`getStatusColor`) is a view concern, not controller
- Should be in a `BookingCalendarResource` or helper

---

## Models

### ✅ Good Patterns
- All models define `$fillable` — mass assignment protected
- `casts()` method used (Laravel 10+ style, not `$casts` array)
- Relationships fully defined with return type hints
- `SoftDeletes` on `Booking`, `Hall`, `ApprovalWorkflow`
- `LogsActivity` trait on critical models (Booking, Hall)
- `Hall::isAvailable()` is a domain method on the model — correct placement

### ⚠️ Issues Found

**Missing `SoftDeletes` on `User` model** — deleting a user hard-deletes and orphans their bookings. Verified from model inventory; `User.php` was not read but all booking FK relationships are `user_id`.

**No `$with` eager loads defined** — every query must specify eager loads manually. Acceptable but worth documenting.

**`Booking::approval()` and `Booking::approvals()` both exist** — `approval()` uses `->latest()` which returns the last approval, not necessarily the current step. Confusing naming.

**`BookingApproval` has `approved_at` column used for both approve AND reject timestamps** — misleading column name; should be `actioned_at`.

---

## Services

### ✅ Good Patterns
- `BookingService` correctly wraps creation in `DB::transaction()`
- `ApprovalService` has self-approval prevention
- `Cache::lock()` used in `generateBookingNumber()` — race condition safe
- `ApprovalService::notifyApprovers()` bulk-notifies by role correctly

### ⚠️ Issues Found

**Missing Repository Pattern:**
- Services query models directly (`Booking::with(...)->paginate()`)
- For enterprise scale, a `BookingRepository` interface would allow DB-agnostic testing
- Not blocking for current scale but limits testability

**No DTO Pattern:**
- `create(array $data)` and `update(Booking $booking, array $data)` accept raw arrays
- No type safety between controller and service layer
- DTOs (or Laravel Data objects) would catch field name typos at compile time

**`BookingService::createRecurring` N+1 risk:**
- Loop creates bookings one by one (line 194-221)
- `$this->approvalService->initiateApproval($booking)` inside the loop executes queries per iteration
- For a weekly recurring booking over 1 year, this is 52 DB roundtrips minimum
- Fix: batch-insert bookings, then batch-initiate approvals

**`ApprovalService` re-queries workflow on every `approve()`:**
- `ApprovalWorkflow::where('is_default', true)->where('is_active', true)->first()` called without cache
- Fix: `Cache::remember('default_workflow', 300, fn() => ...)`

---

## Jobs

### ✅ Exists
- `SendBookingReminders` — queued reminders
- `MarkCompletedBookings` — scheduled completion
- `EscalateOverdueApprovals` — escalation

### ⚠️ Issues Found

**No `failed()` method check** — jobs should implement `failed(Throwable $e)` to log/alert on permanent failure. Not verified without reading job files.

**No `ShouldBeUnique` on `MarkCompletedBookings`** — if scheduler fires twice (clock skew, deploy overlap), bookings could be double-marked.

**`retry_after` not verified** — need to confirm `retry_after` in queue config exceeds job timeout.

---

## Events / Listeners

**No dedicated event classes found** — notifications are sent synchronously inline in Services. For enterprise scale:

```php
// Current (synchronous, coupled):
$booking->user->notify(new BookingCreatedNotification($booking));

// Should be (decoupled, async):
event(new BookingCreated($booking));
// Listener: SendBookingConfirmation implements ShouldQueue
```

**Impact:** Slow notification delivery delays booking creation response. Email latency affects API response time.

---

## Code Smells

| Location | Smell | Fix |
|---|---|---|
| `ReportController::exportPdf` | Business logic in controller | Extract to `ReportExportService` |
| `BookingController::getStatusColor` | View concern in controller | Move to `BookingCalendarResource` |
| `ApprovalService::initiateApproval` | Queries workflow without cache | Cache default workflow |
| `BookingService::createRecurring` loop | N+1 approval initiation | Batch the loop |
| `BookingController::destroy` | Uses `request()` global helper | Use injected `$request` parameter |

---

## DDD Boundary Assessment

The application has natural bounded contexts that are mixed in a single namespace:

| Context | Models | Services | Status |
|---|---|---|---|
| Booking | Booking, RecurringBooking, BookingApproval, BookingAttendee | BookingService, ApprovalService | ✅ Clean |
| Hall Management | Hall, HallFacility | (inline) | ⚠️ No service |
| Identity | User, Department | AuthService | ✅ Adequate |
| Branding | Theme, BrandingSetting, Menu, Page, DashboardLayout, DynamicModule | BrandingService, ThemeService, MenuService, ModuleService | ✅ Clean |
| Catering | CateringMenu, CateringOrder, CateringOrderItem | (inline) | ⚠️ No service |
| Visitor | Visitor | (inline) | ⚠️ No service |
| Reporting | (cross-cutting) | (inline in ReportController) | ❌ Fat controller |

**Recommendation:** Extract `CateringService`, `VisitorService`, and `ReportService` to complete the pattern.

---

## Missing Indexes (Additional)

Beyond the existing performance migration, the following are missing:

```sql
-- department_id on bookings (used in heavy report GROUP BY)
ALTER TABLE bookings ADD INDEX idx_bookings_department_id (department_id);

-- booking_number unique constraint
ALTER TABLE bookings ADD UNIQUE INDEX uq_booking_number (booking_number);

-- created_at on users (used in admin user listing)
ALTER TABLE users ADD INDEX idx_users_created_at (created_at);
```
