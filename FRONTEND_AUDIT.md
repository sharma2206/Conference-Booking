# Frontend Audit

**Date:** 2026-06-26

---

## Architecture

| Aspect | Implementation | Status |
|---|---|---|
| Framework | React 19 SPA | ✅ |
| Routing | React Router v7 | ✅ |
| State | Redux Toolkit + TanStack Query v5 | ✅ |
| Forms | React Hook Form + Zod v4 | ✅ |
| Styling | TailwindCSS v4 | ✅ |
| Code splitting | React.lazy + Suspense | ✅ |
| Error boundaries | `ErrorBoundary.jsx` exists | ⚠️ Not wrapped around routes |
| Dark mode | ThemeContext + Tailwind dark: | ✅ |
| Branding | BrandingContext with CSS vars | ✅ |

---

## Responsiveness

### Breakpoint Coverage

| Breakpoint | Status | Notes |
|---|---|---|
| 320px (mobile S) | ⚠️ Unknown | No responsive audit without running app |
| 375px (mobile M) | ⚠️ Unknown | |
| 768px (tablet) | ⚠️ Partial | MainLayout has `sm:` breakpoints |
| 1024px (laptop) | ✅ Good | Primary design target |
| 1440px (desktop) | ✅ Good | |
| 1920px (wide) | ⚠️ Unknown | No `max-w-screen-xl` container noted |

**Known Issues:**
- Calendar page uses FullCalendar which requires explicit responsive configuration
- Data tables likely overflow on mobile without horizontal scroll
- Modal dialogs may not be full-screen on 320px

---

## Accessibility

### Critical Issues ❌

**FE-A01: No `lang` attribute on HTML document**
```html
<!-- resources/views/app.blade.php — missing -->
<html lang="en">
```

**FE-A02: Forms missing accessible labels**
Login form uses visual `<label>` elements which is correct. However, modal forms in `BookingForm`, `HallForm` etc. need audit — inline `placeholder` attributes are not sufficient ARIA labels.

**FE-A03: Icon-only buttons have no accessible text**
Throughout the application, action buttons use `<Trash2 className="h-4 w-4" />` with no `aria-label`. Screen readers will announce these as unnamed buttons.

```jsx
// Fix pattern:
<button aria-label="Delete booking" onClick={handleDelete}>
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</button>
```

**FE-A04: Modal dialogs not focus-trapped**
The `Modal.jsx` component needs to trap focus (Tab key stays within modal) and restore focus to trigger on close. Radix UI `Dialog` handles this; verify Modal.jsx wraps `@radix-ui/react-dialog`.

**FE-A05: Data tables have no ARIA roles**
`Table.jsx` component — need to verify it renders `<table role="grid">` with `<th scope="col">` and `<th scope="row">` where appropriate.

**FE-A06: Color contrast**
With dynamic branding colors (user-configurable `primary_color`), there is no contrast validation. A brand using light yellow as primary on white background will fail WCAG AA (4.5:1 ratio).

**Fix:** Add contrast validation in BrandingPage when primary_color is saved.

**FE-A07: Keyboard navigation not audited**
No evidence of `:focus-visible` ring styles, skip-to-main link, or keyboard shortcut documentation.

---

## Form Validation

### ✅ Good
- React Hook Form + Zod schema validation used in Login
- Inline error messages shown below inputs
- Disabled submit button during loading

### ⚠️ Issues
- No client-side booking conflict validation — user submits and gets server error; should pre-check availability via `GET /halls/{hall}/availability`
- Booking form date picker — unclear if past dates are disabled at UI level before API call
- No character count indicator on `agenda` and `purpose` textarea fields

---

## Loading States

### ✅ `Skeleton` component exists
`components/ui/Skeleton.jsx` used in `CustomPageRenderer.jsx`.

### ⚠️ Missing in
- Dashboard widgets during first load
- Booking list during pagination
- Hall images during upload

---

## Empty States

Most pages likely show an empty table body when no records exist. No dedicated `EmptyState` component with illustration, contextual message, and primary CTA found in component inventory.

**Fix:** Create `<EmptyState icon={...} title="..." description="..." action={...} />` component.

---

## Error Boundaries

`ErrorBoundary.jsx` exists but is not used to wrap individual page routes in `AppRoutes.jsx`. A JavaScript error in `DashboardPage` would unmount the entire app.

**Fix:**
```jsx
// AppRoutes.jsx
<Route path="/dashboard" element={
  <ErrorBoundary fallback={<ErrorPage />}>
    <Dashboard />
  </ErrorBoundary>
} />
```

---

## Dark Mode

ThemeContext and Tailwind `dark:` classes used. ✅  
Branding custom CSS properties injected to `document.documentElement` by BrandingContext. ✅  

**Issue:** CSS custom properties (`--primary-color`) do not automatically respect `dark:` variants. If a user uses dark mode with a dark `primary_color` brand setting, text on primary buttons may be invisible.

---

## Component Library Inconsistency

Both `@mui/material` AND `@radix-ui/*` are installed. This creates:
- Two different theming systems (MUI uses emotion, Radix uses Tailwind)
- Inconsistent focus/hover behavior
- ~200KB additional bundle

**Recommendation:** Audit which MUI components are actually used; if none, remove the dependency.

---

## Offline Mode

No Service Worker, no offline fallback. For an enterprise intranet app this may be acceptable, but note that:
- No `manifest.json` for PWA
- No background sync for failed booking submissions
- Network loss shows blank page or failed API calls without user feedback

---

## RTL Support

No RTL (right-to-left) support. The app uses `ml-*`, `mr-*` margin utilities instead of `ms-*`/`me-*` (margin-start/end). For Arabic/Hebrew deployment this would require a full CSS audit.

---

## Key Metrics (Estimated)

| Metric | Estimated | Target |
|---|---|---|
| Initial JS bundle | ~800KB gzipped | <300KB |
| Time to Interactive | ~3-4s | <2s |
| Lighthouse Accessibility | ~55/100 | >90 |
| Lighthouse Performance | ~70/100 | >80 |
| WCAG AA compliance | ~40% | 100% |
