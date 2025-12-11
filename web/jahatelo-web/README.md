# Jahatelo Web

Plataforma web para la gestión y visualización de moteles en Colombia. Incluye panel administrativo y API público para aplicaciones móviles.

## Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **Base de Datos:** SQLite (desarrollo) / PostgreSQL (producción)
- **ORM:** Prisma
- **Estilos:** Tailwind CSS
- **Lenguaje:** TypeScript

## API Móvil

Este proyecto expone un API público RESTful para la aplicación móvil de Jahatelo. La documentación completa se encuentra en [docs/mobile-api.md](./docs/mobile-api.md).

**Endpoints disponibles:**
- `GET /api/mobile/motels` - Listado paginado de moteles con filtros
- `GET /api/mobile/motels/:slug` - Detalle completo de un motel

## Base de Datos y Datos Demo

El proyecto usa Prisma como ORM con SQLite en desarrollo. Para poblar la base de datos con datos demo para pruebas locales:

### Primera vez / Reset completo

```bash
# Ejecutar migraciones
npx prisma migrate deploy

# Poblar con datos demo
npx prisma db seed
```

El seed creará:
- 3 moteles de ejemplo (2 destacados, 1 con promoción activa)
- 6 habitaciones activas con diferentes precios
- 8 amenities (Jacuzzi, WiFi, Garage privado, etc.)
- Fotos, menús, y datos de contacto completos

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
