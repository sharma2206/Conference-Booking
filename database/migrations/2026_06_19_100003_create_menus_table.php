<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('location', 30)->default('sidebar'); // sidebar|topnav|footer
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('menu_items')->nullOnDelete();
            $table->string('label');
            $table->string('icon')->nullable();
            $table->string('route')->nullable();    // named route
            $table->string('url')->nullable();      // external URL
            $table->string('permission')->nullable();
            $table->string('badge')->nullable();
            $table->string('badge_color', 20)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('visibility_type', 20)->default('all'); // all|role|department|user
            $table->json('visibility_values')->nullable();
            $table->boolean('is_mega_menu')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('menus');
    }
};
