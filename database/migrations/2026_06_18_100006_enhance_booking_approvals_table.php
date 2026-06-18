<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_approvals', function (Blueprint $table) {
            $table->integer('step_level')->default(1)->after('booking_id');
            $table->string('role_name')->nullable()->after('step_level');
            $table->timestamp('notified_at')->nullable()->after('approved_at');
            $table->timestamp('escalated_at')->nullable()->after('notified_at');
        });
    }

    public function down(): void
    {
        Schema::table('booking_approvals', function (Blueprint $table) {
            $table->dropColumn(['step_level', 'role_name', 'notified_at', 'escalated_at']);
        });
    }
};
