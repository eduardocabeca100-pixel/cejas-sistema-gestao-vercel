-- Cria (ou atualiza) o usuário super administrador inicial do sistema.
-- Rode este arquivo UMA VEZ no SQL Editor do Supabase, depois de rodar schema.sql.
-- A senha já está com hash bcrypt — nunca fica em texto puro no banco nem no código.

insert into app_users (name, email, password_hash, role, permissions, status)
values (
  'Marcel',
  'marcel@cejas.com.br',
  '$2b$12$vjbvtaj70UsLwbudC8DtV.MvYoiKHKrrFgil9BrCj2OjO8VFT/C/K',
  'Superadmin',
  array['*'],
  'ativo'
)
on conflict (email) do update set
  password_hash = excluded.password_hash,
  role = excluded.role,
  permissions = excluded.permissions,
  status = excluded.status;
