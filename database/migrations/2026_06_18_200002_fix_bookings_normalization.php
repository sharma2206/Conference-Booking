<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Migrate any remaining free-text department data to department_id where possible
        DB::statement("
            UPDATE bookings
            SET department_id = (
                SELECT id FROM departments WHERE departments.name = bookings.department LIMIT 1
            )
            WHERE department_id IS NULL
              AND department IS NOT NULL
              AND department != ''
              AND EXISTS (SELECT 1 FROM departments WHERE departments.name = bookings.department)
        ");

        Schema::table('bookings', function (Blueprint $table) {
            // Remove redundant free-text column — department_id FK is the source of truth
            $table->dropColumn('department');

            // booking_number should never be NULL after creation
            $table->string('booking_number')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('department')->nullable()->after('user_id');
            $table->string('booking_number')->nullable()->change();
        });
    }
};
