-- ============================================================
--  SAJU · Base de datos del catálogo y permisos de administrador
--  Se ejecuta UNA vez en Supabase: SQL Editor → pegar todo → Run.
-- ============================================================

-- 1) Quién es administrador. Solo las cuentas listadas aquí pueden
--    crear, editar o borrar productos y fotos. Tener una cuenta NO basta.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  creado  timestamptz not null default now()
);
alter table public.admins enable row level security;

-- Cada persona solo puede consultar su propia fila (para saber si es admin).
drop policy if exists "ver mi propia fila" on public.admins;
create policy "ver mi propia fila" on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));
-- No hay políticas de escritura: la lista de admins solo se cambia desde
-- el panel de Supabase, nunca desde la página.

-- Función que responde "¿quien hace la petición es admin?".
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;
revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;

-- 2) Productos del catálogo.
create table if not exists public.productos (
  id        uuid primary key default gen_random_uuid(),
  categoria text not null check (categoria in ('pantalones', 'camisas', 'togas')),
  nombre    text not null check (char_length(nombre) between 1 and 80),
  precio    integer check (precio is null or (precio >= 0 and precio <= 100000000)),
  foto_url  text check (foto_url is null or char_length(foto_url) <= 500),
  publicado boolean not null default true,
  orden     integer not null default 0,
  creado    timestamptz not null default now()
);
create index if not exists productos_categoria_orden on public.productos (categoria, orden);
alter table public.productos enable row level security;

-- El público solo ve lo publicado; los admins ven todo.
drop policy if exists "leer productos" on public.productos;
create policy "leer productos" on public.productos
  for select to anon, authenticated
  using (publicado or (select public.es_admin()));

drop policy if exists "admin crea" on public.productos;
create policy "admin crea" on public.productos
  for insert to authenticated
  with check ((select public.es_admin()));

drop policy if exists "admin edita" on public.productos;
create policy "admin edita" on public.productos
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

drop policy if exists "admin borra" on public.productos;
create policy "admin borra" on public.productos
  for delete to authenticated
  using ((select public.es_admin()));

-- 3) Fotos: carpeta pública de solo lectura, máximo 5 MB, solo imágenes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin sube fotos" on storage.objects;
create policy "admin sube fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and (select public.es_admin()));

drop policy if exists "admin borra fotos" on storage.objects;
create policy "admin borra fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and (select public.es_admin()));

-- ============================================================
--  4) DAR ACCESO DE ADMINISTRADOR A UNA PERSONA
--  a. Authentication → Users → Add user (correo y contraseña).
--  b. Ejecutar esto cambiando el correo:
--
--     insert into public.admins (user_id)
--     select id from auth.users where email = 'correo@ejemplo.com';
--
--  Para quitar el acceso:
--     delete from public.admins
--     where user_id = (select id from auth.users where email = 'correo@ejemplo.com');
-- ============================================================
