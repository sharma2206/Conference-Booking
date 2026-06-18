<?php

namespace App\Providers;

use App\Models\Booking;
use App\Models\CateringMenu;
use App\Models\Department;
use App\Models\Hall;
use App\Models\Resource;
use App\Models\User;
use App\Models\Visitor;
use App\Policies\BookingPolicy;
use App\Policies\CateringPolicy;
use App\Policies\DepartmentPolicy;
use App\Policies\HallPolicy;
use App\Policies\ResourcePolicy;
use App\Policies\UserPolicy;
use App\Policies\VisitorPolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(Booking::class,    BookingPolicy::class);
        Gate::policy(Hall::class,       HallPolicy::class);
        Gate::policy(User::class,       UserPolicy::class);
        Gate::policy(Department::class, DepartmentPolicy::class);
        Gate::policy(Visitor::class,    VisitorPolicy::class);
        Gate::policy(CateringMenu::class, CateringPolicy::class);
        Gate::policy(Resource::class,   ResourcePolicy::class);

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        ResetPassword::createUrlUsing(function ($user, string $token) {
            return config('app.frontend_url', 'http://localhost:3000')
                . "/reset-password?token={$token}&email={$user->email}";
        });
    }
}
