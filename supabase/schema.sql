-- ZAP Blinds Solutions — Schema
-- Ejecutar en Supabase Dashboard → SQL Editor

-- Tabla de documentos (cotizaciones y facturas)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('quote', 'invoice')),
  number int not null,
  client text not null,
  phone text,
  address text,
  city text,
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

-- Migración: dirección y ciudad del cliente (para tablas ya existentes)
alter table public.documents add column if not exists address text;
alter table public.documents add column if not exists city text;

-- Migración: términos de pago de la factura (define la fecha de vencimiento)
alter table public.documents add column if not exists payment_terms text
  check (payment_terms in ('due_on_receipt', 'net_15', 'net_30'));

-- Migración: enlace para compartir el documento con el cliente (/d/<share_id>)
alter table public.documents
  add column if not exists share_id uuid not null default gen_random_uuid();
create unique index if not exists documents_share_id_idx on public.documents (share_id);

-- Vista pública de un documento por su enlace (share_id imposible de adivinar).
-- security definer: el cliente no tiene sesión, así que debe saltarse RLS, pero solo
-- para la fila con ese share_id exacto y sin exponer user_id ni el id interno.
create or replace function public.get_shared_document(p_share_id uuid)
returns table (
  type text, number int, client text, phone text, address text, city text, project text,
  items jsonb, discount numeric, subtotal numeric, tax numeric, total numeric,
  notes text, payment_terms text, created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.type, d.number, d.client, d.phone, d.address, d.city, d.project,
         d.items, d.discount, d.subtotal, d.tax, d.total,
         d.notes, d.payment_terms, d.created_at
  from public.documents d
  where d.share_id = p_share_id;
$$;

revoke execute on function public.get_shared_document(uuid) from public;
grant execute on function public.get_shared_document(uuid) to anon, authenticated;

-- Índices
create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists documents_created_at_idx on public.documents(created_at desc);

-- Row Level Security
alter table public.documents enable row level security;

-- Política: cada usuario ve solo sus documentos
drop policy if exists "users see own documents" on public.documents;
create policy "users see own documents" on public.documents
  for all using (auth.uid() = user_id);
