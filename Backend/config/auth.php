<?php

return [
    'defaults' => [
        'guard' => env('AUTH_GUARD', 'api'),    // ok si quieres usar JWT por defecto
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'),
    ],

    'guards' => [
        // Guard para sesiones (Blade, etc.)
        'web' => [
            'driver'   => 'session',
            'provider' => 'users',
        ],

        // Guard para API con JWT (EL QUE FALTABA)
        'api' => [
            'driver'   => 'jwt',      // requiere php-open-source-saver/jwt-auth
            'provider' => 'users',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model'  => env('AUTH_MODEL', App\Models\User::class),
        ],
        // Si usaras DB en vez de Eloquent:
        // 'users' => ['driver' => 'database', 'table' => 'users'],
    ],

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table'    => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
            'expire'   => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),
];
