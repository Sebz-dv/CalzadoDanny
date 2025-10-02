<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Puedes sobreescribir con variables de entorno si quieres
        $name  = env('SEED_ADMIN_NAME', 'Admin');
        $email = env('SEED_ADMIN_EMAIL', 'admin@example.com');
        $pass  = env('SEED_ADMIN_PASS', 'Admin12320*'); // OJO: sin Hash::make si usas cast 'hashed'

        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => $pass]
        );

        // Si ya existía y quieres asegurarte del password:
        if ($user->wasRecentlyCreated === false) {
            $user->update(['password' => $pass]);
        }

        // (Opcional) Si usas Spatie\Permission y tienes el rol creado:
        if (method_exists($user, 'assignRole')) {
            try {
                $user->assignRole('admin');
            } catch (\Throwable $e) {
                // Si no existe el rol, lo ignoramos en el seeder
            }
        }
    }
}
