# Jahatelo Monorepo

Este repositorio agrupa las dos caras del proyecto:

- `web/jahatelo-web`: Next.js 13 (Turbopack) + Prisma (SQLite local) que sirve:
  - Admin interno
  - Portal público
  - API `/api/mobile` consumida por la app
- `app/jahatelo-app`: Expo (managed) que usa `EXPO_PUBLIC_API_URL` para hablar con el backend.

## Cómo versionarlo en GitHub

1. Crear un repo vacío en GitHub (por ejemplo `mbaretech/jahatelo`).
2. En esta carpeta ejecutar:

```bash
git remote add origin git@github.com:<org>/jahatelo.git
git push -u origin main
```

> Si preferís HTTPS: `git remote add origin https://github.com/<org>/jahatelo.git`

Cada cambio se trabaja en una rama (`git checkout -b feature/...`), se hace PR y se mergea a `main`.

## Flujo para desarrollar local

```bash
# Web / backend
cd web/jahatelo-web
npm install
npx prisma migrate deploy
npx prisma db seed   # deja datos demo
npm run dev          # Next.js en http://localhost:3000

# App mobile
cd ../../app/jahatelo-app
npm install
npx expo start --lan --clear
```

Asegurate de que `EXPO_PUBLIC_API_URL` apunte a la IP LAN/mac que sirve el backend.

## Próximos pasos para despliegue

1. **Base de datos gestionada**: migrar SQLite a un servicio (p.e. Supabase Postgres o PlanetScale). Actualizar `DATABASE_URL` en producción.
2. **Deploy web**: conectar `web/jahatelo-web` a Vercel, definir variables `.env` (API URL pública, credenciales DB). Configurar comando `npx prisma migrate deploy && npm run build`.
3. **App Expo**: una vez que el backend esté publicado, actualizar `.env.production` con el dominio HTTPS y generar builds con EAS cuando sea necesario.
SUPABASE 
