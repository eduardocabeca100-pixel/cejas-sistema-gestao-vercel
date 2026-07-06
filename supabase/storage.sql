-- Supabase Storage para o Sistema de Gestão CEJAS
-- Bucket oficial de arquivos: servidor-cejas

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'servidor-cejas',
  'servidor-cejas',
  false,
  104857600,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- A aplicação faz upload/download por API Route usando service role.
-- Opcional: liberar leitura autenticada direta no Storage.

do $$ begin
  create policy "Authenticated can read CEJAS files"
  on storage.objects for select
  using (bucket_id = 'servidor-cejas' and auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authenticated can upload CEJAS files"
  on storage.objects for insert
  with check (bucket_id = 'servidor-cejas' and auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
