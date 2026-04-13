<?php
/**
 * routes/api.php
 *
 * All API routes with:
 * - Rate limiting (throttle middleware)
 * - JWT auth protection on private routes
 * - Logical grouping
 *
 * Base URL: /api
 */

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\ProgressController;

// ── Health check (no auth needed) ──
Route::get('/health', fn() => response()->json([
    'status'  => 'ok',
    'service' => 'FocusOn API',
    'version' => '1.0.0',
    'time'    => now()->toISOString(),
]));

// ── Authentication routes ──
// Rate limited to 60 req/min to prevent brute force
Route::prefix('auth')->middleware('throttle:60,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/refresh',  [AuthController::class, 'refresh']); // Uses httpOnly cookie
});

// ── Protected routes (JWT required) ──
Route::middleware(['jwt.auth'])->group(function () {

    // Auth — current user
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
    });

    // Dashboard
    Route::get('/dashboard/stats', [ProgressController::class, 'dashboardStats']);

    // Goals CRUD
    Route::apiResource('goals', GoalController::class);
    Route::post('/goals/{id}/activate', [GoalController::class, 'activate']);

    // Progress & Milestones
    Route::get('/progress/{goalId}',                                      [ProgressController::class, 'goalProgress']);
    Route::post('/progress/log',                                           [ProgressController::class, 'logProgress']);
    Route::put('/roadmaps/{roadmapId}/milestones/{milestoneId}',           [ProgressController::class, 'updateMilestone']);

    // AI endpoints — stricter rate limit (20 req/min)
    Route::prefix('ai')->middleware('throttle:20,1')->group(function () {
        Route::post('/clarify',            [AIController::class, 'clarify']);
        Route::post('/analyze',            [AIController::class, 'analyze']);
        Route::post('/paths',              [AIController::class, 'generatePaths']);
        Route::post('/roadmap',            [AIController::class, 'generateRoadmap']);
        Route::post('/mentor/chat',        [AIController::class, 'mentorChat']);
        Route::post('/progress/feedback',  [AIController::class, 'progressFeedback']);
    });
});
