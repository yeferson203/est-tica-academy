# Estética Academy

Academia de cursos online de estética con inicio de sesión, pagos y certificados.

## Desarrollo local

Requiere Node.js y npm.

```sh
npm install
npm run dev
```

Configura tu proyecto Supabase en `.env.local` con `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Para las operaciones administrativas del servidor también necesitarás `SUPABASE_SERVICE_ROLE_KEY`; mantenla solo en el servidor y nunca la publiques ni la compartas. Habilita Google como proveedor OAuth en Supabase y configura la URL de redirección de la aplicación.

Para crear las tablas y los datos iniciales, ejecuta en Supabase → SQL Editor, en este orden, las migraciones `supabase/migrations/20261026001500_init_academy.sql` y `supabase/migrations/20261026003000_lock_admin_to_email.sql`. La segunda migración asegura que `yeffersonrosero15@gmail.com` sea la única cuenta con permisos de administración, incluso si otra cuenta tenía previamente el rol `admin`. En una base de datos que ya ejecutó la migración inicial, ejecuta solo la segunda. La ejecución requiere una cuenta con acceso al proyecto.

Para migraciones de base de datos configura `DATABASE_URL`; para las tareas protegidas por cron configura `CRON_SECRET` y, opcionalmente, `CRON_SECRET_PREVIOUS`.

Para validar el proyecto:

```sh
npm test
npm run build
```
