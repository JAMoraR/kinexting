-- Ejecutar en el SQL Editor de Supabase antes de publicar /waitlist.
begin;
create table if not exists public.plan_gestor_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text,
  whatsapp text,
  created_at timestamptz not null default now(),
  consent_at timestamptz not null default now(),
  consent_version text not null default 'waitlist-v1',
  source text not null default '/waitlist',
  plan text not null default 'gestor',
  quarterly_free_months smallint not null default 1,
  annual_free_months smallint not null default 3,
  constraint waitlist_contact_required check (email is not null or whatsapp is not null),
  constraint waitlist_email_valid check (email is null or (length(email) <= 254 and email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  constraint waitlist_whatsapp_valid check (whatsapp is null or whatsapp ~ '^\+[1-9][0-9]{6,14}$')
);
create unique index if not exists plan_gestor_waitlist_email_unique on public.plan_gestor_waitlist (lower(email)) where email is not null;
create unique index if not exists plan_gestor_waitlist_whatsapp_unique on public.plan_gestor_waitlist (whatsapp) where whatsapp is not null;
alter table public.plan_gestor_waitlist enable row level security;
revoke all on public.plan_gestor_waitlist from anon, authenticated;
grant select, insert, update, delete on public.plan_gestor_waitlist to service_role;
comment on table public.plan_gestor_waitlist is 'Lista de espera Plan gestor. Acceso exclusivo desde servidor; sin políticas públicas.';
commit;
