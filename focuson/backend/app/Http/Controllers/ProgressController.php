<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use App\Models\Roadmap;
use App\Models\ProgressLog;
use App\Services\ClaudeService;
use App\Services\PromptService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * ProgressController
 *
 * Tracks user progress through roadmap milestones.
 * Endpoints:
 *   GET  /api/progress/:goal_id          — Get full progress for a goal
 *   POST /api/progress/log               — Log a progress action
 *   PUT  /api/roadmaps/:id/milestones/:mid — Update milestone status
 *   GET  /api/dashboard/stats            — Dashboard summary stats
 */
class ProgressController extends Controller
{
    public function __construct(
        private ClaudeService $claude,
        private PromptService $prompts
    ) {}

    /**
     * Get full progress for a goal including milestone breakdown.
     * GET /api/progress/:goal_id
     */
    public function goalProgress(string $goalId): JsonResponse
    {
        $goal = Goal::where('_id', $goalId)->where('user_id', auth()->id())->first();
        if (!$goal) return response()->json(['message' => 'Goal not found'], 404);

        $roadmap = Roadmap::where('goal_id', $goalId)->first();
        $logs    = ProgressLog::where('goal_id', $goalId)
                              ->where('user_id', auth()->id())
                              ->orderBy('logged_at', 'desc')
                              ->limit(20)
                              ->get();

        return response()->json([
            'goal'              => $goal,
            'roadmap'           => $roadmap,
            'overall_progress'  => $roadmap?->overall_progress ?? 0,
            'recent_logs'       => $logs,
        ]);
    }

    /**
     * Log a progress event (started, completed, skipped, note).
     * POST /api/progress/log
     */
    public function logProgress(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'goal_id'      => 'required|string',
            'milestone_id' => 'required|string',
            'action'       => 'required|in:started,completed,skipped,note_added',
            'mood'         => 'required|in:motivated,neutral,struggling,stuck',
            'note'         => 'nullable|string|max:500',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $userId = auth()->id();

        // Verify goal ownership
        $goal = Goal::where('_id', $request->goal_id)->where('user_id', $userId)->first();
        if (!$goal) return response()->json(['message' => 'Goal not found'], 404);

        ProgressLog::create([
            'user_id'      => $userId,
            'goal_id'      => $request->goal_id,
            'milestone_id' => $request->milestone_id,
            'action'       => $request->action,
            'mood'         => $request->mood,
            'note'         => strip_tags($request->note ?? ''),
            'logged_at'    => now(),
        ]);

        return response()->json(['message' => 'Progress logged']);
    }

    /**
     * Update a specific milestone status within a roadmap.
     * PUT /api/roadmaps/:roadmapId/milestones/:milestoneId
     */
    public function updateMilestone(Request $request, string $roadmapId, string $milestoneId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,in_progress,completed,skipped',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $roadmap = Roadmap::where('_id', $roadmapId)
                          ->where('user_id', auth()->id())
                          ->first();

        if (!$roadmap) return response()->json(['message' => 'Roadmap not found'], 404);

        // Update the specific milestone across all phases
        $phases  = $roadmap->phases ?? [];
        $updated = false;

        foreach ($phases as &$phase) {
            foreach ($phase['milestones'] as &$milestone) {
                if ($milestone['milestone_id'] === $milestoneId) {
                    $milestone['status'] = $request->status;
                    if ($request->status === 'completed') {
                        $milestone['completed_at'] = now()->toISOString();
                    }
                    $updated = true;
                    break 2;
                }
            }
        }
        unset($phase, $milestone);

        if (!$updated) return response()->json(['message' => 'Milestone not found'], 404);

        $roadmap->update(['phases' => $phases]);
        $roadmap->recalculateProgress();

        return response()->json([
            'message'  => 'Milestone updated',
            'progress' => $roadmap->fresh()->overall_progress,
        ]);
    }

    /**
     * Dashboard statistics summary.
     * GET /api/dashboard/stats
     */
    public function dashboardStats(): JsonResponse
    {
        $userId = auth()->id();

        $activeGoals    = Goal::where('user_id', $userId)->where('status', 'active')->count();
        $completedGoals = Goal::where('user_id', $userId)->where('status', 'completed')->count();
        $mentorSessions = \App\Models\MentorSession::where('user_id', $userId)->count();

        // Calculate streak: consecutive days with at least one progress log
        $streak = $this->calculateStreak($userId);

        return response()->json([
            'active'          => $activeGoals,
            'completed'       => $completedGoals,
            'streak'          => $streak,
            'mentorSessions'  => $mentorSessions,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    // Private: streak calculation
    // ─────────────────────────────────────────────────────────

    private function calculateStreak(string $userId): int
    {
        $streak = 0;
        $day    = now()->startOfDay();

        while (true) {
            $hasLog = ProgressLog::where('user_id', $userId)
                ->where('logged_at', '>=', $day)
                ->where('logged_at', '<',  $day->copy()->addDay())
                ->exists();

            if (!$hasLog) break;

            $streak++;
            $day->subDay();

            if ($streak > 365) break; // safety cap
        }

        return $streak;
    }
}
