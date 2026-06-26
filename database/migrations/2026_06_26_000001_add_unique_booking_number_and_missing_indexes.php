<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // DB-level unique guard on booking_number (cache lock alone is not sufficient)
        Schema::table('bookings', function (Blueprint $table) {
            $table->unique('booking_number', 'uq_bookings_booking_number');
            $table->index('department_id', 'idx_bookings_department_id');
        });

        // Catering order lookup by booking
        if (Schema::hasTable('catering_orders')) {
            Schema::table('catering_orders', function (Blueprint $table) {
                $table->index('booking_id', 'idx_catering_orders_booking_id');
            });
        }

        // Resource allocation lookup by booking
        if (Schema::hasTable('booking_resources')) {
            Schema::table('booking_resources', function (Blueprint $table) {
                $table->index('booking_id', 'idx_booking_resources_booking_id');
            });
        }

        // Page slug lookup for Page Builder renderer
        if (Schema::hasTable('pages')) {
            Schema::table('pages', function (Blueprint $table) {
                $table->index('slug', 'idx_pages_slug');
            });
        }
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropUnique('uq_bookings_booking_number');
            $table->dropIndex('idx_bookings_department_id');
        });

        if (Schema::hasTable('catering_orders')) {
            Schema::table('catering_orders', function (Blueprint $table) {
                $table->dropIndex('idx_catering_orders_booking_id');
            });
        }

        if (Schema::hasTable('booking_resources')) {
            Schema::table('booking_resources', function (Blueprint $table) {
                $table->dropIndex('idx_booking_resources_booking_id');
            });
        }

        if (Schema::hasTable('pages')) {
            Schema::table('pages', function (Blueprint $table) {
                $table->dropIndex('idx_pages_slug');
            });
        }
    }
};
