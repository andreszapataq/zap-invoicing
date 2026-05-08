-- ZAP Blinds Solutions — Schema de la demo
-- Ejecutar en Supabase Dashboard → SQL Editor

-- Tabla de documentos (cotizaciones y facturas)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('quote', 'invoice')),
  number int not null,
  client text not null,
  phone text,
  project text,
  items jsonb not null default '[]'::jsonb,
  discount numeric(12,2) default 0,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  status text default 'draft',
  created_at timestamptz default now()
);

-- Índices
create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists documents_created_at_idx on public.documents(created_at desc);

-- Row Level Security
alter table public.documents enable row level security;

-- Política: cada usuario ve solo sus documentos
drop policy if exists "users see own documents" on public.documents;
create policy "users see own documents" on public.documents
  for all using (auth.uid() = user_id);
