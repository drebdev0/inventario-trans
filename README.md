# InventarioTRANS

Sistema de gestión de inventario para activos TRANS-CO.

## Tech Stack

- **Framework**: Next.js 15 (App Router + Turbopack)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **UI**: Tailwind CSS 4 + Lucide Icons
- **Deploy**: Netlify

## Desarrollo Local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

## Variables de Entorno

Copiá `.env.example` a `.env.local` y completá:

```
NEXT_PUBLIC_SUPABASE_URL=https://tspcktdahypuiizqzpci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Deploy en Netlify

### Opción 1: Git-based deploy (recomendado)

1. Subí el proyecto a un repo de GitHub/GitLab
2. En Netlify, hacé "New site from Git"
3. Seleccioná tu repo
4. Netlify detecta `netlify.toml` automáticamente
5. Agregá las variables de entorno en **Site settings > Environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://tspcktdahypuiizqzpci.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
6. Deploy automático

### Opción 2: Deploy manual

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

## Base de Datos

Los archivos SQL están en `supabase/`:

- `schema.sql` — Schema completo (tablas, triggers, RLS)
- `trigger-usuario.sql` — Auto-crea usuario en `public.usuarios` al registrarse
- `fix-rls.sql` — Políticas RLS simplificadas

Ejecutá estos en el **SQL Editor** de Supabase Dashboard.

## Estructura

```
src/
  app/
    auth/callback/     — Callback de autenticación
    login/             — Login
    register/          — Registro
    dashboard/
      productos/       — Catálogo de productos (CRUD)
      activos/         — Activos físicos TRANS-CO (CRUD + bulk)
      rto/             — Remote Translation Offices (CRUD)
      prestamos/       — Préstamos y devoluciones (CRUD + bulk)
      historial/       — Auditoría y historial
  lib/
    supabase/          — Clientes Supabase (client, server, middleware)
    types.ts           — Interfaces TypeScript
    utils.ts           — Utilidades
  components/
    confirm-dialog.tsx — Modal de confirmación reutilizable
supabase/
  schema.sql           — Schema completo
  trigger-usuario.sql  — Trigger de auth
  fix-rls.sql          — Políticas RLS
```
