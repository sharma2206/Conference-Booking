<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('booking_number')->unique()->nullable()->after('id');
            $table->text('agenda')->nullable()->after('purpose');
            $table->string('organizer_name')->nullable()->after('agenda');
            $table->string('organizer_phone', 20)->nullable()->after('organizer_name');
            $table->foreignId('department_id')->nullable()->after('organizer_phone')->constrained('departments')->nullOnDelete();
            $table->boolean('is_recurring')->default(false)->after('department_id');
            $table->foreignId('recurring_booking_id')->nullable()->after('is_recurring')->constrained('recurring_bookings')->nullOnDelete();
            $table->integer('current_approval_step')->default(0)->after('status');
            $table->timestamp('approved_at')->nullable()->after('rejection_reason');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['department_id', 'recurring_booking_id']);
            $table->dropColumn([
                'booking_number', 'agenda', 'organizer_name', 'organizer_phone',
                'department_id', 'is_recurring', 'recurring_booking_id',
                'current_approval_step', 'approved_at',
            ]);
        });
    }
};
