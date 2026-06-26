# Booking Engine Audit

**Date:** 2026-06-26

---

## Summary

The booking engine has a solid foundation with proper overlap detection, capacity checks, and approval workflows. Several enterprise requirements are missing or incomplete.

---

## Feature Checklist

| Feature | Status | Notes |
|---|---|---|
| Double booking prevention | ✅ Implemented | `Hall::isAvailable()` correct overlap query |
| Capacity checks | ✅ Implemented | `checkCapacity()` in BookingService |
| Holiday blocking | ✅ Implemented | `Holiday` table lookup in `validateBookingRules()` |
| Minimum booking duration | ✅ Implemented | Configurable via `min_booking_duration` setting |
| Maximum booking duration | ✅ Implemented | Configurable via `max_booking_duration` setting |
| Advance booking limit | ✅ Implemented | `booking_advance_days` setting |
| Past date prevention | ✅ Implemented | `$date->isPast() && !$date->isToday()` |
| Recurring bookings | ✅ Implemented | Daily/weekly/monthly patterns |
| Approval workflow | ✅ Implemented | Multi-step, role-based |
| Self-approval prevention | ✅ Implemented | Explicit check in ApprovalService |
| Booking cancellation | ✅ Implemented | Status + future-date check |
| Attendee tracking | ✅ Implemented | `booking_attendees` table |
| Booking number generation | ✅ Implemented | Cache-locked sequential BK-YYYYMM-XXXX |
| Resource conflicts | ⚠️ Partial | Resources can be requested but no overlap check on shared resources |
| Timezone support | ❌ Missing | All times naive strings |
| Buffer time between bookings | ❌ Missing | Back-to-back bookings allowed |
| Hall maintenance blocks | ❌ Missing | No block-out periods |
| Waitlist | ❌ Missing | Flat rejection on conflict |
| Cancellation advance notice | ❌ Missing | Same-hour cancellation allowed |
| Recurring booking modification | ❌ Missing | No "modify all future" |
| DST support | ❌ Missing | Follows from timezone gap |
| Meeting minutes | ❌ Missing | No `meeting_minutes` table |
| Check-in/check-out for bookings | ❌ Missing | Visitor check-in exists but not booking attendance |
| Booking cost tracking | ❌ Missing | No `hourly_rate` on halls |

---

## Critical Analysis

### Double Booking Prevention ✅

`Hall::isAvailable()` uses the correct half-open interval overlap algorithm:

```php
$inner->where('start_time', '<', $endTime)
      ->where('end_time', '>', $startTime);
```

This correctly handles all overlap cases:
- New booking starts during existing: `start_new < end_existing AND end_new > start_existing` ✅
- New booking engulfs existing: same logic ✅
- Exact adjacency (9-10, 10-11): correctly allowed ✅

**Race condition:** Two simultaneous bookings for the same hall can both pass `isAvailable()` before either writes. The `DB::transaction()` in `BookingService::create()` does NOT prevent this because both reads happen before either write.

**Fix required:** Add a DB-level lock:
```php
// In BookingService::create(), inside DB::transaction():
Hall::where('id', $data['hall_id'])->lockForUpdate()->first();
// Then check availability
$this->checkAvailability(...);
```

### Approval Workflow ✅ (with caveats)

The multi-step workflow is correctly implemented. Steps advance in order; role-based notification is sent at each step.

**Issue:** If the default workflow is deleted while bookings are pending, `ApprovalService::approve()` fetches `ApprovalWorkflow::where('is_default', true)` and gets `null`. The `$nextStep = $workflow?->steps->...` nullable chain handles null workflow — bookings will then auto-approve to `approved` status on the NEXT step action. This is a silent logic change.

**Fix:** Add explicit null check and throw exception if workflow disappears mid-approval.

### Recurring Bookings ⚠️

`generateRecurringDates()` loops day-by-day from start to end date. For a 2-year daily recurring booking, this generates ~730 date checks and 730 booking records in a single transaction. This will timeout for long-range recurrings.

**Fix:** Add `max_recurring_instances` setting (default 52); warn user if they exceed it.

### Resource Conflict Detection ❌

`ResourceController::requestResource` allows booking resources without checking for time conflicts:

```php
// No overlap check exists for resources
Route::post('resources/request', [ResourceController::class, 'requestResource'])
```

Two bookings at overlapping times can both request the same projector.

**Fix:** Add overlap check in resource request logic, similar to `Hall::isAvailable()`.

---

## Booking State Machine

```
           ┌─────────────────────────────────────┐
           │                                     ▼
  draft ──→ pending ──→ [approved] ──→ completed
                    │
                    ├──→ rejected
                    │
                    └──→ cancelled
```

**Issue:** `draft` status exists in `isCancellable()` but there is no route to create a draft booking. The `store` endpoint always creates `pending`. Either implement draft-save or remove the status.

---

## Timezone Architecture Required

Current state: all booking times stored as `TIME` columns (e.g. `09:00:00`) with no timezone reference.

**Required architecture:**
```sql
-- Add to bookings table
ALTER TABLE bookings ADD COLUMN timezone VARCHAR(50) NOT NULL DEFAULT 'UTC' AFTER end_time;
ALTER TABLE halls ADD COLUMN timezone VARCHAR(50) NOT NULL DEFAULT 'UTC';
```

**Service change:** Convert all times to UTC for storage; convert back to hall timezone for display. Update `isAvailable()` to convert times to the same timezone before comparison.

---

## Missing Enterprise Features

### Waitlist System
```
Booking request → Hall full → Auto-add to waitlist → Hall booking cancels → Auto-promote waitlisted → Notify
```
Requires: `booking_waitlist` table with `position`, `notified_at`, auto-promotion job.

### Hall Maintenance Blocks
```
Facility manager creates block → Hall::isAvailable() checks blocks → Conflicting bookings notified
```
Requires: `hall_blocks` table with `hall_id`, `start_datetime`, `end_datetime`, `reason`, `created_by`.

### Meeting Cost Tracking
```
Hall has hourly_rate → Booking calculates cost = duration_hours × hourly_rate → Department gets billed
```
Requires: `hourly_rate` on halls, `cost` on bookings, department budget reports.
