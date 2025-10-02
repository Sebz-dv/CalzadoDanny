<?php

return [
    'paths' => ['api/*'], // con esto basta si todas tus rutas están en routes/api.php
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true, // IMPORTANTE para cookies
];
