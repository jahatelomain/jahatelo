# 🔐 Obtener SHA-1 del Keystore de Producción

EAS ya tiene tu keystore de producción guardado: **Build Credentials 3qNdEPGrlx**

---

## 📱 Forma 1: Dashboard Web (5 segundos)

1. **Abre este link en tu navegador:**
   ```
   https://expo.dev/accounts/jmongelos/projects/jahatelo/credentials/android
   ```

2. **Inicia sesión** si te lo pide

3. **Busca la sección "Keystore"**

4. **Click en "Show keystore fingerprints"** o similar

5. **Copia el SHA-1** que aparece

**Ejemplo de lo que verás:**
```
SHA-1: AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD
```

---

## 💻 Forma 2: Terminal (Si la web no funciona)

Abre tu **terminal normal** (no Claude Code) y ejecuta:

```bash
cd /Users/jota/Desktop/AKAHATA STUDIO/projects/jahatelo/app/jahatelo-app
npx eas-cli credentials
```

**Selecciona:**
1. `Android`
2. `production`
3. `Keystore` → `Show keystore fingerprints`
4. Copia el **SHA-1**

---

## ✅ Una vez tengas el SHA-1

**Avísame** y dame el SHA-1 completo (se ve así: `AA:BB:CC:...`).

Con eso, crearemos la guía final para configurar Google OAuth.

---

**Nota:** Este es tu keystore REAL de producción. Guárdalo bien.
