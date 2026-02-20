# Pendientes de desarrollar

- SEO: ver `projects/jahatelo/IMPLEMENTACION SEO.md` para diagnostico profundo y plan full de implementacion.
- Notificacion in-app para avisar al usuario cuando haya una nueva version disponible y recordarle actualizar la app.
- Boton de compartir moteles (desde detalle y listado).
- Normalizar URLs de imagenes en el backend admin API para evitar depender de IP local en el front.
- Revisar por que AuthProvider no envuelve siempre y evita error con useAuth fallback.
- Pre-produccion stores/deep links: completar Team ID real en `web/jahatelo-web/public/.well-known/apple-app-site-association`, SHA256 real en `web/jahatelo-web/public/.well-known/assetlinks.json`, placeholders iOS submit en `app/jahatelo-app/eas.json` y variables Sentry (Vercel/EAS) antes de salir a produccion.
