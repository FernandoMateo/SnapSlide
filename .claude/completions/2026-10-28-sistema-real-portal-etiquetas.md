# Sistema real: equipo, portal de clientes y etiquetas de lote — 2026-10-28

- Datos al servidor: `src/lib/db.server.ts` (JSON en memoria + escritura atómica en cola, seed con mocks la 1ª vez,
  contraseñas scrypt aparte en `auth`), `src/lib/engine.ts` (todas las acciones + `viewFor` por rol),
  `src/lib/session.server.ts` (cookie firmada, versión invalida sesiones al cambiar contraseña).
- API: `/api/auth/login|logout|password`, `/api/data`, `/api/action` (altas de usuario con contraseña temporal).
- Env obligatorias en producción: `SESSION_SECRET`, `SEED_PASSWORD` (contraseña inicial de usuarios demo; obligan a cambiarla).
  Local: `SEED_DEMO_PASSWORDS=1` usa las de `mockPasswords`.
- Roles: owner / seller / client (`clientId`). `can()` niega todo al cliente. Precio de pedidos lo fija el servidor.
- UI: `/dashboard/team` (alta/edición, contraseña temporal, desactivar, "Empezar a operar" = borrar datos de ejemplo),
  `/dashboard/team/[id]` y `/dashboard/profile` (perfil con métricas del vendedor + cambio de contraseña),
  `/portal` (catálogo, repetir último pedido, enviar), `/portal/orders`, `/portal/account`. Cambio de contraseña obligatorio.
- Inventario: tras un ingreso se abre `LabelDialog` (`src/components/inventory/LotLabel.tsx`): 15 medidas (térmicas, Brother,
  hojas Carta/A4), copias, vista previa, impresión con `@page` exacto; CODE128 de lote y SKU (JsBarcode). `ScanBox` busca
  por código (lector USB = teclado + Enter). Etiqueta reimprimible desde el historial.
- Verificado: scripts/escenarios en scratchpad `system.mjs` (seguridad por rol, flujo portal, etiqueta PDF 288×432 pt).
