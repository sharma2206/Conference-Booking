# UI/UX Review

**Date:** 2026-06-26

---

## Viewport Coverage

| Viewport | Width | Status | Issues |
|---|---|---|---|
| Mobile S | 320px | ⚠️ | Sidebar overlay, table overflow, modal full-height |
| Mobile M | 375px | ⚠️ | Same as above |
| Tablet | 768px | ⚠️ | Sidebar may collide with content; calendar squeeze |
| Laptop | 1024px | ✅ | Primary design target |
| Desktop | 1440px | ✅ | Good layout |
| Wide | 1920px | ⚠️ | Content stretches without max-width container |

---

## Design System Audit

### Typography
- TailwindCSS typography scale used (text-sm, text-base, text-lg, etc.)
- No custom font stack defined — falls back to system fonts
- Brand font configured via `font_family` branding setting — good
- **Issue:** No minimum `font-size: 16px` on mobile inputs → iOS Safari auto-zoom on focus

### Spacing
- Consistent `p-4`, `p-6`, `gap-4` patterns throughout
- **Issue:** Dashboard widget padding not standardized — some use `p-4`, others `p-6`

### Colors
- Dynamic CSS variables from BrandingContext ✅
- `dark:` Tailwind variants used ✅
- **Issue:** Hardcoded colors scattered in some components (e.g. `#22c55e` status colors in BookingController)
- **Issue:** No color contrast validation when admin sets brand colors

### Shadows
- `shadow-sm`, `shadow-xl` used for card depth
- Consistent card elevation system apparent

### Animations
- No evidence of animation beyond Tailwind `transition` utilities
- No page transition animations between routes
- No skeleton shimmer animation (only static skeleton blocks)

### Micro-interactions
- Button `hover:opacity-90` present in Login
- Missing: hover states on table rows, card lift on hover, icon rotation on expand

---

## Component Consistency

| Component | Consistent | Notes |
|---|---|---|
| Buttons | ⚠️ | Mix of Tailwind inline + `Button.jsx` component |
| Cards | ✅ | `Card.jsx` used throughout |
| Modals | ⚠️ | `Modal.jsx` exists but some pages may use inline |
| Badges | ✅ | `Badge.jsx` for status indicators |
| Tables | ⚠️ | `Table.jsx` exists; usage consistency unknown |
| Inputs | ✅ | `Input.jsx` component |
| Tabs | ✅ | `Tabs.jsx` component |

---

## Dashboard UX

### ✅ Good
- Dynamic widget system with role-based layouts
- Recharts for charts — smooth, responsive
- Widget registry pattern allows extensibility

### ⚠️ Issues
- No drag-to-reorder on the actual Dashboard (only in DashboardBuilder)
- Widget loading states not shimmer-animated — sudden content pop-in
- No "last refreshed" timestamp on dashboard widgets
- Charts have no empty state for zero-data periods

---

## Booking Flow UX

### Steps observed from code:
1. User navigates to `/bookings/new`
2. Fills BookingForm (hall, date, time, participants, purpose)
3. Submits → goes to pending
4. Approvers notified

### Issues:
- **No hall availability preview** before submission — user fills entire form then gets "hall not available" error
- **No duration calculator** showing "2 hours 30 minutes" as user picks start/end times
- **No cost estimate** (when billing is added)
- **Approval status tracker** not prominent — user must navigate to booking detail to see approval step

---

## Notification UX

- Notifications page exists ✅
- Unread count in header (via `NotificationController::unreadCount`) ✅
- **Issue:** Real-time notifications require polling; no WebSocket/SSE support
- **Issue:** No push notification support (browser notifications)
- **Issue:** Notification dismissal doesn't animate out

---

## Form UX

### ✅ Good
- Zod validation with inline error messages
- Disabled submit on loading with spinner
- React Hook Form for performance

### Issues
- No autosave/draft for long booking forms
- No confirmation dialog on destructive actions (cancel booking, delete hall)
- Form field tab order not explicitly set

---

## Calendar UX

- FullCalendar integration provides standard calendar views ✅
- **Issue:** No room/hall filter on calendar view
- **Issue:** No legend for status colors
- **Issue:** Click on event should open booking detail — needs `eventClick` handler verification

---

## Mobile-Specific Issues

1. **Sidebar** — likely renders as overlay on mobile; toggle button position unclear
2. **Tables** — horizontal scroll needed on mobile; `overflow-x-auto` must wrap all tables
3. **Date/time inputs** — native mobile pickers are inconsistent across browsers; consider custom picker
4. **Touch targets** — action icon buttons (Edit, Delete) must be minimum 44×44px for touch
5. **Modals** — must be full-screen on small viewports, not a floating overlay

---

## Visual Hierarchy Assessment

| Element | Hierarchy | Issue |
|---|---|---|
| Page title | H1 — prominent | ✅ |
| Section headers | H2/H3 | ✅ |
| Data tables | Scan-friendly | ⚠️ Row hover state needed |
| Status badges | Color-coded | ✅ |
| Action buttons | Primary/secondary differentiation | ⚠️ Inconsistent across pages |
| Error messages | Red text below inputs | ✅ |
| Empty states | N/A — component missing | ❌ |

---

## Recommendations Priority

| Priority | Improvement | Effort |
|---|---|---|
| P0 | Touch target minimum 44px on mobile | 2 hours |
| P0 | Table horizontal scroll on mobile | 1 hour |
| P0 | Modal full-screen on <768px | 2 hours |
| P1 | Hall availability preview in booking form | 4 hours |
| P1 | Empty state component for all lists | 3 hours |
| P1 | Skeleton shimmer animation | 1 hour |
| P2 | Confirmation dialogs on destructive actions | 2 hours |
| P2 | Duration calculator in booking form | 2 hours |
| P2 | Calendar legend and hall filter | 4 hours |
| P3 | Page transition animations | 4 hours |
| P3 | Real-time notifications (polling or SSE) | 1 day |
