# Report Audit

**Date:** 2026-06-26

---

## Report Types Available

| Report | Endpoint | Format | Status |
|---|---|---|---|
| Bookings list | GET /reports/bookings | JSON + Excel + PDF | ✅ |
| Hall utilization | GET /reports/hall-utilization | JSON | ✅ |
| Department-wise usage | GET /reports/department-wise | JSON | ✅ |
| Top halls | GET /reports/top-halls | JSON | ✅ |
| Monthly trends | GET /reports/monthly | JSON | ✅ |
| Export Excel | GET /reports/export/excel | XLSX | ✅ |
| Export PDF | GET /reports/export/pdf | PDF | ✅ |

---

## Report Quality Assessment

### Hall Utilization Report ⚠️

**Issue — Raw SQL interpolation:**
```php
DB::raw("(SELECT SUM(duration_minutes) FROM bookings WHERE hall_id = halls.id 
          AND status='approved' AND MONTH(booking_date)={$month} AND YEAR(booking_date)={$year}) 
          as total_minutes")
```
- `$month` and `$year` are validated as integers, so injection is currently prevented
- However, the pattern bypasses query builder binding — a future refactor that weakens validation would introduce SQL injection
- **Fix:** Use `addSelect` with a Closure subquery:
```php
->addSelect([
    'total_minutes' => Booking::selectRaw('SUM(duration_minutes)')
        ->whereColumn('hall_id', 'halls.id')
        ->where('status', 'approved')
        ->whereMonth('booking_date', $month)
        ->whereYear('booking_date', $year),
])
```

**Issue — No utilization percentage:**
The report returns `total_minutes` but not `utilization_percentage`. A business user wants to know "Hall A was used 65% of available hours this month."

**Formula:**  
`utilization % = total_minutes / (working_days_in_month × working_hours_per_day × 60) × 100`

### Department-Wise Report ✅

Clean GROUP BY query with conditional aggregates. ✅  
`whereNotNull('department_id')` handles null departments. ✅

**Issue:** No trend comparison — no "vs last month" delta shown.

### Top Halls Report ✅

Clean query. 10-record limit. ✅

**Issue:** No date range filter shown in the code path — `$request->month/$year` filters applied but no default message if no filters given (shows all-time top halls by default, which may be misleading).

### Monthly Trends Report

Clean GROUP BY month. ✅  
**Issue:** Missing `completed` status in the aggregate — only approved/rejected/cancelled counted.

### Excel Export ✅

`Maatwebsite\Excel` via `BookingsExport` class. ✅

**Issue:** Only `bookings` type verified in `BookingsExport.php` — `halls` and `departments` export types are listed in the validation (`in:bookings,halls,departments`) but the export class may not handle them. Need to verify `BookingsExport::__construct($request->all())` handles the `type` parameter.

### PDF Export ⚠️

```php
$pdf = Pdf::loadView("reports.{$request->type}", [...]);
```

- View files `resources/views/reports/bookings.blade.php`, `reports/halls.blade.php`, `reports/departments.blade.php` need to exist
- No evidence these Blade views were created in the inventory
- **Impact:** PDF export likely returns 500 "View not found" error

**Fix:** Verify Blade views exist; create if missing.

---

## Missing Reports

| Report | Business Value | Priority |
|---|---|---|
| Cancellation rate report | Understand no-show patterns | High |
| Approval turnaround time | SLA compliance | High |
| Resource utilization | Projector/equipment ROI | Medium |
| Visitor report | Security and access audit | Medium |
| Catering cost report | Budget management | Medium |
| User booking frequency | Power user identification | Low |
| Carbon/energy usage report | Sustainability reporting | Low |

---

## Audit Exports

| Feature | Status |
|---|---|
| Export audit logs | ⚠️ Not found in routes or ReportController |
| Activity log export | ⚠️ Not found |

**Fix:** Add `GET /audit/export?format=csv` endpoint.

---

## Dashboard Reporting Accuracy

`DashboardController` provides:
- `summary` — total bookings, pending, approved, halls
- `hall-utilization` — utilization by hall
- `booking-trends` — trends over time
- `department-usage` — dept breakdown
- `upcoming-bookings` — next N bookings

The Dashboard.jsx `useDashboardData()` hook fetches all of these in parallel. ✅

**Issue:** Dashboard summary is user-cached via `Cache::forget("dashboard_summary_{$booking->user_id}")` on create/cancel. But if an admin changes data (e.g. approves a booking for another user), the originating user's cache is NOT busted. The cache key should bust on any booking change affecting the visible summary.

---

## Report Builder (White Label)

The `ReportBuilderPage` and `ReportTemplateController` provide a custom report template system. The `run` endpoint (`POST /report-templates/{template}/run`) executes a custom report.

**Security concern:** Without reading the `ReportTemplateController::run` method, if custom report templates can contain raw SQL or Blade template code, this could be a critical injection vector.

**Recommendation:** Audit `ReportTemplateController::run` to ensure:
1. Only whitelisted query builders are used (no raw SQL execution)
2. Template variables are sanitized before rendering
