<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Cookie;
// 👇 importa el guard JWT
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\JWTGuard;

class AuthController extends Controller
{
    private function tokenCookie(string $token): Cookie
    {
        // En dev: SameSite=Lax, Secure=false. En prod: None+Secure=true.
        $isProd   = app()->environment('production');
        $domain   = config('session.domain'); // null en dev
        $secure   = $isProd;
        $sameSite = $isProd ? 'none' : 'lax';

        return cookie(
            'token',
            $token,
            60,
            '/',
            $domain,
            $secure,
            true,   // HttpOnly
            false,  // raw
            $sameSite
        );
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'], // ← sin Hash::make
        ]);

        /** @var JWTGuard $guard */
        $guard = Auth::guard('api');
        $token = $guard->login($user); // string

        return response()->json(['user' => $user])
            ->cookie($this->tokenCookie($token));
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        /** @var JWTGuard $guard */
        $guard = Auth::guard('api');

        if (!$token = $guard->attempt($credentials)) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }

        return response()->json(['user' => $guard->user()])
            ->cookie($this->tokenCookie($token));
    }

    public function me()
    {
        /** @var JWTGuard $guard */
        $guard = Auth::guard('api');
        return response()->json($guard->user());
    }

    public function refresh()
    {
        /** @var JWTGuard $guard */
        $guard = Auth::guard('api');
        $newToken = $guard->refresh(); // ahora Intelephense no se queja

        return response()->json(['status' => 'ok'])
            ->cookie($this->tokenCookie($newToken));
    }

    public function logout()
    {
        /** @var JWTGuard $guard */
        $guard = Auth::guard('api');

        try {
            // invalida solo si hay token y el blacklist está activo
            if (config('jwt.blacklist_enabled') && $guard->getToken()) {
                $guard->logout();
            }
        } catch (JWTException $e) {
            // token ausente/expirado/ya invalidado → ignoramos
            Log::warning('JWT logout warning: ' . $e->getMessage());
        } catch (\Throwable $e) {
            Log::warning('Logout throwable: ' . $e->getMessage());
        }

        $isProd   = app()->environment('production');
        $domain   = config('session.domain');
        $secure   = $isProd;
        $sameSite = $isProd ? 'none' : 'lax';

        return response()->json(['status' => 'logged_out'])
            ->cookie('token', '', -1, '/', $domain, $secure, true, false, $sameSite);
    }
}
