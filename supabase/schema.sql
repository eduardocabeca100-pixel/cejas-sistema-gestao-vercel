-- Sistema de Gestão CEJAS
-- Fonte oficial de dados: Supabase Database
-- Rode este arquivo no SQL Editor do Supabase antes do deploy.
-- Este schema cria estrutura vazia: sem eventos, sem relatórios, sem financeiro, sem arquivos e sem usuários pré-cadastrados.

create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text,
  role text not null default 'Leitura',
  permissions text[] not null default '{}',
  status text not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Se a tabela app_users já existia (deploy anterior), garante a coluna nova sem apagar dados:
alter table app_users add column if not exists password_hash text;

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  original_filename text not null,
  storage_path text not null,
  total_events integer not null default 0,
  confirmed_events integer not null default 0,
  pending_events integer not null default 0,
  canceled_events integer not null default 0,
  expected_revenue numeric(12,2) not null default 0,
  confirmed_revenue numeric(12,2) not null default 0,
  discounts_applied numeric(12,2) not null default 0,
  extracted_text_preview text,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete set null,
  date date not null,
  start_time time,
  end_time time,
  title text not null,
  company text,
  room text,
  origin text not null default 'Manual',
  participants integer default 0,
  responsible text,
  amount numeric(12,2) not null default 0,
  discount_value numeric(12,2) not null default 0,
  status text not null default 'em_espera' check (status in ('confirmado', 'em_espera', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_date on events(date);
create index if not exists idx_events_status on events(status);
create index if not exists idx_events_room on events(room);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  event_name text not null,
  issuer text not null default 'EDUARDO',
  customer_type text not null default 'associado',
  day_type text not null default 'dias_uteis',
  notes text,
  event_date date,
  start_time time,
  end_time time,
  total numeric(12,2) not null default 0,
  status text not null default 'rascunho',
  pdf_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  rubric text not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_value numeric(12,2) not null default 0,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists finance_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete set null,
  budget_id uuid references budgets(id) on delete set null,
  client text not null,
  date date,
  budget_label text,
  boleto_status text not null default 'Não emitido',
  demonstrativo_status text not null default 'Não emitido',
  payment_status text not null default 'Pendente',
  billing_status text not null default 'Em aberto',
  amount numeric(12,2) not null default 0,
  files_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gratuities (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  event text not null,
  beneficiary text not null,
  type text not null check (type in ('orgao', 'associado', 'nao_associado')),
  total_value numeric(12,2) not null default 0,
  paid_value numeric(12,2) not null default 0,
  loss_value numeric(12,2) not null default 0,
  notes text,
  responsible text,
  status text not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  module text,
  priority text not null default 'média',
  due_date date,
  status text not null default 'pendente',
  assigned_to uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references app_users(id) on delete set null,
  receiver_id uuid references app_users(id) on delete set null,
  body text,
  attachment_path text,
  created_at timestamptz not null default now()
);

create table if not exists server_files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path text not null unique,
  size bigint not null default 0,
  mime_type text not null default 'application/octet-stream',
  year text,
  month text,
  event_name text,
  file_type text,
  uploaded_by uuid references app_users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete set null,
  budget_id uuid references budgets(id) on delete set null,
  client text not null,
  title text not null,
  status text not null default 'Em elaboração',
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists rubrics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table app_users enable row level security;
alter table reports enable row level security;
alter table events enable row level security;
alter table budgets enable row level security;
alter table budget_items enable row level security;
alter table finance_entries enable row level security;
alter table gratuities enable row level security;
alter table tasks enable row level security;
alter table chat_messages enable row level security;
alter table server_files enable row level security;
alter table contracts enable row level security;
alter table settings enable row level security;
alter table rubrics enable row level security;

-- A aplicação usa API Routes com SUPABASE_SERVICE_ROLE_KEY para leitura/escrita no servidor.
-- Não use service role no frontend.
do $$ begin
  create policy "Authenticated users can read events" on events for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authenticated users can read files" on server_files for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
