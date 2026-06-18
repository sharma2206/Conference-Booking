<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('halls', function (Blueprint $table) {
            $table->string('building')->nullable()->after('code');
            $table->json('amenities')->nullable()->after('floor');
            $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active')->change();
        });
    }

    public function down(): void
    {
        Schema::table('halls', function (Blueprint $table) {
            $table->dropColumn(['building', 'amenities']);
        });
    }
};
