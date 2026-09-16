# Campus Virtual — Plataforma de estudio

Web hecha con **Next.js 14** (App Router) + **Supabase** (Auth, Base de
datos Postgres y Storage), lista para desplegar en **Vercel**.

## ¿Qué incluye?

- Registro / inicio de sesión con correo y contraseña.
- Estructura: **6 ciclos → 6 materias por ciclo → hasta 10+ unidades por
  materia → contenidos (PDF, otros archivos, videos de YouTube)**.
- Los usuarios ven los videos **incrustados y listos para reproducir**
  (nunca se les muestra el enlace de YouTube como texto).
- Los PDFs y archivos se pueden descargar/abrir directamente.
- **Panel de administración** (`/admin`), accesible solo para el correo
  `adolfo57chavez8@gmail.com` (se puede cambiar), donde puedes:
  - Crear/editar/ocultar/eliminar ciclos.
  - Crear/editar/eliminar materias dentro de cada ciclo.
  - Crear/editar/eliminar unidades dentro de cada materia.
  - Subir PDFs/archivos y pegar enlaces de YouTube dentro de cada unidad.
- Diseño propio, responsivo, con Tailwind CSS.

---

## 1) Crear el proyecto en Supabase

1. Ve a https://supabase.com → **New project**.
2. Cuando esté listo, entra a **SQL Editor → New query**.
3. Copia y pega **todo** el contenido del archivo `schema.sql` (que te
   entregué aparte del ZIP) y dale **Run**. Esto crea:
   - Las tablas `profiles`, `ciclos`, `materias`, `unidades`, `contenidos`.
   - Las políticas de seguridad (RLS): los usuarios normales solo pueden
     **leer**, y solo tu correo admin puede **crear/editar/eliminar**.
   - El bucket de Storage `archivos` (público para lectura, solo el admin
     puede subir/editar/borrar).
   - Un trigger que crea automáticamente el perfil de cada usuario nuevo
     y le asigna el rol `admin` si su correo coincide con
     `adolfo57chavez8@gmail.com`.
4. Ve a **Authentication → Providers** y confirma que **Email** esté
   habilitado (lo está por defecto).
5. (Opcional, recomendado para pruebas rápidas) En
   **Authentication → Settings → Email Auth**, puedes desactivar
   **"Confirm email"** para no tener que confirmar cada cuenta de prueba
   por correo. En producción, déjalo activado.
6. Ve a **Project Settings → API** y copia:
   - **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2) Configurar las variables de entorno

En la raíz del proyecto hay un archivo `.env.local.example`. Crea una
copia llamada **`.env.local`** (mismo contenido, sin `.example`) y
complétalo así:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
NEXT_PUBLIC_ADMIN_EMAIL=adolfo57chavez8@gmail.com
```

Este archivo **no se sube a GitHub** (ya está en `.gitignore`).

---

## 3) Probar en tu computadora (Visual Studio Code)

Abre una terminal en la carpeta del proyecto (donde está `package.json`)
y ejecuta, en orden:

```bash
npm install
npm run dev
```

Luego abre `http://localhost:3000` en el navegador.

- Regístrate normalmente desde `/registro`.
- Si te registras con el correo `adolfo57chavez8@gmail.com`, ese usuario
  tendrá acceso a `/admin` automáticamente.
- Entra a `/admin` y empieza creando un ciclo, luego sus materias, luego
  las unidades, y luego sube archivos o pega enlaces de YouTube.

---

## 4) Subir el proyecto a GitHub

Desde la misma terminal, dentro de la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Primera version del campus virtual"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

(Antes crea el repositorio vacío en GitHub.com con el botón **New
repository**, sin agregar README ni .gitignore ahí, para evitar
conflictos).

---

## 5) Publicar en Vercel

1. Ve a https://vercel.com y entra con tu cuenta de GitHub.
2. **Add New… → Project** y selecciona el repositorio que acabas de subir.
3. Framework: Vercel detectará automáticamente **Next.js**, no cambies
   nada del build command.
4. En **Environment Variables**, agrega las mismas 3 variables de tu
   `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_EMAIL`
5. Dale **Deploy**. En unos minutos tendrás tu URL pública
   (`https://tu-proyecto.vercel.app`).

Cada vez que hagas `git push` a `main`, Vercel volverá a publicar la web
automáticamente.

---

## Estructura de carpetas

```
app/
  page.js                 → Portada (lista de ciclos)
  login/                  → Inicio de sesión
  registro/               → Registro de usuarios
  ciclo/[id]/              → Materias de un ciclo
  materia/[id]/            → Unidades de una materia
  unidad/[id]/             → Videos y archivos de una unidad
  admin/                   → Panel de administración (protegido)
    ciclos/                → CRUD de ciclos
    materias/               → CRUD de materias
    unidades/               → CRUD de unidades
    contenidos/              → Subida de archivos y videos
lib/supabase/              → Conexión con Supabase (cliente/servidor)
middleware.js               → Protege rutas privadas y el panel admin
components/                  → Navbar y reproductor de video
```

## Notas importantes

- El control de quién es administrador se hace de **dos formas
  combinadas**: por el trigger de la base de datos (`is_admin()` en
  `schema.sql`) y por la variable `NEXT_PUBLIC_ADMIN_EMAIL` en el
  frontend. **Si cambias el correo admin**, actualízalo en ambos
  lugares: dentro de la función `is_admin()` en `schema.sql` (vuelve a
  ejecutar solo esa parte en el SQL Editor) y en la variable de entorno.
- Puedes crear más de un ciclo con el mismo número solo si cambias la
  restricción `unique` en la tabla `ciclos`; por defecto el número de
  ciclo es único.
- El bucket `archivos` es público para lectura (para que los enlaces de
  descarga funcionen), pero **solo tu cuenta admin puede subir, editar o
  borrar archivos**, gracias a las políticas de seguridad (RLS).
