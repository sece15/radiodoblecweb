# Validación de Mercado Pago — 9 de octubre de 2026

Resultado actualizado: correcciones implementadas y verificadas localmente. Pendiente aplicar la migración, desplegar la función y realizar una prueba integral en sandbox. No se realizaron pagos ni modificaciones remotas en Supabase.

La sección de hallazgos conserva la auditoría inicial como referencia. Su resolución y los pasos de despliegue se describen en `docs/mercadopago-despliegue.md`.

## Alcance y evidencias

- El botón de recarga llama a `supabase.functions.invoke('mercadopago-checkout')`; la ruta Next `/api/mercadopago/create-preference` no participa en este flujo.
- La función desplegada respondió OPTIONS 200 y rechazó un paquete inexistente con POST 400. Esta prueba usó únicamente la clave pública y no creó una preferencia.
- Inicialmente se revisó la copia local de la Edge Function, excluida de Git. La versión corregida ahora se incluye en Git. No se pudo comparar con el despliegue: el conector Supabase devolvió `Unknown tool` al listar proyectos y la sesión CLI respondió `Invalid access token`.
- Los hallazgos del backend descritos abajo corresponden a esa copia local; no certifican el contenido desplegado.

## Hallazgos de la auditoría inicial (corregidos localmente)

1. **Acreditación sin idempotencia transaccional** (Edge Function, líneas 103–128). Primero consulta el pago, después incrementa monedas y finalmente registra la transacción. Dos notificaciones simultáneas pueden incrementar dos veces. Además, ignora los errores devueltos por la consulta, RPC y escritura. Debe garantizarse una sola acreditación por ID de pago, junto con su registro, en una transacción del servidor.
2. **Firma del webhook sin verificar** (líneas 67–71). Solo registra que recibió `x-signature`; no calcula ni compara HMAC. Incluso acepta la rama webhook sin firma mediante `action=webhook`. Consultar el pago a Mercado Pago es una protección existente, pero no sustituye autenticar la notificación.
3. **No valida importe, moneda ni vinculación con una compra persistida** (líneas 94–114). Un pago `approved` y sus metadatos bastan para elegir usuario y paquete. Debe contrastar importe, PEN, entorno y referencia con la solicitud guardada antes de acreditar.
4. **Identidad recibida del navegador** (líneas 150 y 180; registro desde 247). No valida una sesión de usuario en el manejador: utiliza `userId` del cuerpo y permite referencia `guest`. Debe derivar el propietario de un JWT de usuario verificado; la clave anon no identifica a un comprador.
5. **Errores confirmados como recibidos sin recuperación durable** (líneas 87–91 y 139–143). Devuelve HTTP 200 cuando no puede consultar el pago o hay una excepción. Sin una cola o registro durable de reintentos, una compra puede quedar sin acreditar.

## Otros ajustes necesarios

- `CoinRechargeModal.tsx:44`: envía `oyente@radiodoblec.com` para todos los compradores. Usar el correo real de la sesión cuando corresponda, u omitir el dato si Mercado Pago lo permite.
- `CoinRechargeModal.tsx:49`: abre una ventana después de esperar la red y cierra el modal sin comprobar que se abrió. Puede fallar con bloqueadores de ventanas. Usar navegación en la misma pestaña o una apertura síncrona con recuperación visible.
- El modal no exige autenticación para iniciar la compra. El control definitivo debe estar también en la función.
- La transacción pendiente guarda el ID de preferencia en `payment_id`; el webhook busca allí el ID de pago. Separar ambos identificadores y reconciliar la compra original para evitar pendientes huérfanos.
- Las redirecciones aceptan cualquier subdominio `vercel.app`. Restringir a los dominios propios autorizados y HTTPS en producción.
- No hay manejo específico del resultado `recharge=success/failure/pending` en la interfaz. El saldo sí puede actualizarse al volver a la pestaña mediante el refresco de perfil existente; la URL de retorno nunca debe acreditar monedas.
- La copia revisada no procesa devoluciones ni contracargos; definir la reconciliación correspondiente.
- Mantener una sola implementación del checkout para evitar divergencias entre la ruta Next y la Edge Function.

## Protecciones existentes

El catálogo del servidor fija precio y monedas; el webhook consulta el pago en la API de Mercado Pago y solo intenta acreditar cuando su estado es `approved`. El navegador utiliza el cliente público de Supabase. No se encontraron claves privadas necesarias en el flujo del navegador revisado.

## Validación pendiente antes de producción

Confirmar el código desplegado, las restricciones de la base de datos y que Mercado Pago pueda entregar el webhook sin JWT de Supabase, con validación HMAC dentro de la función. Ejecutar en sandbox: compra aprobada con acreditación exacta; rechazo y pendiente sin crédito; invitado rechazado; importe/moneda incorrectos; firma ausente e inválida; notificación duplicada y simultánea; fallo temporal de Supabase; devolución; retorno desde móvil y bloqueo de ventanas.

Documentación oficial: https://www.mercadopago.com.pe/developers/en/docs/checkout-pro-orders/resources/notifications/webhooks
