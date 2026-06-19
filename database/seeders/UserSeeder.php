<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $itDept     = Department::where('code', 'IT')->first();
        $hrDept     = Department::where('code', 'HR')->first();
        $adminDept  = Department::where('code', 'ADMIN')->first();
        $opsDept    = Department::where('code', 'OPS')->first();

        $users = [
            [
                'name' => 'Super Admin',
                'employee_id' => 'EMP001',
                'email' => 'superadmin@conference.com',
                'phone' => '+91-9000000001',
                'department_id' => $adminDept?->id,
                'designation' => 'System Administrator',
                'password' => Hash::make('Admin@123'),
                'status' => 'active',
                'email_verified_at' => now(),
                'role' => 'super-admin',
            ],
            [
                'name' => 'Admin User',
                'employee_id' => 'EMP002',
                'email' => 'admin@conference.com',
                'phone' => '+91-9000000002',
                'department_id' => $adminDept?->id,
                'designation' => 'Administrator',
                'password' => Hash::make('Admin@123'),
                'status' => 'active',
                'email_verified_at' => now(),
                'role' => 'admin',
            ],
            [
                'name' => 'Facility Manager',
                'employee_id' => 'EMP003',
                'email' => 'facility@conference.com',
                'phone' => '+91-9000000003',
                'department_id' => $adminDept?->id,
                'designation' => 'Facility Manager',
                'password' => Hash::make('Admin@123'),
                'status' => 'active',
                'email_verified_at' => now(),
                'role' => 'facility-manager',
            ],
            [
                'name' => 'HR Manager',
                'employee_id' => 'EMP004',
                'email' => 'hrhead@conference.com',
                'phone' => '+91-9000000004',
                'department_id' => $hrDept?->id,
                'designation' => 'HR Manager',
                'password' => Hash::make('Admin@123'),
                'status' => 'active',
                'email_verified_at' => now(),
                'role' => 'department-head',
            ],
            [
                'name' => 'Software Engineer',
                'employee_id' => 'EMP005',
                'email' => 'employee@conference.com',
                'phone' => '+91-9000000005',
                'department_id' => $itDept?->id,
                'designation' => 'Software Engineer',
                'password' => Hash::make('Admin@123'),
                'status' => 'active',
                'email_verified_at' => now(),
                'role' => 'employee',
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']);

            $user = User::firstOrCreate(['email' => $userData['email']], $userData);

            if (!$user->hasRole($role)) {
                $user->assignRole($role);
            }
        }
    }
}
