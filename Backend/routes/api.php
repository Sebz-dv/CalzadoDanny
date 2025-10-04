<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CarruselController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;

// ---------- Auth pública ----------
Route::post('register', [AuthController::class, 'register']);
Route::post('login',    [AuthController::class, 'login']);
Route::post('refresh',  [AuthController::class, 'refresh'])->middleware('jwt.cookie');
Route::post('logout',   [AuthController::class, 'logout'])->middleware('jwt.cookie');

// ---------- Público ----------
Route::get('/slides', [CarruselController::class, 'publicIndex']);

// 🚀 Público: categorías (lo que consume tu landing / grid)
Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{category}', [CategoryController::class, 'show']);

// 🚀 Público: productos (lo que consume tu landing / grid)
Route::get('products', [ProductController::class, 'index']);
Route::get('products/{product:slug}', [ProductController::class, 'show']);

// 🚀 Público: checkout (lo que consume tu landing / grid)
Route::post('/checkout', [CheckoutController::class, 'store']);

Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:5,1');


// ---------- Privado (JWT) ----------
Route::middleware(['jwt.cookie', 'auth:api'])->group(function () {
    Route::get('me', [AuthController::class, 'me']);

    Route::get('profile',          [ProfileController::class, 'show']);
    Route::put('profile',          [ProfileController::class, 'update']);
    Route::put('profile/password', [ProfileController::class, 'updatePassword']);

    // Admin slides
    Route::get('/admin/slides',                 [CarruselController::class, 'index']);
    Route::post('/admin/slides',                [CarruselController::class, 'store']);
    Route::post('/admin/slides/reorder',        [CarruselController::class, 'reorder']);
    Route::patch('/admin/slides/{slide}',       [CarruselController::class, 'update']);
    Route::patch('/admin/slides/{slide}/toggle', [CarruselController::class, 'toggle']);
    Route::delete('/admin/slides/{slide}',      [CarruselController::class, 'destroy']);

    // Admin categorías (protegidas). Evita duplicar las GET públicas.
    Route::apiResource('categories', CategoryController::class)->except(['index', 'show']);
    Route::patch('categories/{category}/toggle', [CategoryController::class, 'toggle']);

    // Admin productos (protegidos). Evita duplicar las GET públicas.
    Route::post('products', [ProductController::class, 'store']);
    Route::put('products/{product}', [ProductController::class, 'update']);
    Route::post('products/{product}', [ProductController::class, 'update']); // _method=PUT
    Route::delete('products/{product}', [ProductController::class, 'destroy']);
});
