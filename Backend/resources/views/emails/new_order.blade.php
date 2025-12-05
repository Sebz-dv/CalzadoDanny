{{-- resources/views/emails/new_order_html.blade.php --}}
@php
    $items = is_iterable($items ?? null) ? $items : [];
    $customer = is_array($customer ?? null) ? $customer : [];
    $orderCode = $orderCode ?? null;
    $adminUrl = $adminUrl ?? null;
    $paymentMethod = $paymentMethod ?? null;
    $deliveryMethod = $deliveryMethod ?? null;
    $notes = $notes ?? null;

    $money = fn($v) => '$ ' . number_format((int) ($v ?? 0), 0, ',', '.');

    $subtotal =
        $subtotal ??
        array_reduce($items, fn($acc, $it) => $acc + (int) ($it['price_cents'] ?? 0) * (int) ($it['qty'] ?? 1), 0);

    $shipping = (int) ($shipping_cents ?? 0);
    $discount = (int) ($discount_cents ?? 0);
    $grandTotal = $total_cents ?? $subtotal + $shipping - $discount;

    // Paleta (comentarios para referencia)
    // --bg:     #FAEAD7
    // --fg:     #191410
    // --brand:  #48331E
    // --muted:  #F7F1E9
    // --border: #AC9484

@endphp
<!doctype html>
<html lang="es">

<head>
    <meta charset="utf-8">
    <title>{{ $orderCode ? "Nueva orden #{$orderCode}" : 'Nueva orden' }}</title>
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
        /* Responsive mínimo (soportado por la mayoría) */
        @media (max-width: 640px) {
            .container {
                width: 100% !important;
            }

            .px {
                padding-left: 12px !important;
                padding-right: 12px !important;
            }

            .py {
                padding-top: 12px !important;
                padding-bottom: 12px !important;
            }

            .stack td {
                display: block !important;
                width: 100% !important;
            }
        }

        /* Fix iOS auto-link colors */
        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
        }

        /* Dark-mode “manual” (algunos clientes lo respetan) */
        @media (prefers-color-scheme: dark) {

            body,
            .bg {
                background: #FAEAD7 !important;
                color: #191410 !important;
            }
        }
    </style>
</head>

<body
    style="margin:0; padding:0; background:#FAEAD7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; color:#191410; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
    <!-- Preheader (oculto) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
        {{ $orderCode ? "Nueva orden #{$orderCode}" : 'Nueva orden' }} — Resumen y detalles del pedido.
    </div>

    <!-- Wrapper -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="bg"
        style="background:#FAEAD7;">
        <tr>
            <td align="center" class="px" style="padding:24px 12px;">
                <!-- Container -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640"
                    class="container" style="width:640px; max-width:100%; background:#FAEAD7;">
                    <!-- Header -->
                    <tr>
                        <td align="left" style="padding:4px 4px 12px 4px;">
                            <a href="{{ config('app.url') }}" style="text-decoration:none; color:#48331E;">
                                <img src="{{ $message->embed(public_path('storage/logo/logoBlack.png')) }}"
                                    alt="{{ config('app.name') }}" width="240" height="120"
                                    style="display:block; border:0; outline:none;">
                            </a>
                        </td>
                    </tr>

                    <!-- Title -->
                    <tr>
                        <td style="padding:8px 4px 0 4px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="left" style="padding:0;">
                                        <h1 style="margin:0; font-size:22px; line-height:1.25; color:#191410;">
                                            Nueva orden
                                        </h1>
                                    </td>
                                    <td align="right" style="padding:0; white-space:nowrap;">
                                        @if ($orderCode)
                                            <div
                                                style="font-weight:700; color:#48331E; font-size:18px; line-height:1.25;">
                                                #{{ $orderCode }}
                                            </div>
                                        @endif
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Panel Cliente / Envío / Detalles -->
                    <tr>
                        <td style="padding:8px 0;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                                style="background:#F7F1E9; border:1px solid #AC9484; border-radius:8px;">
                                <tr>
                                    <td style="padding:16px;">
                                        <div style="font-weight:700; margin:0 0 8px 0; color:#191410;">Cliente</div>
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                                            style="font-size:14px; line-height:1.5;">
                                            <tr>
                                                <td style="padding:2px 0; width:140px; color:#48331E;">
                                                    <strong>Correo:</strong>
                                                </td>
                                                <td style="padding:2px 0; color:#191410;">
                                                    {{ $customer['email'] ?? '—' }}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:2px 0; color:#48331E;"><strong>Celular:</strong></td>
                                                <td style="padding:2px 0; color:#191410;">
                                                    {{ $customer['phone'] ?? '—' }}</td>
                                            </tr>
                                        </table>

                                        <div style="font-weight:700; margin:12px 0 8px 0; color:#191410;">Envío</div>
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                                            style="font-size:14px; line-height:1.5;">
                                            <tr>
                                                <td style="padding:2px 0; width:140px; color:#48331E;">
                                                    <strong>Dirección:</strong>
                                                </td>
                                                <td style="padding:2px 0; color:#191410;">
                                                    {{ $customer['address'] ?? '—' }}</td>
                                            </tr>
                                        </table>

                                        @if ($paymentMethod || $deliveryMethod)
                                            <div style="font-weight:700; margin:12px 0 8px 0; color:#191410;">Detalles
                                            </div>
                                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                                                style="font-size:14px; line-height:1.5;">
                                                <tr>
                                                    <td style="padding:2px 0; width:140px; color:#48331E;">
                                                        <strong>Pago:</strong>
                                                    </td>
                                                    <td style="padding:2px 0; color:#191410;">
                                                        {{ $paymentMethod ?? '—' }}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:2px 0; color:#48331E;"><strong>Entrega:</strong>
                                                    </td>
                                                    <td style="padding:2px 0; color:#191410;">
                                                        {{ $deliveryMethod ?? '—' }}</td>
                                                </tr>
                                            </table>
                                        @endif
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Tabla items -->
                    <tr>
                        <td style="padding:6px 0;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                                style="background:#F7F1E9; border:1px solid #AC9484; border-radius:8px;">
                                <tr>
                                    <th align="left"
                                        style="padding:10px; border-bottom:1px solid #AC9484; font-size:14px; color:#191410;">
                                        Producto</th>
                                    <th align="right"
                                        style="padding:10px; border-bottom:1px solid #AC9484; font-size:14px; color:#191410;">
                                        Unitario</th>
                                    <th align="center"
                                        style="padding:10px; border-bottom:1px solid #AC9484; font-size:14px; color:#191410;">
                                        Cant.</th>
                                    <th align="right"
                                        style="padding:10px; border-bottom:1px solid #AC9484; font-size:14px; color:#191410;">
                                        Total</th>
                                </tr>
                                @forelse($items as $idx => $it)
                                    @php
                                        $name = $it['name'] ?? 'Producto';
                                        $ref = $it['referencia'] ?? null; // 👈 referencia por ítem
                                        $size = !empty($it['size']) ? " (Talla {$it['size']})" : '';
                                        $color = !empty($it['color']) ? ' – ' . ucfirst($it['color']) : '';
                                        $unit = (int) ($it['price_cents'] ?? 0);
                                        $qty = (int) ($it['qty'] ?? 1);
                                        $rowBg = $idx % 2 === 1 ? '#FFF9F3' : '#F7F1E9'; // zebra suave
                                    @endphp
                                    <tr style="background: {{ $rowBg }};">
                                        <td style="padding:10px; border-bottom:1px solid #E5D7CB; color:#191410;">
                                            {{-- Nombre + referencia + talla + color --}}
                                            {{ $name }}
                                            @if (!empty($ref))
                                                ({{ $ref }})
                                            @endif
                                            {{ $size }}{{ $color }}
                                        </td>
                                        <td align="right"
                                            style="padding:10px; border-bottom:1px solid #E5D7CB; color:#191410;">
                                            {{ $money($unit) }}</td>
                                        <td align="center"
                                            style="padding:10px; border-bottom:1px solid #E5D7CB; color:#191410;">
                                            {{ $qty }}</td>
                                        <td align="right"
                                            style="padding:10px; border-bottom:1px solid #E5D7CB; color:#191410; font-weight:700;">
                                            {{ $money($unit * $qty) }}</td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="4" style="padding:10px; color:#6b6159;">(Sin ítems)</td>
                                    </tr>
                                @endforelse
                            </table>
                        </td>
                    </tr>

                    <!-- Totales -->
                    <tr>
                        <td style="padding:6px 0;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                                style="background:#F7F1E9; border:1px solid #AC9484; border-radius:8px;">
                                <tr>
                                    <td style="padding:10px; color:#191410;"><strong>Subtotal</strong></td>
                                    <td align="right" style="padding:10px; color:#191410;">{{ $money($subtotal) }}
                                    </td>
                                </tr>
                                @if ($shipping > 0)
                                    <tr>
                                        <td style="padding:10px; color:#191410;"><strong>Envío</strong></td>
                                        <td align="right" style="padding:10px; color:#191410;">
                                            {{ $money($shipping) }}</td>
                                    </tr>
                                @endif
                                @if ($discount > 0)
                                    <tr>
                                        <td style="padding:10px; color:#191410;"><strong>Descuento</strong></td>
                                        <td align="right" style="padding:10px; color:#191410;">
                                            -{{ $money($discount) }}</td>
                                    </tr>
                                @endif
                                <tr>
                                    <td style="padding:10px; color:#191410; font-weight:700;"><strong>Total a
                                            pagar</strong></td>
                                    <td align="right" style="padding:10px; color:#191410; font-weight:700;">
                                        {{ $money($grandTotal) }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Botón Pagar ahora --}}
                    @php
                        // Ya te llega $payUrl desde el Mailable; no hay $order aquí.
                        $payUrl = $payUrl ?? null;
                    @endphp
                    @if (!empty($payUrl))
                        <tr>
                            <td align="center" style="padding:16px 0;">
                                <!--[if mso]>
                                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{ $payUrl }}" arcsize="10%" strokecolor="#48331E" fillcolor="#48331E" style="height:44px;v-text-anchor:middle;width:260px;">
                                    <w:anchorlock/>
                                    <center style="color:#ffffff; font-family:Arial,sans-serif; font-size:16px; font-weight:600;">
                                        Pagar ahora
                                    </center>
                                    </v:roundrect>
                                    <![endif]-->
                                <!--[if !mso]><!-- -->
                                <a href="{{ $payUrl }}"
                                    style="background:#48331E; color:#ffffff; text-decoration:none; display:inline-block; padding:12px 18px; border-radius:6px; font-weight:600; border:1px solid #48331E;">
                                    Pagar ahora
                                </a>
                                <!--<![endif]-->
                            </td>
                        </tr>
                    @endif

                    <!-- Notas -->
                    @if ($notes)
                        <tr>
                            <td style="padding:6px 0;">
                                <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                                    style="background:#FFF9F3; border:1px dashed #AC9484; border-radius:8px;">
                                    <tr>
                                        <td style="padding:12px; color:#191410;">
                                            <div style="font-weight:700; margin-bottom:6px;">Notas del cliente</div>
                                            <div style="white-space:pre-wrap;">{{ $notes }}</div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    @endif

                    <!-- Botón Admin (bulletproof) -->
                    @if (!empty($adminUrl))
                        <tr>
                            <td align="center" style="padding:16px 0;">
                                <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{ $adminUrl }}" arcsize="10%" strokecolor="#48331E" fillcolor="#48331E" style="height:44px;v-text-anchor:middle;width:260px;">
                    <w:anchorlock/>
                    <center style="color:#ffffff; font-family:Arial,sans-serif; font-size:16px; font-weight:600;">
                      Ver pedido en el Admin
                    </center>
                  </v:roundrect>
                  <![endif]-->
                                <![if !mso]><!-- -->
                                <a href="{{ $adminUrl }}"
                                    style="background:#48331E; color:#ffffff; text-decoration:none; display:inline-block; padding:12px 18px; border-radius:6px; font-weight:600; border:1px solid #48331E;">
                                    Ver pedido en el Admin
                                </a>
                                <!--<![endif]-->
                            </td>
                        </tr>
                    @endif

                    <!-- Footer -->

                </table>
            </td>
        </tr>
    </table>
</body>

</html>
