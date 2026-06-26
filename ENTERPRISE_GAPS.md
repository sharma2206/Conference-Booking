# Enterprise Gaps

**Date:** 2026-06-26

---

## Feature Checklist vs Enterprise Requirements

| Feature | Status | Implementation Notes |
|---|---|---|
| QR Check-In | ❌ Missing | No QR code generation for bookings |
| Digital Signage | ❌ Missing | No room display integration |
| Visitor Pass | ⚠️ Partial | Visitor management exists; no printable pass |
| Parking Management | ❌ Missing | No parking reservation system |
| Catering Integration | ✅ Implemented | Full catering menu + order system |
| Meeting Minutes | ❌ Missing | No meeting notes attachment |
| Cost Centers | ❌ Missing | No billing/cost-center allocation |
| Budget Allocation | ❌ Missing | No department budget limits |
| Slack Integration | ❌ Missing | No webhook/OAuth integration |
| Microsoft Teams Integration | ❌ Missing | |
| WhatsApp Notifications | ❌ Missing | |
| SMS Notifications | ❌ Missing | |
| SSO / SAML | ❌ Missing | Only local JWT auth |
| LDAP Integration | ❌ Missing | |
| Active Directory | ❌ Missing | |
| Google Calendar Sync | ❌ Missing | |
| Outlook Calendar Sync | ❌ Missing | |
| AI Room Recommendation | ❌ Missing | |
| Booking Waitlist | ❌ Missing | |
| Approval Delegation | ❌ Missing | No out-of-office delegation |
| Multi-Branch Support | ❌ Missing | Single location only |
| Carbon/Energy Reports | ❌ Missing | |

---

## Gap Details and Implementation Plans

---

### QR Check-In

**Business Case:** Allow meeting room check-in via QR code scan, automatically mark booking as "in-progress", release room if not checked in within 15 minutes.

**Required:**
```
Database:
- bookings.qr_token (VARCHAR 64, unique)
- bookings.checked_in_at (TIMESTAMP, nullable)
- bookings.auto_released_at (TIMESTAMP, nullable)

API:
- GET /bookings/{booking}/qr — returns QR code image (simplesoftwareio/simple-qrcode)
- POST /check-in/{token} — public endpoint, check-in by token

Job:
- AutoReleaseAbandonedBookings — runs every 5 min, releases unchecked-in rooms 15+ min after start

Frontend:
- QR code displayed in BookingDetails
- Facility manager QR scanner page
```

**Effort:** 2 days

---

### Digital Signage

**Business Case:** Display current/next meeting on a screen outside each room.

**Required:**
```
API:
- GET /halls/{hall}/signage — public (or token-gated) endpoint
  Returns: current booking, next booking, hall status, hall name, branding logo

Frontend:
- /signage/:hallId — full-screen public display page (no auth)
- Auto-refreshes every 60 seconds
- Shows current meeting title, organizer, time remaining
- Shows next meeting on deck

Database:
- No schema changes needed
```

**Effort:** 1 day

---

### Visitor Pass

**Business Case:** Generate a printable/digital visitor pass for approved visitors.

**Required:**
```
API:
- GET /visitors/{visitor}/pass — returns PDF visitor pass (DomPDF)

Template:
- resources/views/visitor-pass.blade.php
  Contains: visitor name, host name, booking date/time, hall, company logo, QR code

Frontend:
- "Print Pass" button in VisitorsPage
```

**Effort:** 0.5 day

---

### Approval Delegation

**Business Case:** When a manager is on leave, delegate approval rights to a colleague.

**Required:**
```sql
CREATE TABLE approval_delegations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    delegator_id BIGINT UNSIGNED NOT NULL,  -- user delegating
    delegate_id BIGINT UNSIGNED NOT NULL,   -- user receiving delegation
    role_name VARCHAR(100) NOT NULL,         -- which role to delegate
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (delegator_id) REFERENCES users(id),
    FOREIGN KEY (delegate_id) REFERENCES users(id)
);
```

**Service change in `ApprovalService::validateApproverPermission`:**
```php
// Check if approver has role OR has active delegation for the role
$hasDelegation = ApprovalDelegation::where('delegate_id', $approver->id)
    ->where('role_name', $currentApproval->role_name)
    ->where('is_active', true)
    ->where('start_date', '<=', today())
    ->where('end_date', '>=', today())
    ->exists();

if (!$approver->hasRole($currentApproval->role_name) && !$hasDelegation) {
    throw ValidationException::withMessages([...]);
}
```

**Effort:** 1.5 days

---

### Booking Waitlist

**Required:**
```sql
CREATE TABLE booking_waitlist (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hall_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    title VARCHAR(255),
    position INT NOT NULL DEFAULT 1,
    status ENUM('waiting', 'promoted', 'expired') DEFAULT 'waiting',
    notified_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Job:** `PromoteWaitlistJob` — on booking cancellation, check waitlist, notify first in queue.

**Effort:** 2 days

---

### SSO / SAML Integration

**Business Case:** Enterprise clients use Azure AD, Okta, or Google Workspace for identity.

**Required:**
```
composer require socialiteproviders/microsoft-azure
composer require socialiteproviders/google
```

API endpoints:
- GET /auth/sso/{provider}/redirect
- GET /auth/sso/{provider}/callback

**Effort:** 3 days per provider

---

### Calendar Sync (Google/Outlook)

**Business Case:** Approved bookings automatically appear in user's Google Calendar or Outlook.

**Required:**
```
- OAuth2 flow for Google Calendar / Microsoft Graph
- On booking approval: POST to Google Calendar API or Microsoft Graph
- On cancellation: DELETE from calendar API
- User settings: connect/disconnect calendar account
- Encrypted token storage per user
```

**Effort:** 3 days per integration

---

### Multi-Branch Support

**Business Case:** Organization has offices in multiple cities; each has its own halls, staff, and reports.

**Required:**
```sql
CREATE TABLE branches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Add to halls, users, departments:
ALTER TABLE halls ADD COLUMN branch_id BIGINT UNSIGNED;
ALTER TABLE users ADD COLUMN branch_id BIGINT UNSIGNED;
```

**Scope impact:** High — affects nearly every query, report, and UI filter.

**Effort:** 1-2 weeks

---

### Cost Centers & Budget Allocation

**Required:**
```sql
ALTER TABLE departments ADD COLUMN cost_center_code VARCHAR(50);
ALTER TABLE departments ADD COLUMN annual_booking_budget DECIMAL(10,2);
ALTER TABLE halls ADD COLUMN hourly_rate DECIMAL(8,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN estimated_cost DECIMAL(8,2);
ALTER TABLE bookings ADD COLUMN actual_cost DECIMAL(8,2);
```

**Effort:** 2 days

---

### AI Room Recommendation

**Business Case:** Suggest the best room based on participant count, required facilities, and historical usage patterns.

**Required:**
```
API:
- POST /halls/recommend
  Body: { participant_count, required_facilities[], preferred_date, preferred_time, duration }
  Returns: ranked list of halls with match score

Logic:
1. Filter by capacity >= participant_count
2. Filter by required facilities
3. Score by historical utilization (less-used halls ranked higher for load balancing)
4. Score by proximity to department's floor

Future: integrate with Claude API for natural language requests
```

**Effort:** 1 day (rule-based), 3 days (ML-based)

---

## Summary Count

| Status | Count |
|---|---|
| ✅ Implemented | 2 (Catering, Visitor partial) |
| ⚠️ Partial | 1 |
| ❌ Missing | 19 |

**Priority implementation order:**
1. QR Check-In (most requested enterprise feature)
2. Booking Waitlist (reduces frustration)
3. Approval Delegation (operations continuity)
4. Visitor Pass (security compliance)
5. Digital Signage (facility management)
6. SSO (enterprise sales requirement)
7. Calendar Sync (productivity)
8. Cost Centers (finance requirement)
9. Multi-Branch (growth)
10. AI Recommendation (differentiation)
