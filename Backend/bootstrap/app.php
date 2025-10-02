<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\AttachJwtFromCookie;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'jwt.cookie' => AttachJwtFromCookie::class,
        ]);
        // Aquí también puedes registrar globales si algún día los necesitas:
        // $middleware->append(\Illuminate\Http\Middleware\TrustHosts::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Puedes dejarlo vacío. Solo tener este bloque ya inicializa el handler.
        // Si quieres, luego agregas renderables/reportables aquí.
    })
    
    ->create();
