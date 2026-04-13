<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;

/**
 * ClaudeService
 *
 * Wraps the Anthropic Claude API.
 * Provides two methods:
 *   - complete(): single-turn prompt → response
 *   - chat(): multi-turn conversation with system prompt
 *
 * Error handling: logs failures, throws RuntimeException on hard errors.
 * Rate limiting is enforced at the route level (20 req/min per user).
 */
class ClaudeService
{
    private Client $http;
    private string $model;
    private string $apiKey;
    private int    $lastTokenCount = 0;

    public function __construct()
    {
        $this->apiKey = config('services.anthropic.key');
        $this->model  = config('services.anthropic.model', 'claude-sonnet-4-20250514');

        $this->http = new Client([
            'base_uri' => 'https://api.anthropic.com/v1/',
            'timeout'  => 60,
            'headers'  => [
                'x-api-key'         => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ],
        ]);
    }

    /**
     * Single-turn completion.
     * Sends a user message and returns the assistant's text response.
     *
     * @param string $prompt      The full prompt (user message)
     * @param int    $maxTokens   Maximum tokens to generate
     * @param string $system      Optional system prompt
     */
    public function complete(string $prompt, int $maxTokens = 1000, string $system = ''): string
    {
        $body = [
            'model'      => $this->model,
            'max_tokens' => $maxTokens,
            'messages'   => [
                ['role' => 'user', 'content' => $prompt],
            ],
        ];

        if ($system) {
            $body['system'] = $system;
        }

        return $this->request($body);
    }

    /**
     * Multi-turn chat with system prompt.
     * Used for the AI mentor conversation.
     *
     * @param string $system   System prompt (context + persona)
     * @param array  $messages Array of {role, content} pairs
     * @param int    $maxTokens
     */
    public function chat(string $system, array $messages, int $maxTokens = 1500): string
    {
        $body = [
            'model'      => $this->model,
            'max_tokens' => $maxTokens,
            'system'     => $system,
            'messages'   => $messages,
        ];

        return $this->request($body);
    }

    /**
     * Returns token count from the last API call.
     * Useful for logging and cost tracking.
     */
    public function getLastTokenCount(): int
    {
        return $this->lastTokenCount;
    }

    // ─────────────────────────────────────────────────────────
    // Private: make the API request
    // ─────────────────────────────────────────────────────────

    private function request(array $body): string
    {
        try {
            $response = $this->http->post('messages', ['json' => $body]);
            $data     = json_decode($response->getBody()->getContents(), true);

            // Track token usage for cost monitoring
            $this->lastTokenCount = ($data['usage']['input_tokens'] ?? 0)
                                  + ($data['usage']['output_tokens'] ?? 0);

            // Extract text from the response content block
            $content = $data['content'] ?? [];
            foreach ($content as $block) {
                if ($block['type'] === 'text') {
                    return trim($block['text']);
                }
            }

            Log::warning('[ClaudeService] No text block in response', ['body' => $data]);
            return '';

        } catch (RequestException $e) {
            $status  = $e->getResponse()?->getStatusCode();
            $body    = $e->getResponse()?->getBody()->getContents();

            Log::error('[ClaudeService] API error', [
                'status'  => $status,
                'message' => $e->getMessage(),
                'body'    => $body,
            ]);

            // Surface rate limit errors as specific exceptions
            if ($status === 429) {
                throw new \RuntimeException('Claude API rate limit reached. Please wait a moment.');
            }
            if ($status === 401) {
                throw new \RuntimeException('Invalid Anthropic API key. Check your .env configuration.');
            }

            throw new \RuntimeException('AI service unavailable. Please try again.');
        }
    }
}
