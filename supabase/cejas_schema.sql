-- =========================================================
-- SISTEMA DE GESTÃO CEJAS — BASE SUPABASE
-- Banco: Supabase Database
-- Arquivos: Supabase Storage
-- Bucket oficial: servidor-cejas
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- 1. BUCKET DO SERVIDOR CEJAS
-- =========================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'servidor-cejas',
  'servidor-cejas',
  false,
  104857600,
  null
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- =========================================================
-- 2. TABELA: ARQUIVOS DO SERVIDOR
-- =========================================================

create table if not exists public.cejas_servidor_arquivos (
  id uuid primary key default gen_random_uuid(),

  nome text not null,
  nome_original text not null,

  tipo_identificado text not null default 'Outros',
  bucket text not null default 'servidor-cejas',
  caminho_storage text not null,

  ano text,
  mes text,
  evento text,
  data_evento date,

  extensao text,
  tipo_mime text,
  tamanho bigint,

  origem text default 'upload_manual',
  usuario_id uuid,
  usuario_nome text,

  status_classificacao text not null default 'classificado',
  observacoes text,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_cejas_servidor_arquivos_ano
on public.cejas_servidor_arquivos (ano);

create index if not exists idx_cejas_servidor_arquivos_mes
on public.cejas_servidor_arquivos (mes);

create index if not exists idx_cejas_servidor_arquivos_evento
on public.cejas_servidor_arquivos (evento);

create index if not exists idx_cejas_servidor_arquivos_tipo
on public.cejas_servidor_arquivos (tipo_identificado);

create index if not exists idx_cejas_servidor_arquivos_status
on public.cejas_servidor_arquivos (status_classificacao);

create unique index if not exists idx_cejas_servidor_arquivos_caminho_storage
on public.cejas_servidor_arquivos (bucket, caminho_storage);

-- =========================================================
-- 3. TABELA: ORÇAMENTOS
-- =========================================================

create table if not exists public.cejas_orcamentos (
  id uuid primary key default gen_random_uuid(),

  codigo text,
  solicitante text,
  evento text,
  data_evento date,
  hora_inicio time,
  hora_fim time,

  tipo_cliente text,
  tipo_dia text,
  status text not null default 'rascunho',

  emissor text,
  observacoes_cliente text,
  informacoes_internas text,

  subtotal numeric(12,2) not null default 0,
  desconto numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,

  arquivo_pdf_id uuid references public.cejas_servidor_arquivos(id) on delete set null,

  criado_por uuid,
  criado_por_nome text,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_cejas_orcamentos_evento
on public.cejas_orcamentos (evento);

create index if not exists idx_cejas_orcamentos_data_evento
on public.cejas_orcamentos (data_evento);

create index if not exists idx_cejas_orcamentos_status
on public.cejas_orcamentos (status);

-- =========================================================
-- 4. TABELA: ITENS DO ORÇAMENTO
-- =========================================================

create table if not exists public.cejas_orcamento_itens (
  id uuid primary key default gen_random_uuid(),

  orcamento_id uuid not null references public.cejas_orcamentos(id) on delete cascade,

  categoria text,
  item text not null,
  detalhes text,

  quantidade numeric(12,2) not null default 1,
  valor_unitario numeric(12,2) not null default 0,
  valor_final numeric(12,2) not null default 0,

  ordem integer not null default 0,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_cejas_orcamento_itens_orcamento
on public.cejas_orcamento_itens (orcamento_id);

-- =========================================================
-- 5. TABELA: CATÁLOGO DE ORÇAMENTOS
-- Depois vamos migrar os 60 itens oficiais para cá.
-- =========================================================

create table if not exists public.cejas_orcamento_catalogo (
  id uuid primary key default gen_random_uuid(),

  categoria text not null,
  item text not null,

  associado_dias_uteis numeric(12,2) not null default 0,
  associado_sabado numeric(12,2) not null default 0,
  associado_domingo_feriado numeric(12,2) not null default 0,

  nao_associado_dias_uteis numeric(12,2) not null default 0,
  nao_associado_sabado numeric(12,2) not null default 0,
  nao_associado_domingo_feriado numeric(12,2) not null default 0,

  ativo boolean not null default true,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  unique (categoria, item)
);

-- =========================================================
-- 6. TRIGGER PADRÃO atualizado_em
-- =========================================================

create or replace function public.cejas_set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_cejas_servidor_arquivos_atualizado_em on public.cejas_servidor_arquivos;
create trigger trg_cejas_servidor_arquivos_atualizado_em
before update on public.cejas_servidor_arquivos
for each row
execute function public.cejas_set_atualizado_em();

drop trigger if exists trg_cejas_orcamentos_atualizado_em on public.cejas_orcamentos;
create trigger trg_cejas_orcamentos_atualizado_em
before update on public.cejas_orcamentos
for each row
execute function public.cejas_set_atualizado_em();

drop trigger if exists trg_cejas_orcamento_itens_atualizado_em on public.cejas_orcamento_itens;
create trigger trg_cejas_orcamento_itens_atualizado_em
before update on public.cejas_orcamento_itens
for each row
execute function public.cejas_set_atualizado_em();

drop trigger if exists trg_cejas_orcamento_catalogo_atualizado_em on public.cejas_orcamento_catalogo;
create trigger trg_cejas_orcamento_catalogo_atualizado_em
before update on public.cejas_orcamento_catalogo
for each row
execute function public.cejas_set_atualizado_em();

-- =========================================================
-- 7. RLS
-- Neste primeiro momento, deixamos RLS habilitado.
-- O sistema vai gravar pelo servidor usando service role.
-- A service role nunca deve ir para o navegador.
-- =========================================================

alter table public.cejas_servidor_arquivos enable row level security;
alter table public.cejas_orcamentos enable row level security;
alter table public.cejas_orcamento_itens enable row level security;
alter table public.cejas_orcamento_catalogo enable row level security;
