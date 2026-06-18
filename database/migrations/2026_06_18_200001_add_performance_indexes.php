<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->index(['booking_date', 'status'],  'idx_bookings_date_status');
            $table->index(['hall_id', 'booking_date'], 'idx_bookings_hall_date');
            $table->index(['user_id', 'status'],       'idx_bookings_user_status');
            $table->index('created_at',                'idx_bookings_created_at');
        });

        Schema::table('booking_approvals', function (Blueprint $table) {
            $table->index(['booking_id', 'step_level', 'status'], 'idx_approvals_booking_step_status');
        });

        Schema::table('halls', function (Blueprint $table) {
            $table->index('status', 'idx_halls_status');
        });

        Schema::table('visitors', function (Blueprint $table) {
            $table->index(['booking_id', 'status'], 'idx_visitors_booking_status');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['module', 'action'], 'idx_audit_module_action');
            $table->index('created_at',         'idx_audit_created_at');
        });

        Schema::table('resources', function (Blueprint $table) {
            $table->unique('code', 'uq_resources_code');
        });

        Schema::table('holidays', function (Blueprint $table) {
            $table->unique('date', 'uq_holidays_date');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex('idx_bookings_date_status');
            $table->dropIndex('idx_bookings_hall_date');
            $table->dropIndex('idx_bookings_user_status');
            $table->dropIndex('idx_bookings_created_at');
        });

        Schema::table('booking_approvals', function (Blueprint $table) {
            $table->dropIndex('idx_approvals_booking_step_status');
        });

        Schema::table('halls', function (Blueprint $table) {
            $table->dropIndex('idx_halls_status');
        });

        Schema::table('visitors', function (Blueprint $table) {
            $table->dropIndex('idx_visitors_booking_status');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_audit_module_action');
            $table->dropIndex('idx_audit_created_at');
        });

        Schema::table('resources', function (Blueprint $table) {
            $table->dropUnique('uq_resources_code');
        });

        Schema::table('holidays', function (Blueprint $table) {
            $table->dropUnique('uq_holidays_date');
        });
    }
};
