<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request; 
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactMessage;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'    => ['required', 'string', 'max:120'],
            'email'   => ['required', 'email', 'max:180'],
            'message' => ['required', 'string', 'max:3000'],
            // 'hp' => ['prohibited'], // honeypot opcional
        ]);
 
        $to = config('mail.from.address'); // o 'ventas@tu-dominio.com'
        Mail::to($to)->send(new ContactMessage($data));

        return response()->json([
            'ok' => true,
            'message' => 'Mensaje enviado'
        ]);
    }
}
