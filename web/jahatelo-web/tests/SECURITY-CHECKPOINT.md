# Checkpoint de seguridad local

## Integración con staging actualizado

- Base integrada: `1a72179`. Conservados perfiles de acceso, auditoría, logos, marcas de agua y variantes WebP de upstream.
- Lista canónica: `PENDIENTES.md` (JH-069 a JH-071); no se restaura la lista antigua eliminada por upstream.
- Revalidado: Google/sesiones 49/49, admin/uploads 29/29, typecheck web/app exit 0, lint dirigido web limpio y app con 5 avisos existentes.
- Prisma Client regenerado localmente sin BD; tipos obsoletos de `.next/dev/types` conservados fuera del repo.
- JWT_SECRET y GOOGLE_MOBILE_CLIENT_IDS agregados y listados en Vercel Production/Preview sin mostrar sus valores. Las sesiones anteriores requerirán nuevo login.
- Upload conserva límite actual de 4 MB, validación con Sharp y salida WebP. Formatos JPG, PNG, WebP y HEIC/HEIF; las pruebas ejercitan Sharp real.
- Pendiente: publicación y login real en navegador/dispositivo. Los resultados siguientes describen también el checkpoint anterior a esta integración.

## Contrato y configuración

- Web y app envían `{ provider: 'google', idToken }`; campos de identidad enviados por el cliente no autentican. Clientes antiguos que envían solo email/providerId recibirán 401: actualizar app y servidor coordinadamente, sin fallback inseguro.
- Web usa Google Identity Services (`GoogleLogin`, `credential`). Configurar `NEXT_PUBLIC_GOOGLE_CLIENT_ID` en el build web. Backend: `GOOGLE_CLIENT_ID` (prioritario) o `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; deben identificar el mismo cliente OAuth web.
- Backend móvil acepta además `GOOGLE_MOBILE_CLIENT_IDS`, lista de client IDs separada por comas. Incluir los audiences de los clientes iOS/Android/Expo que realmente se distribuyan; nunca aceptar un audience recibido del request.
- La app ya lee `expo.extra.googleClientIdWeb`, `googleClientIdIos`, `googleClientIdAndroid`, `googleClientIdExpo` en `app.json`; se comprobó presencia de claves sin publicar valores. `app.config.js` no mapea variables Google adicionales. No se leyeron archivos `.env` ni se validaron valores de configuración de producción.
- Expo instalado: `useIdTokenAuthRequest` usa code + PKCE y autoexchange nativo (`authentication.idToken`), ID token directo en web (`params.id_token`). Confirmar Google Console, origen web, bundle/package, certificados Android y redirects en builds reales. El redirect nativo por defecto de esta versión es `applicationId:/oauthredirect`; no se certifica Expo Go ni login real de Google mediante estas pruebas.
- `JWT_SECRET` es obligatorio para sesiones; se eliminó el secreto por defecto conocido. Usar un secreto aleatorio fuerte y planear invalidación de sesiones si se rota.
- Upload requiere administrador activo con permiso `motels`, y `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_S3_REGION`. Falta de configuración fuera de desarrollo: 503. `UPLOADS_USE_LOCAL=1` solo habilita fallback local en desarrollo. Extensión elegida por MIME validado, no por nombre del cliente.

## Verificación reproducible (desde la raíz del repo, macOS)

```sh
python3 web/jahatelo-web/tests/verify-local.py test tests/google-auth/jest.config.cjs
python3 web/jahatelo-web/tests/verify-local.py test tests/admin-access-upload/jest.config.cjs
python3 web/jahatelo-web/tests/verify-local.py tsc
python3 web/jahatelo-web/tests/verify-local.py tsc-app
python3 web/jahatelo-web/tests/verify-local.py lint app/api/auth/google/callback/route.ts app/api/mobile/auth/login/route.ts app/api/upload/s3/route.ts lib/adminAccess.ts lib/auth.ts lib/googleAuth.ts components/GoogleLoginButton.tsx tests/google-auth tests/admin-access-upload
python3 web/jahatelo-web/tests/verify-local.py lint-app screens/LoginScreen.js contexts/AuthContext.js services/authApi.js services/googleAuthService.js
git diff --check
```

Resultados ejecutados: Google/sesiones 49/49; admin/upload 29/29; ambos typechecks exit 0; lint web exit 0 sin avisos; lint app exit 0 con 5 warnings preexistentes confirmados ejecutando ESLint sobre `git show HEAD:...` (hooks y variables sin usar); diff check exit 0. RED observado antes de corregir conflictos de subject, mutación de inactivos, extensión de upload, transporte cliente, vinculación mobile por email, secreto de sesión ausente y almacenamiento sin configuración.

El runner usa entorno mínimo, HOME/cache temporal, bloquea lectura de `.env`, escrituras al repo y toda red con sandbox-exec; el probe de red devuelve EPERM. No ejecuta next/jest, Expo CLI, builds, Prisma ni migraciones. Dependencias instaladas previamente.

El harness ejecuta módulos reales de cliente web y app (pantalla → contexto → authApi → fetchWithTimeout), rutas y verificador jose con firmas RSA y JWKS generados localmente; también firma/verifica sesiones reales. Sustituye SDK/UI nativos, transporte HTTP, persistencia DB/S3/AsyncStorage y cookie store. No equivale a E2E de navegador/dispositivo ni prueba de DB/S3 reales. Las firmas de imagen son identificación/framing, no decodificación completa ni antivirus. No hubo deploy, push, commit ni cambios de esquema.
