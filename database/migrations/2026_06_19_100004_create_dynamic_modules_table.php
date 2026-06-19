<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dynamic_modules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon')->nullable();
            $table->text('description')->nullable();
            $table->string('url')->nullable();
            $table->unsignedSmallInteger('menu_position')->default(99);
            $table->string('status', 20)->default('active'); // active|inactive
            $table->string('permission_prefix')->nullable(); // e.g. "asset"
            $table->boolean('is_system')->default(false);
            $table->json('config')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dynamic_modules');
    }
};
