@php
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $msg = $data['message'] ?? '';
@endphp

<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Nuevo mensaje de contacto</title>
</head>

<body
    style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background:#f6f6f6; padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" role="presentation"
                    style="background:#ffffff;border-radius:12px;padding:24px;">
                    <tr>
                        <td>
                            <h1 style="margin:0 0 12px;font-size:20px;color:#1f2937;">Nuevo mensaje de contacto</h1>
                            <p style="margin:0 0 8px;color:#374151;"><strong>De:</strong> {{ $name }}
                                &lt;{{ $email }}&gt;</p>
                            <p
                                style="white-space:pre-wrap;color:#111827;line-height:1.5;border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#fafafa;">
                                {{ $msg }}
                            </p>
                            <p style="margin-top:16px;color:#6b7280;font-size:12px;">Recibido desde el sitio web.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
