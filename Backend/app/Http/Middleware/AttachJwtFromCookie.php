<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AttachJwtFromCookie
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->bearerToken()) {
            $token = $request->cookie('token');
            if ($token) {
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }

        return $next($request);
    }
}
