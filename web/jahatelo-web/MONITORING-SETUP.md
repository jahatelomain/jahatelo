# Monitoreo vigente de Jahatelo

La observabilidad actual no depende de un proveedor externo de error tracking. Sentry fue retirado de web y apps por decisión de producto; la decisión y las condiciones para reconsiderarlo están en `app/jahatelo-app/docs/DECISIONES_TECNICAS.md`, `DT-002`.

## Herramientas activas

- `lib/logger.ts`: logs estructurados del backend, con datos sensibles reducidos.
- Logs de Vercel: diagnóstico de despliegues, funciones y errores de producción.
- `AuditLog`: trazabilidad de operaciones administrativas sensibles.
- `MotelAnalytics`, `VisitorEvent` y `AdAnalytics`: métricas funcionales y de navegación.
- `GET /api/health`: estado de aplicación y conectividad con la base de datos.

## Operación

1. Ante un error web o API, identificar ruta, hora, entorno y estado HTTP.
2. Consultar primero el despliegue y los logs de Vercel correspondientes.
3. Para operaciones administrativas, correlacionar el caso con `AuditLog`.
4. No registrar contraseñas, tokens, cookies, cabeceras de autorización ni cuerpos sensibles.
5. Confirmar el síntoma con una prueba reproducible antes de modificar código.

## Verificación básica

```bash
curl -fsS https://www.jahatelo.com/api/health
```

Además, cada entrega debe ejecutar lint, TypeScript y las suites de pruebas documentadas en `docs/SISTEMA_JAHATELO.md`.

## Observabilidad externa futura

No instalar SDK, wrapper de build ni túnel de monitoreo hasta que existan presupuesto, cuenta activa, responsable operativo, alertas, retención y revisión de privacidad. El pendiente canónico es `JH-002`.
