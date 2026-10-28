# CLAUDE.md

**Quick-start guide for Claude Code - Complete details in linked docs**

---

## Project Overview

Snap Slide (Miami, FL · detergente en Hojas y Líquido): landing de lanzamiento pública + ERP/CRM privado con roles Owner (acceso total) y Vendedor (visión túnel: solo sus ventas). 100% bilingüe ES/EN. Datos mock en el navegador; backend previsto en Supabase (`supabase/schema.sql`). Detalle completo en `README.md`.

**Tech Stack**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Zustand

**Design**: Tech-clean. Celeste `#00BFFF` para acción/atención, blanco y vidrio esmerilado de fondo. Display Sora, texto Manrope. La intro de la home (`IntroSheet.tsx`) es la pieza prioritaria de la marca.

---

## Session Start Protocol ⚡

**MANDATORY** at start of each session:

```bash
# Load essential docs (~800 tokens - 2 min read)
✓ .claude/COMMON_MISTAKES.md      # ⚠️ CRITICAL - Read FIRST
✓ .claude/QUICK_START.md          # Essential commands
✓ .claude/ARCHITECTURE_MAP.md     # File locations
```

**At task completion:**
- Create completion doc in `.claude/completions/YYYY-MM-DD-task-name.md`
- Move session file to `.claude/sessions/archive/` (if created)

**⚠️ NEVER auto-load:**
- Files in `.claude/completions/` (0 token cost)
- Files in `.claude/sessions/` (0 token cost)
- Files in `docs/archive/` (0 token cost)

---

## Quick Start Commands

```bash
npm run dev        # http://localhost:3000
npm run typecheck
npm run build
```

---

**Last Updated**: 2026-10-28
**Optimized with**: [Claude Token Optimizer](https://github.com/nadimtuhin/claude-token-optimizer)
