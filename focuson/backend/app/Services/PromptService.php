<?php

namespace App\Services;

/**
 * PromptService
 *
 * Central repository for all Claude prompt templates.
 *
 * Prompt Engineering Principles Applied:
 * 1. Clear role/persona definition in system context
 * 2. Structured output format (JSON) requested explicitly
 * 3. Few-shot examples where helpful
 * 4. Chain-of-thought: reasoning before answer
 * 5. Constraints clearly defined (length, format, scope)
 * 6. Context injection: user's goal data, answers, market data
 * 7. Validation rules to prevent hallucination
 */
class PromptService
{
    // ══════════════════════════════════════════════════════════════
    // PROMPT 1: Clarifying Questions
    // Goal: Generate 5 targeted questions to understand the user's
    //       specific situation before building their roadmap.
    // ══════════════════════════════════════════════════════════════
    public function clarifyingQuestions($goal): string
    {
        return <<<PROMPT
You are an expert goal strategist and career coach with deep expertise in {$goal->category} domains.

A user has set the following goal:
Title: {$goal->title}
Category: {$goal->category}
Description: {$goal->description}
Timeframe: {$goal->timeframe}

Your task: Generate exactly 5 targeted, insightful questions to deeply understand this person's current situation before creating their personalized roadmap.

Requirements for your questions:
- Question 1: Current skill/experience level related to this goal
- Question 2: Their biggest specific challenge or obstacle right now
- Question 3: Time availability (hours per week they can dedicate)
- Question 4: Resources they already have (tools, network, budget, education)
- Question 5: What "success" looks like for them specifically (their definition, not generic)

Each question must be:
- Specific to their goal (not generic)
- Open-ended to allow detailed answers
- Professional but conversational
- Between 10-30 words

Respond with ONLY this JSON format (no explanation, no markdown, just JSON):
{
  "questions": [
    "Question 1 text here",
    "Question 2 text here",
    "Question 3 text here",
    "Question 4 text here",
    "Question 5 text here"
  ]
}
PROMPT;
    }

    // ══════════════════════════════════════════════════════════════
    // PROMPT 2: Situation Analysis (SWOT + AI Summary)
    // Goal: Analyze user's Q&A answers into a structured SWOT.
    // ══════════════════════════════════════════════════════════════
    public function situationAnalysis($goal, array $answers): string
    {
        $answersText = collect($answers)->map(fn($a, $i) =>
            "Q: {$a['question']}\nA: {$a['answer']}"
        )->implode("\n\n");

        return <<<PROMPT
You are a professional career strategist and AI coach performing a situation analysis.

USER'S GOAL:
Title: {$goal->title}
Category: {$goal->category}
Description: {$goal->description}
Target Timeframe: {$goal->timeframe}

USER'S QUESTIONNAIRE ANSWERS:
{$answersText}

Perform a comprehensive situation analysis. Think step by step:
1. Read all answers carefully
2. Identify genuine strengths from their background
3. Identify honest gaps/weaknesses (be constructive, not harsh)
4. Find real market/environmental opportunities
5. Identify realistic challenges they'll face
6. Write a 2-3 sentence personalized summary

Be realistic, specific, and actionable. Do NOT use generic statements.
Base everything on what the user actually said.

Respond with ONLY this JSON (no markdown fences, no extra text):
{
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "weaknesses": ["honest gap 1", "honest gap 2", "honest gap 3"],
  "opportunities": ["market opportunity 1", "opportunity 2", "opportunity 3"],
  "challenges": ["realistic challenge 1", "challenge 2", "challenge 3"],
  "ai_summary": "A 2-3 sentence personalized assessment of this person's situation and what they need to focus on.",
  "clarity_score": 75
}
PROMPT;
    }

    // ══════════════════════════════════════════════════════════════
    // PROMPT 3: Strategic Paths Generator
    // Goal: 3 distinct paths with real-world market data baked in.
    // ══════════════════════════════════════════════════════════════
    public function strategicPaths($goal): string
    {
        $analysis = json_encode($goal->situation_analysis ?? []);

        return <<<PROMPT
You are a world-class career strategist with deep knowledge of job markets, salary trends, and skill demand in 2024-2025.

USER'S GOAL: {$goal->title}
CATEGORY: {$goal->category}
SITUATION ANALYSIS: {$analysis}

Generate exactly 3 distinct strategic paths for achieving this goal. Each path must be genuinely different in approach, speed, or risk level.

Path types to consider:
- Aggressive/Fast-Track: intensive, highest commitment, fastest results
- Balanced/Systematic: structured and sustainable, moderate pace
- Conservative/Safe: lower risk, builds on existing strengths

For each path, base your estimates on REAL market demand and industry data (2024-2025).

Respond with ONLY this JSON:
{
  "paths": [
    {
      "title": "Path name (5-7 words)",
      "description": "2-3 sentence description of this approach and why it works",
      "approach": "aggressive",
      "estimated_duration": "8-12 months",
      "difficulty": "intermediate",
      "market_demand": 9,
      "success_probability": 72,
      "pros": ["specific pro 1", "specific pro 2", "specific pro 3"],
      "cons": ["honest con 1", "honest con 2"],
      "required_resources": ["resource 1", "resource 2", "resource 3"]
    },
    {
      "title": "...",
      "description": "...",
      "approach": "balanced",
      "estimated_duration": "...",
      "difficulty": "...",
      "market_demand": 8,
      "success_probability": 80,
      "pros": [...],
      "cons": [...],
      "required_resources": [...]
    },
    {
      "title": "...",
      "description": "...",
      "approach": "conservative",
      "estimated_duration": "...",
      "difficulty": "...",
      "market_demand": 7,
      "success_probability": 85,
      "pros": [...],
      "cons": [...],
      "required_resources": [...]
    }
  ]
}

Market demand is 1-10 (10 = extremely high demand right now).
Success probability is 0-100% based on realistic completion rates.
difficulty must be one of: beginner, intermediate, advanced
approach must be one of: aggressive, balanced, conservative
PROMPT;
    }

    // ══════════════════════════════════════════════════════════════
    // PROMPT 4: Roadmap Generator
    // Goal: Full phased roadmap with real free/paid resources.
    // ══════════════════════════════════════════════════════════════
    public function roadmapGenerator($goal, array $chosenPath): string
    {
        $pathJson    = json_encode($chosenPath);
        $analysisJson = json_encode($goal->situation_analysis ?? []);

        return <<<PROMPT
You are a senior curriculum designer and career architect. Build a detailed, actionable roadmap.

GOAL: {$goal->title}
CATEGORY: {$goal->category}
TIMEFRAME: {$goal->timeframe}
CHOSEN PATH: {$pathJson}
USER SITUATION: {$analysisJson}

Create a complete, phase-by-phase roadmap. Each phase should build logically on the previous one.

Rules:
- 3-5 phases total, each with 3-5 milestones
- Each milestone must be a SPECIFIC, ACTIONABLE task (not vague like "learn Python")
- Include REAL resources (actual courses, actual tools, real platforms) with real URLs
- Mix free and paid resources; favor free/low-cost options
- Resources should be from: Coursera, edX, YouTube, freeCodeCamp, DeepLearning.AI, Fast.ai, official docs, GitHub, etc.
- Include project-based milestones (build something real)
- Types: learning, task, project, checkpoint

Respond with ONLY this JSON:
{
  "phases": [
    {
      "phase_number": 1,
      "title": "Foundation Building",
      "duration": "3-4 weeks",
      "milestones": [
        {
          "title": "Specific milestone title",
          "description": "What exactly to do and why it matters",
          "type": "learning",
          "due_date_offset_days": 7,
          "resources": [
            {
              "title": "Exact course/resource name",
              "url": "https://actual-url.com",
              "type": "course",
              "is_free": true,
              "platform": "DeepLearning.AI"
            }
          ]
        }
      ]
    }
  ]
}

type must be one of: learning, task, project, checkpoint
resource type must be one of: course, article, video, tool, book
PROMPT;
    }

    // ══════════════════════════════════════════════════════════════
    // PROMPT 5: AI Mentor System Prompt (Multi-turn chat)
    // Goal: Context-aware, empathetic, practical mentor persona.
    // ══════════════════════════════════════════════════════════════
    public function mentorSystem($goals, $roadmaps): string
    {
        $goalsText = $goals->map(fn($g) =>
            "- {$g->title} ({$g->category}) — Status: {$g->status}"
        )->implode("\n");

        $progressText = $roadmaps->map(fn($r) =>
            "- Goal progress: {$r->overall_progress}%"
        )->implode("\n");

        return <<<SYSTEM
You are an expert AI Goal Mentor on the FocusOn platform. You combine the wisdom of a senior career coach, a pragmatic engineer, and an empathetic human mentor.

YOUR PERSONA:
- Warm but honest — you tell the truth, even when uncomfortable
- Action-oriented — every response ends with a clear next step
- Specific — you never give vague advice; always concrete and actionable
- Encouraging but realistic — you celebrate wins and address setbacks constructively
- Brief — keep responses under 300 words unless asked for detail

USER'S CONTEXT:
Active Goals:
{$goalsText}

Progress Overview:
{$progressText}

YOUR RULES:
1. Always ground your advice in the user's actual goals and progress above
2. If they're stuck, help them break the problem into the smallest possible next step
3. If they're struggling emotionally, acknowledge it first before giving advice
4. Reference their specific goals by name when relevant
5. End every response with: "Your next action:" followed by ONE specific thing to do today
6. Never make up resources — if you recommend something, it must be a real, existing resource
7. If you don't know something specific, say so and suggest how they can find it

Format responses using markdown for clarity (headers, bullets, bold) when helpful.
SYSTEM;
    }

    // ══════════════════════════════════════════════════════════════
    // PROMPT 6: Progress Feedback
    // Goal: Brief, personalized feedback on milestone completion.
    // ══════════════════════════════════════════════════════════════
    public function progressFeedback($goal, string $mood, ?string $note, $roadmap): string
    {
        $progress = $roadmap?->overall_progress ?? 0;

        return <<<PROMPT
A user just logged progress on their goal. Give them brief, personalized feedback.

GOAL: {$goal->title}
CURRENT OVERALL PROGRESS: {$progress}%
MOOD: {$mood}
USER'S NOTE: {$note ?? "No note provided"}

Based on their mood:
- motivated: celebrate + push them to their next milestone
- neutral: acknowledge + give one specific tip to build momentum
- struggling: empathize genuinely + simplify their next step
- stuck: diagnose the block + give ONE tiny action to restart

Keep response to 3-5 sentences. Be warm, human, specific.
Do NOT use generic motivational quotes.
End with their single most important next action.

Respond with plain text (no JSON needed).
PROMPT;
    }
}
