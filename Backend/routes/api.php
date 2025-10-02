<?php

use Illuminate\Support\Facades\Route;
// routes/api.php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CarruselController;
use App\Http\Controllers\ProfileController;

Route::post('register', [AuthController::class, 'register']);
Route::post('login',    [AuthController::class, 'login']);

Route::post('refresh',  [AuthController::class, 'refresh'])->middleware('jwt.cookie');
Route::post('logout',   [AuthController::class, 'logout'])->middleware('jwt.cookie');

Route::middleware(['jwt.cookie', 'auth:api'])->group(function () {
    Route::get('me',        [AuthController::class, 'me']); 
    Route::get('profile',          [ProfileController::class, 'show']);
    Route::put('profile',          [ProfileController::class, 'update']);
    Route::put('profile/password', [ProfileController::class, 'updatePassword']);
    Route::get('/admin/slides', [CarruselController::class, 'index']);
    Route::post('/admin/slides', [CarruselController::class, 'store']);
    Route::post('/admin/slides/reorder', [CarruselController::class, 'reorder']);
    Route::patch('/admin/slides/{slide}', [CarruselController::class, 'update']);
    Route::patch('/admin/slides/{slide}/toggle', [CarruselController::class, 'toggle']);
    Route::delete('/admin/slides/{slide}', [CarruselController::class, 'destroy']);
});

// Público (lo que consume tu carrusel)
Route::get('/slides', [CarruselController::class, 'publicIndex']);
 