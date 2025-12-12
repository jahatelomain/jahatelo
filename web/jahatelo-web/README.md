# Jahatelo Web

Plataforma web para la gestión y visualización de moteles en Colombia. Incluye panel administrativo y API público para aplicaciones móviles.

## Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **Base de Datos:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Estilos:** Tailwind CSS
- **Lenguaje:** TypeScript
- **Autenticación:** JWT con cookies httpOnly (jose + bcryptjs)

## API Móvil

Este proyecto expone un API público RESTful para la aplicación móvil de Jahatelo. La documentación completa se encuentra en [docs/mobile-api.md](./docs/mobile-api.md).

**Endpoints disponibles:**
- `GET /api/mobile/motels` - Listado paginado de moteles con filtros
- `GET /api/mobile/motels/:slug` - Detalle completo de un motel

## Autenticación y Roles

El sistema implementa autenticación JWT con tres roles de usuario:

### Roles

- **SUPERADMIN**: Acceso completo a todos los moteles y configuraciones del sistema
- **MOTEL_ADMIN**: Acceso restringido a la gestión de su propio motel
- **USER**: Usuario regular sin acceso al panel administrativo

### Endpoints de Autenticación

- `POST /api/auth/login` - Iniciar sesión (devuelve cookie httpOnly con JWT)
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/register` - Registrar nuevo usuario (MOTEL_ADMIN o USER)

### Panel Administrativo

El panel administrativo está protegido por middleware en `/admin`. Para acceder:

1. Navega a `/admin/login`
2. Usa las credenciales de prueba (ver sección de seed)
3. Serás redirigido al dashboard según tu rol

### Credenciales de Prueba

Después de ejecutar el seed, puedes usar estas credenciales:

```
SUPERADMIN:
  Email: admin@jahatelo.com
  Password: Admin123!

MOTEL_ADMIN (Maximus Motel):
  Email: admin@maximus.com
  Password: Admin123!

USER Regular:
  Email: user@example.com
  Password: Admin123!
```

## Base de Datos y Datos Demo

El proyecto usa Prisma como ORM con PostgreSQL (Supabase) en producción. Para poblar la base de datos con datos demo:

### Primera vez / Reset completo

```bash
# Ejecutar migraciones
npx prisma migrate deploy

# Poblar con datos demo
npx prisma db seed
```

El seed creará:
- 30 moteles de Paraguay con datos reales
- Habitaciones con diferentes tipos y precios
- Amenities (Jacuzzi, Piscina climatizada, Garage privado, etc.)
- Fotos, datos de contacto y ubicación
- **3 usuarios de prueba** (SUPERADMIN, MOTEL_ADMIN, USER) con password: Admin123!

### Ver datos en Prisma Studio

```bash
npm run prisma:studio
```

Abre el navegador en `http://localhost:5555` para explorar y editar datos visualmente.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
