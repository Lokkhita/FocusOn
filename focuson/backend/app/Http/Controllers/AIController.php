<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use App\Models\MentorSession;
use App\Models\StrategicPath;
use App\Models\Roadmap;
use App\Services\ClaudeService;
use App\Services\PromptService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * AIController
 *
 * All AI-powered endpoints — each calls ClaudeService with
 * carefully engineered prompts from PromptService.
 *
 * Rate limiting is applied at the route level (20 req/min).
 *
 * Endpoints:
 *   POST /api/ai/clarify        — Generate 5 clarifying questions for a goal
 *   POST /api/ai/analyze        — Analyze situation (SWOT) from Q&A answers
 *   POST /api/ai/paths          — Generate 3 strategic paths
 *   POST /api/ai/roadmap        — Build full roadmap for chosen path
 *   POST /api/ai/mentor/chat    — Conversational mentor chat
 *   POST /api/ai/progress/feedback — Feedback on progress log
 */
class AIController extends Controller
{
    public function __construct(
        private ClaudeService  $claude,
        private PromptService  $prompts
    ) {}

    // ──────────────────────────────────────────────────
    // 1. CLARIFY — Generate targeted questions about the goal
    // ──────────────────────────────────────────────────
    public function clarify(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'goal_id' => 'required|string',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $goal = $this->findOwnedGoal($request->goal_id);
        if (!$goal) return response()->json(['message' => 'Goal not found'], 404);

        $prompt = $this->prompts->clarifyingQuestions($goal);
        $result = $this->claude->complete($prompt, 800);

        // Parse JSON array of questions from AI response
        $questions = $this->parseJsonArray($result, 'questions');

        // Save to goal record
        $goal->update(['status' => 'analyzing']);

        return response()->json(['questions' => $questions]);
    }

    // ──────────────────────────────────────────────────
    // 2. ANALYZE — Build situation analysis from Q&A
    // ──────────────────────────────────────────────────
    public function analyze(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'goal_id' => 'required|string',
            'answers' => 'required|array|min:1|max:10',
            'answers.*.question' => 'required|string',
            'answers.*.answer'   => 'required|string|max:1000',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $goal = $this->findOwnedGoal($request->goal_id);
        if (!$goal) return response()->json(['message' => 'Goal not found'], 404);

        // Sanitize answers
        $answers = collect($request->answers)->map(fn($a) => [
            'question' => strip_tags($a['question']),
            'answer'   => strip_tags($a['answer']),
            'asked_at' => now()->toISOString(),
        ])->toArray();

        $prompt = $this->prompts->situationAnalysis($goal, $answers);
        $result = $this->claude->complete($prompt, 1500);

        $analysis = $this->parseJsonObject($result);

        // Persist clarifications and analysis to the goal
        $goal->update([
            'ai_clarifications'  => $answers,
            'situation_analysis' => $analysis,
            'clarity_score'      => $analysis['clarity_score'] ?? 70,
        ]);

        return response()->json(['analysis' => $analysis]);
    }

    // ──────────────────────────────────────────────────
    // 3. PATHS — Generate multiple strategic paths
    // ──────────────────────────────────────────────────
    public function generatePaths(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'goal_id' => 'required|string',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $goal = $this->findOwnedGoal($request->goal_id);
        if (!$goal) return response()->json(['message' => 'Goal not found'], 404);

        $prompt = $this->prompts->strategicPaths($goal);
        $result = $this->claude->complete($prompt, 2000);

        $paths = $this->parseJsonArray($result, 'paths');

        // Add UUIDs to each path
        $paths = collect($paths)->map(fn($p) => array_merge($p, [
            'path_id' => Str::uuid()->toString(),
        ]))->toArray();

        // Upsert strategic paths record
        StrategicPath::updateOrCreate(
            ['goal_id' => $goal->_id, 'user_id' => auth()->id()],
            ['paths' => $paths]
        );

        return response()->json(['paths' => $paths]);
    }

    // ──────────────────────────────────────────────────
    // 4. ROADMAP — Build full roadmap for chosen path
    // ──────────────────────────────────────────────────
    public function generateRoadmap(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'goal_id' => 'required|string',
            'path_id' => 'required|string',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $goal = $this->findOwnedGoal($request->goal_id);
        if (!$goal) return response()->json(['message' => 'Goal not found'], 404);

        // Find the chosen path details
        $strategicPaths = StrategicPath::where('goal_id', $goal->_id)->first();
        $chosenPath = collect($strategicPaths?->paths ?? [])
            ->firstWhere('path_id', $request->path_id);

        if (!$chosenPath) {
            return response()->json(['message' => 'Path not found'], 404);
        }

        // Mark path as chosen
        $strategicPaths->update([
            'chosen_path_id' => $request->path_id,
            'chosen_at'      => now(),
        ]);

        $prompt = $this->prompts->roadmapGenerator($goal, $chosenPath);
        $result = $this->claude->complete($prompt, 3000);

        $roadmapData = $this->parseJsonObject($result);

        // Add milestone UUIDs
        $phases = collect($roadmapData['phases'] ?? [])->map(function ($phase) {
            $phase['milestones'] = collect($phase['milestones'] ?? [])->map(fn($m) => array_merge($m, [
                'milestone_id' => Str::uuid()->toString(),
                'status'       => 'pending',
            ]))->toArray();
            return $phase;
        })->toArray();

        // Upsert roadmap
        $roadmap = Roadmap::updateOrCreate(
            ['goal_id' => $goal->_id, 'user_id' => auth()->id()],
            [
                'path_id'          => $request->path_id,
                'phases'           => $phases,
                'overall_progress' => 0,
            ]
        );

        return response()->json(['roadmap' => $roadmap]);
    }

    // ──────────────────────────────────────────────────
    // 5. MENTOR CHAT — Context-aware conversational AI
    // ──────────────────────────────────────────────────
    public function mentorChat(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'message'    => 'required|string|min:1|max:2000',
            'session_id' => 'nullable|string',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $userMessage = strip_tags(trim($request->message));
        $userId      = auth()->id();

        // Load or create session
        $session = null;
        if ($request->session_id) {
            $session = MentorSession::where('_id', $request->session_id)
                                    ->where('user_id', $userId)
                                    ->first();
        }

        if (!$session) {
            $session = MentorSession::create([
                'user_id'      => $userId,
                'messages'     => [],
                'session_type' => 'general',
                'total_tokens' => 0,
            ]);
        }

        // Build context: user's active goals + recent progress
        $activeGoals = Goal::where('user_id', $userId)
                           ->where('status', 'active')
                           ->limit(3)
                           ->get(['title', 'category', 'status', 'situation_analysis']);

        $roadmaps = Roadmap::where('user_id', $userId)->limit(3)->get(['overall_progress', 'goal_id']);

        // Build conversation history for Claude (last 10 messages for context window)
        $history = collect($session->messages)->takeLast(10)->map(fn($m) => [
            'role'    => $m['role'],
            'content' => $m['content'],
        ])->values()->toArray();

        $systemPrompt = $this->prompts->mentorSystem($activeGoals, $roadmaps);

        // Add user message to history
        $history[] = ['role' => 'user', 'content' => $userMessage];

        $reply       = $this->claude->chat($systemPrompt, $history, 1500);
        $tokensUsed  = $this->claude->getLastTokenCount();

        // Persist messages
        $messages = $session->messages ?? [];
        $now      = now()->toISOString();

        $messages[] = ['role' => 'user',      'content' => $userMessage, 'timestamp' => $now, 'tokens_used' => 0];
        $messages[] = ['role' => 'assistant', 'content' => $reply,       'timestamp' => $now, 'tokens_used' => $tokensUsed];

        $session->update([
            'messages'     => $messages,
            'total_tokens' => ($session->total_tokens ?? 0) + $tokensUsed,
        ]);

        return response()->json([
            'reply'      => $reply,
            'session_id' => (string) $session->_id,
        ]);
    }

    // ──────────────────────────────────────────────────
    // 6. PROGRESS FEEDBACK — AI feedback on milestone completion
    // ──────────────────────────────────────────────────
    public function progressFeedback(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'goal_id'      => 'required|string',
            'milestone_id' => 'required|string',
            'mood'         => 'required|in:motivated,neutral,struggling,stuck',
            'note'         => 'nullable|string|max:500',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $goal = $this->findOwnedGoal($request->goal_id);
        if (!$goal) return response()->json(['message' => 'Goal not found'], 404);

        $roadmap = Roadmap::where('goal_id', $goal->_id)->first();

        $prompt  = $this->prompts->progressFeedback($goal, $request->mood, $request->note, $roadmap);
        $feedback = $this->claude->complete($prompt, 500);

        return response()->json(['feedback' => $feedback]);
    }

    // ─────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────

    private function findOwnedGoal(string $id): ?Goal
    {
        return Goal::where('_id', $id)->where('user_id', auth()->id())->first();
    }

    /**
     * Parse a JSON object from Claude's response.
     * Claude is instructed to return only JSON, but we strip any markdown fences.
     */
    private function parseJsonObject(string $raw): array
    {
        $clean = preg_replace('/```(?:json)?\s*([\s\S]*?)```/', '$1', $raw);
        $clean = trim($clean);

        // Find first { ... }
        $start = strpos($clean, '{');
        $end   = strrpos($clean, '}');
        if ($start !== false && $end !== false) {
            $jsonStr = substr($clean, $start, $end - $start + 1);
            $decoded = json_decode($jsonStr, true);
            if (json_last_error() === JSON_ERROR_NONE) return $decoded;
        }

        return ['raw_response' => $raw]; // fallback
    }

    /**
     * Parse a JSON array from Claude's response.
     * Supports both top-level arrays and arrays nested under a key.
     */
    private function parseJsonArray(string $raw, string $key = null): array
    {
        $obj = $this->parseJsonObject($raw);

        if ($key && isset($obj[$key]) && is_array($obj[$key])) {
            return $obj[$key];
        }

        // Top-level array
        $clean = preg_replace('/```(?:json)?\s*([\s\S]*?)```/', '$1', $raw);
        $clean = trim($clean);
        $start = strpos($clean, '[');
        $end   = strrpos($clean, ']');
        if ($start !== false && $end !== false) {
            $decoded = json_decode(substr($clean, $start, $end - $start + 1), true);
            if (json_last_error() === JSON_ERROR_NONE) return $decoded;
        }

        return [];
    }
}
