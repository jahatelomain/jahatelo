# Pendientes de desarrollar

- SEO: ver `projects/jahatelo/IMPLEMENTACION SEO.md` para diagnostico profundo y plan full de implementacion.
- Notificacion in-app para avisar al usuario cuando haya una nueva version disponible y recordarle actualizar la app.
- Normalizar URLs de imagenes en el backend admin API para evitar depender de IP local en el front.
- Mapa web: revisar la configuración y el renderizado del mapa de Google Maps, que actualmente puede mostrarse con el fondo gris; validar diseño de mapa, ID de mapa y API key antes de cualquier cambio visual.
- Media: definir y aplicar la ecuación de imagen por uso (dimensiones, relación de aspecto, peso y recorte) para que las fotos se vean correctamente en web, iOS y Android; acompañarla con una guía clara para quien carga fotos y, si corresponde, conversión automática al subirlas.
- Revisar por que AuthProvider no envuelve siempre y evita error con useAuth fallback.
- Pre-produccion stores/deep links: completar Team ID real en `web/jahatelo-web/public/.well-known/apple-app-site-association`, SHA256 real en `web/jahatelo-web/public/.well-known/assetlinks.json`, placeholders iOS submit en `app/jahatelo-app/eas.json` y variables Sentry (Vercel/EAS) antes de salir a produccion.
