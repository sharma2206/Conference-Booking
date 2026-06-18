<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catering_menus', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->string('unit')->default('per person');
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });

        Schema::create('catering_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'confirmed', 'delivered', 'cancelled'])->default('pending');
            $table->decimal('total_cost', 10, 2)->default(0);
            $table->text('special_instructions')->nullable();
            $table->timestamps();
        });

        Schema::create('catering_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('catering_orders')->cascadeOnDelete();
            $table->foreignId('menu_id')->constrained('catering_menus')->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catering_order_items');
        Schema::dropIfExists('catering_orders');
        Schema::dropIfExists('catering_menus');
    }
};
