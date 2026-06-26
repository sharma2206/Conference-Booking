# RBAC Audit

**Date:** 2026-06-26

---

## RBAC Implementation Overview

The system uses **Spatie Laravel-Permission v8** with JWT authentication. Permissions are enforced via:
1. Route-level middleware: `permission:hall.view`
2. Policy-level checks: `$this->authorize('view', $booking)`
3. Service-level logic: employee role scoping in `BookingService::list()`

---

## Permission Matrix

### Defined Permissions

| Resource | view | create | edit | delete | approve | cancel | check_in | check_out |
|---|---|---|---|---|---|---|---|---|
| booking | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — |
| hall | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| user | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| department | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| visitor | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| catering | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| resource | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| report | ✅ | — | — | — | — | — | — | export |
| role | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| audit | ✅ | — | — | — | — | — | — | — |
| settings | ✅ | — | — | — | — | — | — | update |

---

## Role Definitions (Expected)

| Role | Typical Permissions |
|---|---|
| super-admin | All permissions |
| admin | All except role management |
| facility-manager | hall.*, booking.view/approve, visitor.*, catering.* |
| department-head | booking.view/create/edit/cancel/approve (dept scope), report.view |
| employee | booking.view/create/cancel (own only) |

---

## Findings

### ✅ Correct Implementations

**Self-approval prevention (`ApprovalService:124`):**
```php
if ($approver->id === $booking->user_id) {
    throw ValidationException::withMessages([...]);
}
```
Self-approval correctly blocked.

**Employee scoping in BookingService (`line 49-51`):**
```php
if (auth()->user()->hasRole('employee')) {
    $query->where('user_id', auth()->id());
}
```
Employees can only see their own bookings.

**BookingPolicy correctly implemented:**
- `view`: own booking OR approver OR admin roles ✅
- `update`: own booking in pending/draft OR admin ✅
- `delete`: own booking OR admin ✅

**All branding/settings write routes require `settings.update`** ✅

---

### ⚠️ Issues Found

**RBAC-01 (High): Horizontal Privilege Escalation on Booking Update**

`BookingPolicy::update` allows `user_id === $booking->user_id` in `pending` or `draft` status. But `UpdateBookingRequest` may allow changing `user_id` or `department_id` to another user's values. If an employee can POST a booking as another user's department, they gain access to department budgets/reports.

**Fix:** Explicitly deny `user_id` changes in `UpdateBookingRequest`; strip it from validated data in `BookingService::update`.

---

**RBAC-02 (High): No Booking View Scoping for Department-Head Role**

`BookingService::list()` scopes employees but not department heads. A department head can currently see ALL pending bookings, not just their department's.

```php
// Current: only employees are scoped
if (auth()->user()->hasRole('employee')) {
    $query->where('user_id', auth()->id());
}

// Missing: department-head scoping
if (auth()->user()->hasRole('department-head')) {
    $query->where('department_id', auth()->user()->department_id);
}
```

**Fix:** Add department-head scoping.

---

**RBAC-03 (Medium): `GET /users` Returns All Users to Anyone with `user.view`**

A facility manager with `user.view` can list ALL users including their email addresses. This is a privacy concern for large organizations.

**Fix:** Add role-based filtering — non-admins should only see users in their department.

---

**RBAC-04 (Medium): `GET /audit/logs` Returns System-Wide Audit Trail**

Any user with `audit.view` can see ALL system activity. In a large org, this may include sensitive HR or financial actions.

**Fix:** Add department/role scoping to audit log queries based on requester's role.

---

**RBAC-05 (Medium): Branding/Settings Accessible to All Admins**

All routes under `/settings/branding/*` require only `settings.view` / `settings.update`. There is no super-admin-only guard on white-label destructive operations (deleting themes, wiping branding).

**Fix:** Add `permission:settings.admin` guard on destructive branding operations, assign only to super-admin.

---

**RBAC-06 (Low): `GET /roles` Exposes All Permission Names**

`GET /permissions` and `GET /all-permissions` return the full permission list to anyone with `role.view`. An attacker who gains a low-privilege account with role.view can enumerate the full permission structure.

**Fix:** Restrict `all-permissions` endpoint to super-admin only.

---

**RBAC-07 (Low): No Temporary Permission Delegation**

The system has no "delegation" feature — a manager cannot delegate their approval rights when on leave. All approvals queue indefinitely until the role holder acts.

**Fix:** Add `approval_delegations` table with `delegator_id`, `delegate_id`, `start_date`, `end_date`; factor into `ApprovalService::validateApproverPermission`.

---

## Vertical Privilege Escalation Check

| Attack Vector | Status |
|---|---|
| Employee accessing admin endpoints | ✅ Blocked by middleware |
| Employee viewing another employee's bookings | ✅ Blocked by service scoping |
| Employee updating another employee's booking | ✅ Blocked by BookingPolicy |
| Employee approving bookings | ✅ Blocked by permission:booking.approve |
| Employee accessing role management | ✅ Blocked by permission:role.view |
| Department-head seeing other depts | ⚠️ Not explicitly blocked (RBAC-02) |
| Facility manager modifying user passwords | ✅ Blocked by permission:user.edit (separate from own account) |

---

## Button/Menu Permission Enforcement

The frontend uses module gating (MainLayout) and permission-based nav filtering. However:

**RBAC-08 (Medium): Frontend Permission Check Not Verified at Component Level**

Only navigation items are hidden based on roles. Individual action buttons (Edit, Delete, Approve) inside pages are not conditionally rendered based on user permissions — they rely on the API returning 403 on attempt.

**Fix:** Pass `permissions` array (already returned from `/auth/me`) into a `usePermission(permission)` hook and gate each action button.
