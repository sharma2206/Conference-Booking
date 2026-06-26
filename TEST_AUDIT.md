# Test Audit

**Date:** 2026-06-26

---

## Current Coverage

| Test Type | Files | Estimated Coverage |
|---|---|---|
| Feature tests | 5 | ~5% of controllers |
| Unit tests | 1 (ExampleTest) | 0% |
| RBAC tests | 1 (`PermissionTest.php`) | Partial |
| Booking tests | 1 (`BookingCreationTest.php`) | ~10% of booking scenarios |
| Approval tests | 1 (`ApprovalWorkflowTest.php`) | Partial |
| E2E tests | 0 | 0% |
| API contract tests | 0 | 0% |
| Performance tests | 0 | 0% |

**Overall estimated coverage: ~5-8%**  
**Target: 95%+**

---

## Critical Missing Test Coverage

### Booking Engine Tests

```php
// tests/Feature/Booking/BookingConflictTest.php (MISSING)
class BookingConflictTest extends TestCase
{
    // Must have:
    public function test_cannot_double_book_same_hall_same_time() { }
    public function test_can_book_adjacent_time_slots() { }
    public function test_cannot_book_past_dates() { }
    public function test_cannot_book_on_holiday() { }
    public function test_cannot_exceed_advance_booking_days() { }
    public function test_cannot_exceed_hall_capacity() { }
    public function test_concurrent_booking_race_condition() { } // two requests same time
    public function test_cancelled_booking_releases_slot() { }
    public function test_minimum_duration_enforced() { }
    public function test_maximum_duration_enforced() { }
}
```

### RBAC Matrix Tests

```php
// tests/Feature/RBAC/BookingRBACTest.php (MISSING)
class BookingRBACTest extends TestCase
{
    // Employee can only see own bookings
    public function test_employee_cannot_see_other_user_bookings() { }
    
    // Cannot approve own booking
    public function test_user_cannot_approve_own_booking() { }
    
    // Facility manager can see all bookings
    public function test_facility_manager_sees_all_bookings() { }
    
    // Employee cannot access admin endpoints
    public function test_employee_cannot_manage_halls() { }
    public function test_employee_cannot_manage_users() { }
    public function test_employee_cannot_access_reports() { }
    
    // Unauthenticated access blocked
    public function test_unauthenticated_cannot_access_bookings() { }
}
```

### Approval Workflow Tests

```php
// tests/Feature/Booking/ApprovalWorkflowTest.php (EXISTS — needs expansion)
// Missing scenarios:
public function test_booking_auto_approved_when_no_workflow() { }
public function test_multi_step_workflow_advances_correctly() { }
public function test_rejection_terminates_workflow() { }
public function test_notification_sent_to_role_on_each_step() { }
public function test_booking_approved_after_final_step() { }
```

### API Tests

```php
// tests/Feature/API/HallAPITest.php (MISSING)
class HallAPITest extends TestCase
{
    public function test_hall_create_returns_201() { }
    public function test_hall_create_requires_name() { }
    public function test_hall_create_requires_capacity_positive_integer() { }
    public function test_hall_availability_check_returns_correct_status() { }
    public function test_hall_image_upload_returns_url() { }
    public function test_hall_soft_deleted_hidden_from_list() { }
}
```

---

## Test Infrastructure Gaps

### DO-13: SQLite vs MySQL Mismatch

PHPUnit is configured to use SQLite in-memory. The booking conflict detection uses MySQL-specific date functions:
```sql
MONTH(booking_date), YEAR(booking_date)
```
These fail on SQLite. The current tests may be passing on SQLite but failing on the actual MySQL production database.

**Fix — phpunit.xml:**
```xml
<env name="DB_CONNECTION" value="mysql"/>
<env name="DB_HOST" value="127.0.0.1"/>
<env name="DB_DATABASE" value="conference_booking_test"/>
```

### Factory Coverage

Need to verify all models have factories:
- `BookingFactory` ✅ (assumed from discovery)
- `HallFactory` ✅
- `UserFactory` ✅
- `DepartmentFactory` — unknown
- `VisitorFactory` — unknown
- `CateringMenuFactory` — unknown
- `RecurringBookingFactory` — unknown

---

## Minimum Test Suite Required for Production

```
tests/
├── Feature/
│   ├── Auth/
│   │   ├── LoginTest.php ✅
│   │   ├── RegisterTest.php ✅
│   │   ├── TwoFactorTest.php ❌
│   │   └── PasswordResetTest.php ❌
│   ├── Booking/
│   │   ├── BookingCreationTest.php ✅ (expand)
│   │   ├── BookingConflictTest.php ❌ CRITICAL
│   │   ├── BookingUpdateTest.php ❌
│   │   ├── BookingCancellationTest.php ❌
│   │   ├── RecurringBookingTest.php ❌
│   │   └── ApprovalWorkflowTest.php ✅ (expand)
│   ├── Hall/
│   │   ├── HallCRUDTest.php ❌
│   │   └── HallAvailabilityTest.php ❌ CRITICAL
│   ├── RBAC/
│   │   ├── PermissionTest.php ✅ (expand)
│   │   ├── BookingRBACTest.php ❌ CRITICAL
│   │   ├── HallRBACTest.php ❌
│   │   └── AdminRBACTest.php ❌
│   ├── Report/
│   │   ├── ReportAccessTest.php ❌
│   │   └── ReportExportTest.php ❌
│   ├── API/
│   │   ├── PaginationTest.php ❌
│   │   ├── FilteringTest.php ❌
│   │   └── ValidationTest.php ❌
│   └── Notification/
│       └── BookingNotificationTest.php ❌
├── Unit/
│   ├── BookingServiceTest.php ❌ CRITICAL
│   ├── ApprovalServiceTest.php ❌
│   ├── HallAvailabilityTest.php ❌ CRITICAL
│   └── BookingNumberGenerationTest.php ❌
└── Browser/ (Playwright E2E)
    ├── BookingFlowTest.spec.ts ❌
    ├── LoginTest.spec.ts ❌
    └── CalendarTest.spec.ts ❌
```

**Missing: 25+ test files**

---

## Recommended Testing Stack Addition

```json
// package.json — add for E2E
"@playwright/test": "^1.45.0"
```

```bash
# playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  baseURL: 'http://localhost:8000',
  use: { screenshot: 'on-failure' },
});
```

---

## Estimated Effort for 95% Coverage

| Area | Effort |
|---|---|
| Booking conflict unit tests | 1 day |
| RBAC matrix tests | 1 day |
| API endpoint tests (all controllers) | 3 days |
| Approval workflow expansion | 0.5 day |
| Notification tests | 0.5 day |
| Report tests | 1 day |
| E2E Playwright (booking flow) | 2 days |
| CI MySQL service fix | 0.5 day |
| **Total** | **~9.5 days** |
