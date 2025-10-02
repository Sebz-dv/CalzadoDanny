<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue; // 👈 para usar queue
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewOrderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $customer,
        public array $items,
        public int $total_cents,
        public ?string $orderCode = null,
    ) {}

    public function build()
    {
        return $this->markdown('emails.new_order', [
            'customer' => $this->customer,
            'items' => $this->items,
            'total_cents' => $this->total_cents,
            'orderCode' => $this->orderCode,
        ]);
    }
}
