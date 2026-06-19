<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            // ── Booking Confirmation ──────────────────────────────────────
            [
                'name'         => 'Booking Confirmation',
                'slug'         => 'booking_confirmation',
                'subject'      => 'Your Booking is Confirmed — {{booking_id}}',
                'is_system'    => true,
                'variables'    => ['name', 'booking_id', 'hall_name', 'start_time', 'end_time', 'app_name', 'app_url'],
                'html_content' => <<<'HTML'
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Booking Confirmed</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
        <tr><td style="background:#3b82f6;padding:32px 40px;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">{{app_name}}</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Booking Confirmed!</h2>
          <p style="color:#475569;font-size:15px;line-height:1.6;">Hi <strong>{{name}}</strong>,</p>
          <p style="color:#475569;font-size:15px;line-height:1.6;">Your booking has been confirmed. Here are the details:</p>
          <table width="100%" style="background:#f1f5f9;border-radius:8px;padding:20px;margin:20px 0;">
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Booking Reference</td><td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{{booking_id}}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Hall</td><td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{{hall_name}}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Start Time</td><td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{{start_time}}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">End Time</td><td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{{end_time}}</td></tr>
          </table>
          <p style="color:#475569;font-size:14px;">You can view your booking at any time via the portal.</p>
          <a href="{{app_url}}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;margin-top:8px;">View Booking</a>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
          &copy; 2025 {{app_name}}. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML,
            ],

            // ── Booking Approval ──────────────────────────────────────────
            [
                'name'         => 'Booking Approved',
                'slug'         => 'booking_approval',
                'subject'      => 'Booking Approved — {{booking_id}}',
                'is_system'    => true,
                'variables'    => ['name', 'booking_id', 'hall_name', 'start_time', 'end_time', 'app_name', 'app_url'],
                'html_content' => <<<'HTML'
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Booking Approved</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
        <tr><td style="background:#10b981;padding:32px 40px;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">{{app_name}}</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Your Booking Has Been Approved</h2>
          <p style="color:#475569;font-size:15px;line-height:1.6;">Hi <strong>{{name}}</strong>,</p>
          <p style="color:#475569;font-size:15px;line-height:1.6;">Great news! Your booking <strong>{{booking_id}}</strong> for <strong>{{hall_name}}</strong> has been approved.</p>
          <table width="100%" style="background:#f0fdf4;border-radius:8px;border-left:4px solid #10b981;padding:20px;margin:20px 0;">
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Hall</td><td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{{hall_name}}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Start Time</td><td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{{start_time}}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">End Time</td><td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{{end_time}}</td></tr>
          </table>
          <a href="{{app_url}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">View Details</a>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
          &copy; 2025 {{app_name}}. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML,
            ],

            // ── Booking Rejection ─────────────────────────────────────────
            [
                'name'         => 'Booking Rejected',
                'slug'         => 'booking_rejection',
                'subject'      => 'Booking Rejected — {{booking_id}}',
                'is_system'    => true,
                'variables'    => ['name', 'booking_id', 'hall_name', 'start_time', 'reason', 'app_name', 'app_url'],
                'html_content' => <<<'HTML'
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Booking Rejected</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
        <tr><td style="background:#ef4444;padding:32px 40px;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">{{app_name}}</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Booking Not Approved</h2>
          <p style="color:#475569;font-size:15px;line-height:1.6;">Hi <strong>{{name}}</strong>,</p>
          <p style="color:#475569;font-size:15px;line-height:1.6;">Unfortunately, your booking <strong>{{booking_id}}</strong> for <strong>{{hall_name}}</strong> on <strong>{{start_time}}</strong> could not be approved.</p>
          <table width="100%" style="background:#fef2f2;border-radius:8px;border-left:4px solid #ef4444;padding:20px;margin:20px 0;">
            <tr><td style="color:#64748b;font-size:14px;padding-bottom:4px;"><strong>Reason:</strong></td></tr>
            <tr><td style="color:#1e293b;font-size:14px;">{{reason}}</td></tr>
          </table>
          <p style="color:#475569;font-size:14px;">Please contact your administrator if you have any questions, or submit a new booking for a different time slot.</p>
          <a href="{{app_url}}" style="display:inline-block;background:#ef4444;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">View Portal</a>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
          &copy; 2025 {{app_name}}. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML,
            ],

            // ── Booking Reminder ──────────────────────────────────────────
            [
                'name'         => 'Upcoming Booking Reminder',
                'slug'         => 'booking_reminder',
                'subject'      => 'Reminder: Your booking {{booking_id}} is coming up',
                'is_system'    => true,
                'variables'    => ['name', 'booking_id', 'hall_name', 'start_time', 'end_time', 'app_name', 'app_url'],
                'html_content' => <<<'HTML'
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Booking Reminder</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
        <tr><td style="background:#f59e0b;padding:32px 40px;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">{{app_name}}</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Upcoming Booking Reminder</h2>
          <p style="color:#475569;font-size:15px;line-height:1.6;">Hi <strong>{{name}}</strong>,</p>
          <p style="color:#475569;font-size:15px;line-height:1.6;">This is a friendly reminder that you have an upcoming booking:</p>
          <table width="100%" style="background:#fffbeb;border-radius:8px;border-left:4px solid #f59e0b;padding:20px;margin:20px 0;">
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Booking Reference</td><td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{{booking_id}}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Hall</td><td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{{hall_name}}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Start Time</td><td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{{start_time}}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">End Time</td><td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{{end_time}}</td></tr>
          </table>
          <a href="{{app_url}}" style="display:inline-block;background:#f59e0b;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">View Booking</a>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
          &copy; 2025 {{app_name}}. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML,
            ],

            // ── Welcome ───────────────────────────────────────────────────
            [
                'name'         => 'Welcome to Conference Booking',
                'slug'         => 'welcome',
                'subject'      => 'Welcome to {{app_name}}, {{name}}!',
                'is_system'    => true,
                'variables'    => ['name', 'email', 'app_name', 'app_url'],
                'html_content' => <<<'HTML'
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Welcome</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
        <tr><td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:40px;">
          <h1 style="color:#ffffff;margin:0 0 8px;font-size:28px;font-weight:700;">Welcome to {{app_name}}!</h1>
          <p style="color:rgba(255,255,255,.85);margin:0;font-size:15px;">Your account has been created.</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="color:#475569;font-size:15px;line-height:1.6;">Hi <strong>{{name}}</strong>,</p>
          <p style="color:#475569;font-size:15px;line-height:1.6;">Welcome aboard! Your account has been created with the email address <strong>{{email}}</strong>. You can now log in and start managing your conference hall bookings.</p>
          <ul style="color:#475569;font-size:14px;line-height:2;">
            <li>Browse and book available conference halls</li>
            <li>Manage your bookings and approvals</li>
            <li>Track catering and resources</li>
            <li>View reports and analytics</li>
          </ul>
          <a href="{{app_url}}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;margin-top:8px;">Get Started</a>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
          &copy; 2025 {{app_name}}. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML,
            ],

            // ── OTP ───────────────────────────────────────────────────────
            [
                'name'         => 'Your OTP Code',
                'slug'         => 'otp',
                'subject'      => 'Your {{app_name}} Verification Code',
                'is_system'    => true,
                'variables'    => ['name', 'otp_code', 'app_name'],
                'html_content' => <<<'HTML'
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>OTP Code</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0;">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
        <tr><td style="background:#3b82f6;padding:28px 40px;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">{{app_name}}</h1>
        </td></tr>
        <tr><td style="padding:40px;text-align:center;">
          <p style="color:#475569;font-size:15px;margin-bottom:8px;">Hi <strong>{{name}}</strong>, here is your verification code:</p>
          <div style="display:inline-block;background:#f1f5f9;border-radius:12px;padding:24px 48px;margin:20px 0;">
            <span style="font-size:40px;font-weight:800;letter-spacing:8px;color:#1e293b;font-family:monospace;">{{otp_code}}</span>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin-top:8px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;text-align:center;">
          If you did not request this code, you can safely ignore this email.<br>
          &copy; 2025 {{app_name}}. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML,
            ],
        ];

        foreach ($templates as $templateData) {
            EmailTemplate::updateOrCreate(
                ['slug' => $templateData['slug']],
                $templateData
            );
        }
    }
}
