-- Limpeza total dos dados CEJAS no Supabase.
-- Use somente quando quiser deixar o sistema zerado para começar de novo.

truncate table
  chat_messages,
  tasks,
  budget_items,
  budgets,
  finance_entries,
  gratuities,
  server_files,
  contracts,
  events,
  reports,
  app_users,
  rubrics,
  settings
restart identity cascade;
