<?php
/**
 * config/database.php (relevant MongoDB section)
 * Add this to the 'connections' array in your full database.php
 */
return [
    'default' => env('DB_CONNECTION', 'mongodb'),

    'connections' => [

        // ── MongoDB ──
        'mongodb' => [
            'driver'   => 'mongodb',
            'host'     => env('DB_HOST', '127.0.0.1'),
            'port'     => (int) env('DB_PORT', 27017),
            'database' => env('DB_DATABASE', 'focuson_db'),
            'username' => env('DB_USERNAME', ''),
            'password' => env('DB_PASSWORD', ''),
            'options'  => [
                'database' => env('DB_AUTHENTICATION_DATABASE', 'admin'),
            ],
            // For MongoDB Atlas, set MONGODB_URI in .env and use:
            // 'dsn' => env('MONGODB_URI'),
        ],

        // Keep SQLite for session/cache if needed
        'sqlite' => [
            'driver'                  => 'sqlite',
            'url'                     => env('DATABASE_URL'),
            'database'                => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix'                  => '',
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
        ],
    ],

    'migrations' => 'migrations',

    'redis' => [
        'client' => env('REDIS_CLIENT', 'phpredis'),
        'default' => [
            'host'     => env('REDIS_HOST', '127.0.0.1'),
            'password' => env('REDIS_PASSWORD'),
            'port'     => (int) env('REDIS_PORT', 6379),
            'database' => (int) env('REDIS_DB', 0),
        ],
    ],
];
