# Common Mistakes

**⚠️ CRITICAL - Read at session start**

---

## Top 5 Critical Mistakes

### 1. Selectores de Zustand que devuelven objetos o arreglos nuevos

**Symptom**: bucle infinito / "getSnapshot should be cached".
**Check**: `useStore((s) => s.db.users.filter(...))`.
**Fix**: seleccionar la referencia estable (`s.db.users`) y filtrar fuera del selector.

### 2. Clases de escala de Tailwind v4 en elementos animados por Framer Motion

**Symptom**: el elemento nunca aparece (queda en escala 0).
**Check**: `scale-0`, `scale-y-0` en un nodo que Framer anima con `scale`/`scaleY`. Tailwind v4 usa la propiedad CSS `scale`, Framer usa `transform`: se multiplican.
**Fix**: estado inicial en `style={{ transform: "scale(0)" }}`.

### 3. Texto fijo sin pasar por el diccionario

**Symptom**: un texto queda en español con la UI en inglés.
**Fix**: agregar la clave en `src/i18n/es.ts` **y** `en.ts` (el tipo `Dictionary` obliga a mantener ambos iguales).

### 4. Permisos solo en la UI

**Fix**: toda acción nueva del store debe validar con `can()` / `canEditSale()` como las existentes; en backend, replicar en las API rules de `pocketbase/pb_migrations` (nueva migración, no editar la ya aplicada). En `pb_hooks`, cada handler corre aislado: no puede usar variables o funciones definidas fuera de él.

### 5. Cambiar la forma de los mocks sin subir la versión de persistencia

**Symptom**: el navegador sigue mostrando datos viejos.
**Fix**: subir `name: "snapslide-demo-vN"` en `src/lib/store.ts`.

---

**Last Updated**: 2026-10-27
