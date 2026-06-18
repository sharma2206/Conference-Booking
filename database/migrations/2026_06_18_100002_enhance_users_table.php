<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_id')->nullable()->unique()->after('name');
            $table->string('phone', 20)->nullable()->after('email');
            $table->string('avatar')->nullable()->after('phone');
            $table->foreignId('department_id')->nullable()->after('avatar')->constrained('departments')->nullOnDelete();
            $table->string('designation')->nullable()->after('department_id');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('designation');
            $table->string('two_factor_secret')->nullable()->after('status');
            $table->boolean('two_factor_enabled')->default(false)->after('two_factor_secret');
            $table->timestamp('last_login_at')->nullable()->after('two_factor_enabled');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'employee_id', 'phone', 'avatar', 'department_id', 'designation',
                'status', 'two_factor_secret', 'two_factor_enabled', 'last_login_at', 'last_login_ip',
            ]);
        });
    }
};
