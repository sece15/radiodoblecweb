# Mercado Pago: implementación y despliegue

Estado al 9 de octubre de 2026: implementación local verificada; despliegue remoto pendiente. El MCP de Supabase devuelve `Unknown tool` y la CLI devuelve `Invalid access token`. No se han realizado pagos reales ni alterado la base remota.

## Cambios implementados

- Un único checkout en `supabase/functions/mercadopago-checkout`. La ruta Next antigua devuelve 410 y no crea preferencias.
- Comprador obtenido con `auth.getUser` del JWT, rechazando invitados y cuentas sin perfil. El navegador manda exclusivamente paquete, UUID y origen; usa la clave pública de Supabase y la sesión del usuario.
- Precio y cantidad determinados por catálogo del servidor y persistidos antes de contactar Mercado Pago. Correo del comprador obtenido de Auth, sin dirección ficticia compartida.
- Orígenes exactos configurables, sin permitir todos los sitios de Vercel. URL de checkout limitada a dominios oficiales HTTPS.
- Los precios visibles se muestran en PEN/soles, la moneda que realmente cobra este checkout; se retiró la cifra en USD del modal.
- UUID conservado por usuario/paquete en la pestaña, incluso al recargar. Una operación SQL reclama la creación; ante resultado incierto se busca la preferencia por referencia, sin repetir ciegamente su creación. La cabecera de idempotencia es una protección adicional, no la garantía principal.
- Firma HMAC verificada con `x-signature`, `x-request-id` y `data.id` de la URL. Un evento firmado vuelve a consultarse en Mercado Pago. Se comprueban cuenta cobradora y preferencia asociada; SQL verifica monto, moneda, entorno y propietario de la compra persistida.
- Acreditación y recibo en una transacción con bloqueos, clave única por pago y vinculación permanente del pago que acreditó cada compra. Se rechazan segundos pagos para la misma compra, incluso después de una devolución. No se realizan créditos en el navegador.
- Reversiones completas y proporcionales para devoluciones parciales; contracargos revierten el crédito. Los eventos anteriores a la última actualización no sobrescriben el estado. Errores de base/API devuelven códigos que permiten reintentos, sin confirmar una acreditación fallida.
- Al regresar del checkout, la UI consulta recibos bajo RLS y refresca el perfil. Los parámetros de retorno no acreditan monedas ni prueban un pago. Se limpian temporizadores y listeners al desmontar. El pago abre en la misma pestaña para evitar bloqueadores de ventanas.
- Nuevas tablas exclusivas de Mercado Pago: `mp_checkout_orders`, `mp_payment_receipts`; escritura y funciones reservadas a `service_role` en servidor. Usuarios autenticados solo leen sus filas. No se modifica el flujo de `/saludos`.

## Orden de despliegue

1. Recuperar la sesión de Supabase mediante OAuth o `supabase login`, sin compartir tokens por chat. Confirmar el proyecto `skkwodwxaeajdaukjsqg` antes de cualquier cambio.
2. Inspeccionar el esquema real de `profiles`: `id` debe corresponder a Auth y `puntos_c` debe admitir el rango de monedas. Revisar sus restricciones, triggers y permisos; verificar también que el antiguo `increment_user_coins` no permita minting por `anon` o `authenticated`. No se revocan permisos a ciegas porque no se pudo inspeccionar el backend desplegado.
3. Revisar y aplicar `supabase/migrations/20261009191237_secure_mercadopago_checkout.sql` en staging mediante MCP o SQL Editor. Se probó la migración completa en PostgreSQL temporal. No aplicar otra vez si ya fue registrada/aplicada. Con CLI vinculada, revisar `supabase db push --dry-run` antes de `supabase db push`; no forzar migraciones históricas desconocidas.
4. Configurar en **Supabase Edge Function Secrets**, nunca en variables `NEXT_PUBLIC_`:

   | Nombre | Valor esperado |
   | --- | --- |
   | `MERCADO_PAGO_ACCESS_TOKEN` | Credencial de Mercado Pago para el entorno elegido |
   | `MERCADO_PAGO_WEBHOOK_SECRET` | Secreto de firma de la aplicación Mercado Pago |
   | `MERCADO_PAGO_COLLECTOR_ID` | ID de la cuenta vendedora/cobradora del entorno |
   | `MERCADO_PAGO_MODE` | `test` durante sandbox; `production` tras validación |
   | `MERCADO_PAGO_ALLOWED_ORIGINS` | Lista separada por comas de orígenes exactos, por ejemplo `https://radiodoblec.com,https://www.radiodoblec.com` y un preview propio si se necesita |

   `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` son variables de servidor proporcionadas por Supabase. No deben copiarse al navegador ni enviarse por chat. Si falta una configuración obligatoria, el checkout devuelve 503.

5. Desplegar la función después de la migración:

   ```powershell
   supabase functions deploy mercadopago-checkout --project-ref skkwodwxaeajdaukjsqg --use-api --no-verify-jwt
   ```

   `verify_jwt=false` es necesario para que Mercado Pago pueda entregar webhooks sin una sesión Supabase. El código verifica Auth en compras y HMAC en webhooks; no deja el checkout sin autenticación.
6. Configurar/simular notificaciones de **Payments** en la aplicación Mercado Pago usando `https://skkwodwxaeajdaukjsqg.supabase.co/functions/v1/mercadopago-checkout?action=webhook`. Deben incluir la firma y `data.id` en la URL. Verificar entregas y respuestas en el panel. El checkout también incluye `notification_url` en cada preferencia.
7. Desplegar el frontend en Vercel después del backend; comprobar origen exacto y sesión de usuario. En el navegador solo se necesitan la URL y clave pública/anon de Supabase, además de la sesión autenticada.
8. Ejecutar sandbox con comprador de prueba: aprobado, rechazado, pendiente, invitado, firma inválida, entrega repetida/simultánea, retorno móvil, pérdida de conexión, devolución parcial/completa y contracargo. Confirmar que el saldo y el recibo cambian una sola vez y que el usuario no puede escribir en las tablas ni invocar funciones de liquidación.

## Transición y operación

- Las compras anteriores usan referencias y registros diferentes. Inventariar y conciliar las pendientes antes de reemplazar la función; no migrarlas ni acreditarlas automáticamente. Los pagos antiguos con referencia no UUID se rechazan para conciliación manual y no vuelven a sumar monedas.
- Vigilar respuestas 409/503 y reintentos del proveedor. Un segundo pago de una compra ya acreditada necesita conciliación/devolución manual, no otro crédito automático.
- Si las monedas fueron gastadas y `profiles` prohíbe saldo negativo, una devolución que exceda el saldo falla y revierte toda la transacción. Debe resolverse con una política de deuda/revisión en el backend; no se oculta ni descuenta parcialmente la deuda. Esta condición debe verificarse en el esquema real antes de producción.
- Una creación incierta de preferencia nunca inicia otra automáticamente. Si la búsqueda no recupera exactamente una preferencia, la solicitud permanece bloqueada para reintento o revisión. No generar otro UUID para el mismo pago incierto.
- No cambiar de entorno sobre solicitudes ya iniciadas. Probar y desplegar en staging separado; mantener credenciales, firma y cuenta cobradora coherentes.

## Validación local reproducible

Resultados obtenidos: script de pagos PASS, TypeScript sin errores, ESLint sin errores y build de producción Next.js completado (9 rutas). Se verificaron lectura RLS del propietario y denegación para otro usuario, rechazo de sesión anónima, aislamiento entre compradores, y recuperación incierta sin crear otra preferencia. No se ejecutaron pagos sandbox contra Mercado Pago ni pruebas en un dispositivo móvil real.

```powershell
npm install --prefix node_modules/.mp-validation --ignore-scripts --no-audit --no-fund @electric-sql/pglite@0.3.14
node scripts/verify-mercadopago.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
```

El script verifica tipos del backend, HMAC y dominios; ejecuta la migración en PostgreSQL temporal y prueba estados, montos/monedas/entornos incorrectos, duplicados, segundo pago, eventos antiguos, devoluciones, contracargos, permisos/RLS y rollback ante error de saldo. Prueba el manejador Edge con Auth/API/base simuladas, identidad manipulada, recuperación de una preferencia y fallos reintentables. No contacta Mercado Pago ni Supabase. La prueba de múltiples entregas usa la cola de una conexión PGlite; la concurrencia entre conexiones independientes aún debe comprobarse en staging.

Fuentes oficiales: [Webhooks y firma](https://www.mercadopago.com.pe/developers/en/docs/checkout-pro-orders/resources/notifications/webhooks), [API de preferencias](https://www.mercadopago.com.pe/developers/en/reference/online-payments/checkout-pro-orders/overview), [autenticación de Edge Functions](https://supabase.com/docs/guides/functions/auth).
