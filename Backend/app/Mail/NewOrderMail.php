<?php

// app/Mail/NewOrderMail.php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewOrderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $customer,
        public array $items,
        public int   $total_cents,
        public ?string $orderCode = null,
        public ?string $adminUrl = null,
        public int $shipping_cents = 0,
        public int $discount_cents = 0,
    ) {}

    public function build()
    {
        return $this->subject($this->orderCode ? "Nueva orden #{$this->orderCode}" : "Nueva orden")
            ->view('emails.new_order') // 👈 tu vista HTML “email-client-proof”
            ->with([
                'customer'       => $this->customer,
                'items'          => $this->items,
                'total_cents'    => $this->total_cents,
                'orderCode'      => $this->orderCode,
                'adminUrl'       => $this->adminUrl,
                'shipping_cents' => $this->shipping_cents,
                'discount_cents' => $this->discount_cents,
            ]);
    }
}
