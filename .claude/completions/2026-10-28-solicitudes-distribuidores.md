# Solicitudes de distribuidores — 2026-10-28

- Formulario B2B de la landing ahora guarda en el servidor: POST /api/leads (honeypot website, límite 5/10 min por IP, validación).
- Almacén: src/lib/leads.server.ts → data/leads.json (gitignored, escritura atómica en cola). Ruta configurable con LEADS_FILE.
- Lectura/edición protegida con LEADS_ADMIN_KEY (header x-leads-key): GET /api/leads, PATCH|DELETE /api/leads/[id].
- Dashboard /dashboard/leads (solo Owner, permiso leads.manage): embudo 01 Recibida → 02 En contacto → 03 Distribuidor activo
  (+ Descartadas), tarjetas, detalle con llamar/WhatsApp/correo, asignar vendedor, notas, activar (crea cliente en el store), alta manual.
- Estado cliente en src/lib/leads.ts (zustand); contador de nuevas en el menú.
- La clave vive en /var/www/snapslide/.env.production del VPS; el Owner la ingresa una vez por dispositivo.

- 2026-10-28 (tarde): formulario B2B rediseñado como conversación (5 preguntas que se disuelven, panel que se llena de agua, credencial 3D 'Distribuidor oficial' que se completa en vivo y gira al enviar). Clase global `.field-bare` quita el contorno de foco a campos con indicador propio.
