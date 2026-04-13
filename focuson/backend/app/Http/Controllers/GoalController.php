<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use App\Models\Roadmap;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * GoalController
 * Full CRUD for user goals with ownership enforcement.
 * All routes require JWT authentication.
 */
class GoalController extends Controller
{
    /**
     * List all goals for the authenticated user.
     * GET /api/goals
     * Query params: status, category, limit, page
     */
    public function index(Request $request): JsonResponse
    {
        $userId = auth()->id();
        $query  = Goal::where('user_id', $userId);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by category
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $limit = min((int) $request->get('limit', 10), 50);
        $goals = $query->orderBy('created_at', 'desc')
                       ->paginate($limit);

        // Attach progress percentage from roadmap
        $goals->getCollection()->transform(function ($goal) {
            $roadmap = Roadmap::where('goal_id', $goal->_id)->first();
            $goal->progress = $roadmap ? $roadmap->overall_progress : 0;
            return $goal;
        });

        return response()->json($goals);
    }

    /**
     * Create a new goal.
     * POST /api/goals
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title'       => 'required|string|min:5|max:200',
            'category'    => 'required|in:career,education,health,finance,personal,startup',
            'description' => 'nullable|string|max:2000',
            'timeframe'   => 'nullable|in:3_months,6_months,12_months,2_years,open_ended',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $goal = Goal::create([
            'user_id'     => auth()->id(),
            'title'       => strip_tags(trim($request->title)),
            'description' => strip_tags(trim($request->description ?? '')),
            'category'    => $request->category,
            'timeframe'   => $request->timeframe,
            'status'      => 'defining',
            'clarity_score' => 0,
            'ai_clarifications' => [],
        ]);

        return response()->json($goal, 201);
    }

    /**
     * Get a single goal with its roadmap.
     * GET /api/goals/:id
     */
    public function show(string $id): JsonResponse
    {
        $goal = $this->findOwnedGoal($id);
        if (!$goal) {
            return response()->json(['message' => 'Goal not found'], 404);
        }

        // Load roadmap and strategic paths
        $roadmap = Roadmap::where('goal_id', $id)->first();
        $goal->roadmap  = $roadmap;
        $goal->progress = $roadmap?->overall_progress ?? 0;

        return response()->json($goal);
    }

    /**
     * Update a goal.
     * PUT /api/goals/:id
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $goal = $this->findOwnedGoal($id);
        if (!$goal) {
            return response()->json(['message' => 'Goal not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title'       => 'sometimes|string|min:5|max:200',
            'description' => 'sometimes|string|max:2000',
            'status'      => 'sometimes|in:defining,analyzing,active,paused,completed,abandoned',
            'target_date' => 'sometimes|date|after:today',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['title', 'description', 'status', 'target_date']);
        // Sanitize string fields
        if (isset($data['title']))       $data['title']       = strip_tags(trim($data['title']));
        if (isset($data['description'])) $data['description'] = strip_tags(trim($data['description']));

        $goal->update($data);

        return response()->json($goal->fresh());
    }

    /**
     * Activate goal (called at end of wizard).
     * POST /api/goals/:id/activate
     */
    public function activate(string $id): JsonResponse
    {
        $goal = $this->findOwnedGoal($id);
        if (!$goal) {
            return response()->json(['message' => 'Goal not found'], 404);
        }

        $goal->update(['status' => 'active', 'onboarding_completed' => true]);

        return response()->json(['message' => 'Goal activated', 'goal' => $goal->fresh()]);
    }

    /**
     * Soft delete (mark as abandoned).
     * DELETE /api/goals/:id
     */
    public function destroy(string $id): JsonResponse
    {
        $goal = $this->findOwnedGoal($id);
        if (!$goal) {
            return response()->json(['message' => 'Goal not found'], 404);
        }

        $goal->update(['status' => 'abandoned']);

        return response()->json(['message' => 'Goal removed']);
    }

    // ─────────────────────────────────────────────
    // Private: enforce user ownership
    // ─────────────────────────────────────────────
    private function findOwnedGoal(string $id): ?Goal
    {
        return Goal::where('_id', $id)
                   ->where('user_id', auth()->id())
                   ->first();
    }
}
