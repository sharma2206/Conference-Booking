<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dashboard_layouts', function (Blueprint $table) {
            $table->id();
            $table->string('role')->nullable();     // null = user-specific
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->json('layout');                 // array of widget configs [{id, type, x, y, w, h, config}]
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_layouts');
    }
};
