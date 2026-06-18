<?php

namespace Database\Seeders;

use App\Models\ApprovalWorkflow;
use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['group' => 'general', 'key' => 'app_name', 'value' => 'Conference Hall Booking', 'type' => 'string'],
            ['group' => 'general', 'key' => 'app_timezone', 'value' => 'Asia/Kolkata', 'type' => 'string'],
            ['group' => 'booking', 'key' => 'booking_advance_days', 'value' => '30', 'type' => 'integer'],
            ['group' => 'booking', 'key' => 'min_booking_duration', 'value' => '30', 'type' => 'integer'],
            ['group' => 'booking', 'key' => 'max_booking_duration', 'value' => '480', 'type' => 'integer'],
            ['group' => 'booking', 'key' => 'office_start_time', 'value' => '09:00', 'type' => 'string'],
            ['group' => 'booking', 'key' => 'office_end_time', 'value' => '18:00', 'type' => 'string'],
            ['group' => 'booking', 'key' => 'booking_allowed_days', 'value' => '["1","2","3","4","5"]', 'type' => 'json'],
            ['group' => 'notifications', 'key' => 'notify_on_create', 'value' => '1', 'type' => 'boolean'],
            ['group' => 'notifications', 'key' => 'notify_on_approve', 'value' => '1', 'type' => 'boolean'],
            ['group' => 'notifications', 'key' => 'notify_on_reject', 'value' => '1', 'type' => 'boolean'],
            ['group' => 'notifications', 'key' => 'notify_reminder_1day', 'value' => '1', 'type' => 'boolean'],
            ['group' => 'notifications', 'key' => 'notify_reminder_1hour', 'value' => '1', 'type' => 'boolean'],
        ];

        foreach ($settings as $setting) {
            Setting::firstOrCreate(['key' => $setting['key']], $setting);
        }

        // Create default approval workflow
        if (!ApprovalWorkflow::where('is_default', true)->exists()) {
            $workflow = ApprovalWorkflow::create([
                'name' => 'Standard Approval Workflow',
                'description' => 'Default multi-level approval workflow',
                'is_active' => true,
                'is_default' => true,
                'created_by' => 1,
            ]);

            $workflow->steps()->createMany([
                ['step_order' => 1, 'step_name' => 'Department Head Approval', 'role_name' => 'department-head', 'can_skip' => false, 'escalation_hours' => 24],
                ['step_order' => 2, 'step_name' => 'Facility Manager Approval', 'role_name' => 'facility-manager', 'can_skip' => false, 'escalation_hours' => 24],
            ]);
        }
    }
}
