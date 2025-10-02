{{-- resources/views/emails/new_order.blade.php --}}
@component('mail::message')
    # Nueva orden @if (!empty($orderCode))
        **#{{ $orderCode }}**
    @endif

    **Correo:** {{ $customer['email'] }}
    **Celular:** {{ $customer['phone'] }}
    **Dirección:** {{ $customer['address'] }}

    @component('mail::table')
        | Producto | Cant. | Precio |
        |:--|:--:|--:|
        @foreach ($items as $it)
            | {{ $it['name'] }} @if (!empty($it['size']))
                (Talla {{ $it['size'] }})
                @endif @if (!empty($it['color']))
                    - {{ ucfirst($it['color']) }}
                @endif | {{ $it['qty'] }} | $ {{ number_format($it['price_cents'], 0, ',', '.') }} |
            @endforeach
            | **Total** | | **$ {{ number_format($total_cents, 0, ',', '.') }}** |
        @endcomponent

        Gracias,<br>
        {{ config('app.name') }}
    @endcomponent
