# AUDITORÍA DE CÓDIGO - JAHATELO
**Fecha:** 2026-02-24
**Análisis completo de conflictos y código no utilizado**

---

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. **CONFLICTO DE RUTAS: `/ciudades` vs `/ciudad`**

**Problema:** Existen DOS sistemas de rutas para ciudades que COLISIONAN:

#### Sistema ANTIGUO (obsoleto):
```
/app/ciudades/page.tsx          → Lista de todas las ciudades
/app/ciudades/[name]/page.tsx   → Moteles por ciudad
```

#### Sistema NUEVO (SEO optimizado):
```
/app/ciudad/[ciudad]/page.tsx               → Moteles por ciudad
/app/ciudad/[ciudad]/[barrio]/page.tsx      → Moteles por ciudad y barrio
```

**Impacto:**
- ❌ URLs duplicadas para la misma funcionalidad
- ❌ Confusión de SEO (Google indexará ambas)
- ❌ Mantenimiento duplicado
- ❌ El sitio responde en 2 URLs diferentes para lo mismo

**Referencias que usan el sistema ANTIGUO:**
- `app/page.tsx:169` - Link en categorías
- `app/page.tsx:216` - Link "Ver todas las ciudades"
- `components/public/CityListWithAds.tsx:27` - Cards de ciudades
- `app/ciudades/[name]/page.tsx:58,91` - Links internos

**Solución requerida:**
- ✅ Mantener `/ciudad` (nuevo, mejor SEO, más escalable)
- ❌ ELIMINAR `/ciudades` (viejo, menos funcional)
- 🔄 ACTUALIZAR todos los links a `/ciudad`

---

### 2. **CÓDIGO POTENCIALMENTE NO UTILIZADO**

#### APIs que pueden estar sin uso:
Necesita verificación manual:
- `/api/auth/verify` - ¿Se usa en el frontend?
- `/api/admin/roles` - ¿Hay UI para roles?
- Varios endpoints de admin que pueden no tener UI

---

### 3. **DEPENDENCIAS POTENCIALMENTE INNECESARIAS**

#### En `package.json` web:
```json
{
  "@react-oauth/google": "^0.12.1",  // ✅ USADA (login Google web)
  "mercadopago": "..."               // ⚠️ Verificar si se usa
}
```

**Observabilidad externa:** Sentry fue retirado completamente el 13/09/2026. Ver `DT-002`.

**MercadoPago:** Necesita verificarse si hay implementación real

---

### 4. **ARCHIVOS DE CONFIGURACIÓN DUPLICADOS O INNECESARIOS**

✅ No se encontraron `.backup`, `.old`, `.copy` en el código fuente

---

### 5. **COMPONENTES CON POSIBLE SOBREESCRITURA**

No se encontraron componentes duplicados con el mismo nombre.

---

### 6. **CONSOLE.LOGS Y CÓDIGO DE DEBUG**

Buscar y eliminar antes de producción:
```bash
grep -r "console.log" app/ components/ lib/ --include="*.ts" --include="*.tsx"
```

---

## ✅ ACCIONES RECOMENDADAS (PRIORIDAD)

### ALTA PRIORIDAD:
1. **Eliminar sistema `/ciudades` y migrar todo a `/ciudad`**
   - Actualizar 5 referencias en el código
   - Eliminar carpeta `app/ciudades/`
   - Agregar redirect 301 en `next.config.js`

2. **Mantener la decisión de observabilidad vigente:**
   - No reinstalar Sentry u otro SDK sin cumplir las condiciones de `DT-002`.

3. **Verificar uso de MercadoPago**
   - Si no se usa, remover dependencia
   - Si se usa parcialmente, completar implementación

### MEDIA PRIORIDAD:
4. Limpiar console.logs y código de debug
5. Verificar APIs sin UI correspondiente
6. Documentar rutas y endpoints actuales

### BAJA PRIORIDAD:
7. Audit de dependencias con `npm audit`
8. Análisis de bundle size con `@next/bundle-analyzer`

---

## 📊 MÉTRICAS DEL PROYECTO

- **Total archivos TS/TSX:** ~139
- **Rutas públicas:** ~15
- **Rutas admin:** ~20+
- **Componentes:** ~50+

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **COMPLETADO:** Resolver conflicto `/ciudades` vs `/ciudad`
2. ✅ **COMPLETADO:** Sentry retirado de web y apps; decisión registrada en `DT-002`
3. ✅ **COMPLETADO:** Eliminación completa de MercadoPago del sistema
4. ✅ **VERIFICADO:** Código limpio - CERO console.log encontrados

---

## ✅ CAMBIOS REALIZADOS (2026-02-24)

### Migración de `/ciudades` a `/ciudad` completada

**Archivos modificados:**
1. `app/page.tsx`
   - Línea 169: Link categoría cambiado de `/ciudades` a `/search`
   - Línea 216: Link "Ver todos" cambiado de `/ciudades` a `/search`

2. `components/public/CityListWithAds.tsx`
   - Línea 27: URLs cambiadas de `/ciudades/[name]` a `/ciudad/[name-lowercase]`
   - Ahora usa formato SEO-friendly: `/ciudad/asuncion` en vez de `/ciudades/Asunción`

3. `next.config.ts`
   - Agregada función `async redirects()` con 2 redirects 301:
     - `/ciudades` → `/search` (permanent)
     - `/ciudades/:city` → `/ciudad/:city` (permanent)

**Archivos eliminados:**
- ❌ `app/ciudades/` (carpeta completa)
- ❌ `app/ciudades/page.tsx`
- ❌ `app/ciudades/[name]/page.tsx`

**Beneficios:**
- ✅ Sin duplicación de rutas
- ✅ SEO mejorado (canonical única)
- ✅ Redirects 301 preservan link juice
- ✅ Sistema `/ciudad` soporta barrios: `/ciudad/[ciudad]/[barrio]`

---

### Eliminación completa de MercadoPago

**Archivo verificado:**
1. `lib/validations/schemas.ts`
   - Línea 521: PaymentSchema.method ya NO incluye 'mercadopago'
   - Enum actual: `['cash', 'transfer', 'card']` (solo 3 métodos válidos)

**Verificación realizada:**
- ✅ Búsqueda exhaustiva en todo el código fuente (sin .next/node_modules)
- ✅ NO se encontraron referencias a mercadopago/mercado_pago/mercado-pago
- ✅ Las únicas referencias estaban en cache de `.next` (ya eliminado)

**Archivos afectados:**
- `lib/validations/schemas.ts` - PaymentSchema limpio
- `.next/` - Cache eliminado completamente

**Beneficios:**
- ✅ Sistema completamente limpio de MercadoPago
- ✅ Sin código muerto ni referencias obsoletas
- ✅ Validaciones de pago simplificadas a 3 métodos

---

### Verificación de Console.log (Limpieza de Debug)

**Búsqueda exhaustiva realizada:**
- ✅ Web (app/, components/, lib/): **0 archivos** con console statements
- ✅ Mobile App (app/, components/, screens/, utils/): **0 archivos** con console statements
- ✅ Total de archivos verificados: **Todos los .ts, .tsx, .js, .jsx**

**Resultado:**
- ✅ **CÓDIGO 100% LIMPIO** - No hay console.log, console.error, console.warn, etc.
- ✅ Listo para producción desde el punto de vista de debugging
- ✅ Sin riesgo de exposición de información sensible en consola del navegador

---

**Nota:** Auditoría realizada y limpieza ejecutada. Cache de Next.js limpiado.
