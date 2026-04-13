<?php
/**
 * config/services.php
 * Third-party service credentials.
 * Values pulled from .env (never hardcode secrets).
 */
return [
    'mailgun'   => ['domain' => env('MAILGUN_DOMAIN'), 'secret' => env('MAILGUN_SECRET'), 'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net')],
    'postmark'  => ['token'  => env('POSTMARK_TOKEN')],
    'ses'       => ['key'    => env('AWS_ACCESS_KEY_ID'), 'secret' => env('AWS_SECRET_ACCESS_KEY'), 'region' => env('AWS_DEFAULT_REGION', 'us-east-1')],

    // ── Anthropic / Claude ──
    'anthropic' => [
        'key'        => env('ANTHROPIC_API_KEY'),
        'model'      => env('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514'),
        'max_tokens' => (int) env('ANTHROPIC_MAX_TOKENS', 2048),
        'api_url'    => env('ANTHROPIC_API_URL', 'https://api.anthropic.com/v1/messages'),
    ],
];
