# Architecture Map

---

## Directory Structure

```
src/app/                 Rutas (App Router): / landing · /login · /dashboard/{,products,inventory,sales,sales/new,clients}
src/components/landing/  IntroSheet (animación de la hoja), Navbar, Hero, Manifesto, ProductShowcase, B2BSection, Footer
src/components/dashboard/ ui.tsx (Table, Drawer, StatusBadge, Segmented…), charts.tsx (SVG), ProductCodes
src/i18n/                es.ts (fuente + tipo Dictionary), en.ts, I18nProvider (useI18n: d, t, money, date)
src/lib/                 types.ts · business.ts (reglas puras) · store.ts (Zustand + persist) · dates.ts
src/mocks/               Base de datos demo generada con semilla, fechas relativas a hoy
supabase/schema.sql      Tablas + RLS para el backend real
```

## Key File Locations

- **Configuration**: `next.config.mjs`, `tsconfig.json`, `src/app/globals.css` (tokens Tailwind v4 en `@theme`)
- **Main entry**: `src/app/page.tsx` (landing), `src/app/dashboard/layout.tsx` (shell + guardia de sesión)
- **Business rules**: `src/lib/business.ts` (permisos `can()`, `visibleSales`, FEFO, comisiones, flujo de caja, CLV)
- **Tests**: ninguno aún

---

**Last Updated**: 2026-10-27
