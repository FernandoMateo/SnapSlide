# Snap Slide — Landing + Sistema de Gestión

Plataforma de dos caras para **Snap Slide** (Miami, FL), productores de detergente en **Hojas** y **Líquido**:

1. **Landing de lanzamiento** (pública): intro animada de la hoja que se corta en la marca, hero 3D, showcase con scroll y sección B2B.
2. **Sistema ERP/CRM** (privado): se entra desde el botón **Portal de Vendedores** de la barra superior. El dashboard cambia según el rol: **Owner** o **Vendedor**.

Todo es bilingüe (ES/EN), con un selector de idioma siempre visible.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilos | Tailwind CSS v4 (tokens en `src/app/globals.css`) |
| Animación | Framer Motion |
| Estado | Zustand con persistencia en `localStorage` (simula el backend) |
| Códigos | `qrcode` (QR) y `jsbarcode` (CODE128) |
| Backend (siguiente paso) | Supabase / Postgres: esquema y RLS en `supabase/schema.sql` |

## Arquitectura de carpetas

```
src/
├── app/
│   ├── layout.tsx              # Fuentes, metadatos, proveedor de idioma
│   ├── globals.css             # Tokens de diseño (celeste #00BFFF, vidrio, alertas)
│   ├── page.tsx                # Landing: intro → hero → manifiesto → showcase → B2B
│   ├── login/page.tsx          # Ingreso al sistema (con accesos demo)
│   └── dashboard/
│       ├── layout.tsx          # Shell: sidebar, barra superior, guardia de sesión, nav móvil
│       ├── page.tsx            # Módulo A · Home (Owner / Vendedor)
│       ├── products/           # Módulo B · Productos (+ QR / código de barras)
│       ├── inventory/          # Módulo C · Inventario (monitor + entradas/salidas) — solo Owner
│       ├── sales/              # Módulo D · Historial de ventas con filtros
│       │   └── new/            #           · Punto de venta / carga de pedidos
│       └── clients/            # Módulo E · Clientes, estado de cuenta, CLV, cobranzas
├── components/
│   ├── brand/Logo.tsx          # Logo provisional (reemplazar por el oficial)
│   ├── landing/                # IntroSheet, Navbar, Hero, Manifesto, ProductShowcase, B2BSection…
│   ├── dashboard/              # ui (tablas, drawer, badges), charts (SVG), ProductCodes
│   └── LanguageToggle.tsx
├── i18n/                       # es.ts (fuente y tipos), en.ts, I18nProvider
├── lib/
│   ├── types.ts                # Modelo de datos
│   ├── business.ts             # Reglas de negocio puras: permisos, FEFO, comisiones, flujo de caja, CLV
│   ├── store.ts                # Estado global + acciones que validan permisos
│   └── dates.ts
└── mocks/index.ts              # mockUsers, mockProducts, mockClients, mockSales, pagos, gastos
supabase/schema.sql             # Tablas + Row Level Security para el backend real
```

## Reglas de negocio implementadas

- **Roles.** El **Owner** tiene acceso total: finanzas, costos, inventario, todas las ventas y filtros por vendedor y fecha. El **Vendedor** tiene *visión túnel*: solo ve sus propias ventas y comisiones. Las acciones del store validan permisos; no basta con esconder botones.
- **Inventario por lotes.** El stock es la suma de los lotes. Las ventas descuentan automáticamente en orden **FEFO** (primero el lote que vence antes). Un producto por debajo del **stock mínimo** parpadea en rojo o naranja.
- **Ventas.** Los estados son *Pendiente de pago → Pagada → Enviada*. Al marcar una orden como pagada se registra el cobro.
- **Comisiones.** Se calculan como tasa del vendedor × ventas del mes, separando la parte ya liquidable (órdenes cobradas).
- **Flujo de caja proyectado (30/60/90 días).** Parte del saldo actual, suma las facturas pendientes en la fecha en que cada cliente suele pagar y el ritmo de ventas, y resta el gasto promedio.
- **Clientes.** El CLV es el total histórico comprado. Se calcula el promedio de días que tarda en pagar y se muestran dos tablas conectadas a las órdenes: pagos realizados y facturas pendientes.

## Desarrollo local

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # build de producción
npm run typecheck
```

### Accesos demo

| Usuario | Email | Contraseña | Rol |
|---|---|---|---|
| Avril | avril@snapslide.com | snap2026 | Owner |
| Chris | chris@snapslide.com | snap2026 | Owner |
| Daniela Ruiz | daniela@snapslide.com | ventas2026 | Vendedor |
| Marco Silva | marco@snapslide.com | ventas2026 | Vendedor |
| Jessica Moore | jessica@snapslide.com | ventas2026 | Vendedor |

Los datos viven en el navegador. "Restaurar datos demo" (en la barra lateral) los regenera. La intro se muestra una vez por sesión; para volver a verla, abre una pestaña nueva o borra `sessionStorage`.

> ⚠️ El login demo **no es seguro**: las contraseñas están en el código para poder probar la interfaz. Antes de publicar con datos reales, conecta Supabase Auth y aplica `supabase/schema.sql`.

## Subir a GitHub

Repositorio: <https://github.com/FernandoMateo/SnapSlide>

```bash
# 1. Desde la carpeta del proyecto
git init
git branch -M main

# 2. Primer commit
git add .
git commit -m "feat: landing de lanzamiento y sistema de gestión Snap Slide"

# 3. Conectar el remoto y subir
git remote add origin https://github.com/FernandoMateo/SnapSlide.git
git push -u origin main
```

Si el repositorio de GitHub ya tiene commits (por ejemplo, un README creado desde la web), integra primero su historial:

```bash
git pull origin main --allow-unrelated-histories --no-rebase
git push -u origin main
```

`.gitignore` ya excluye `node_modules/`, `.next/`, `.env*` y `.claude/settings.local.json`.

## Despliegue (Vercel)

1. En <https://vercel.com/new>, importa el repositorio `FernandoMateo/SnapSlide`.
2. Vercel detecta Next.js automáticamente. No hace falta configurar nada mientras se usen los datos demo.
3. Al conectar el backend, agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ver `.env.example`).

## Conectar el backend (siguiente fase)

1. Crea un proyecto en Supabase y ejecuta `supabase/schema.sql`.
2. Cambia el `login` del store por Supabase Auth.
3. Reemplaza cada acción de `src/lib/store.ts` por la llamada equivalente (la firma de las acciones no cambia, así que la UI no se toca).
4. Mueve `createSale` a una función SQL transaccional que descuente los lotes en orden FEFO.

## Pendiente de la marca

- **Logo oficial.** `src/components/brand/Logo.tsx` es provisional. Reemplázalo manteniendo `<Logo />` y `<LogoMark />`.
- **Textos de producto.** Los beneficios ("Sin envase plástico rígido", "Fórmula concentrada", etc.) deben confirmarse con el equipo antes de publicar.
- **Formulario B2B.** Hoy solo muestra la confirmación; falta conectarlo a un endpoint (`TODO(backend)` en `B2BSection.tsx`).
