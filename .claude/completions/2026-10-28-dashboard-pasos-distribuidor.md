# Dashboard moderno, logo celeste y sección "3 pasos" — 2026-10-28

- Logo (`Logo.tsx`, tono dark): degradado celeste oscuro `#035e94` → `#0096d6` → `#3fd0ff`.
- Nueva sección `src/components/landing/DistributorSteps.tsx` (entre StudioSection y B2BSection, `#distribuidor`):
  sticky de 320svh, el scroll activa 3 pasos; número gigante que se disuelve y iPhone CSS con pantallas animadas
  (formulario, aprobación + precio difuminado, pedido entregado + ventas). Textos en `d.steps` (es/en).
- Dashboard: sidebar oscuro flotante con pill degradado, header de vidrio, nav móvil flotante, `.card` y `.dash-bg`
  en `globals.css`, tarjetas de ingresos/comisión con degradado celeste, Segmented con degradado.
- Despliegue: push a GitHub + deploy automático al VPS (ver memoria del proyecto).
