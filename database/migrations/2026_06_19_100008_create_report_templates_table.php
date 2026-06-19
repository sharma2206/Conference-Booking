<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('module'); // bookings|halls|visitors|catering|resources
            $table->json('fields');   // selected field names
            $table->json('filters')->nullable();
            $table->string('group_by')->nullable();
            $table->string('chart_type', 20)->nullable(); // bar|pie|line|area|none
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_templates');
    }
};
