create table if not exists public.cejas_servidor_arquivos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  nome_original text not null,
  tipo_identificado text not null,
  bucket text not null default 'servidor-cejas',
  caminho_storage text not null,
  ano text,
  mes text,
  evento text,
  data_evento text,
  extensao text,
  tipo_mime text,
  tamanho bigint,
  origem text default 'upload_manual',
  usuario_id uuid,
  usuario_nome text,
  status_classificacao text default 'classificado',
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

create or replace function public.set_atualizado_em()
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
execute function public.set_atualizado_em();
