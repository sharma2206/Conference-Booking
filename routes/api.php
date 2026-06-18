<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Hall\HallController;
use App\Http\Controllers\Booking\BookingController;
use App\Http\Controllers\Booking\BookingApprovalController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Report\ReportController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('halls', HallController::class);
    Route::apiResource('bookings', BookingController::class);
    Route::post('/bookings/{booking}/approve', [BookingApprovalController::class, 'approve']);
    Route::post('/bookings/{booking}/reject', [BookingApprovalController::class, 'reject']);

    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/reports/bookings', [ReportController::class, 'bookings']);
});
