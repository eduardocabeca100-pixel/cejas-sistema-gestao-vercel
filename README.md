# Sistema de Gestão CEJAS — Vercel + Supabase

Projeto recriado do zero em **Next.js + React + TypeScript + Supabase Database + Supabase Storage**, com tema administrativo dark inspirado no sistema mostrado no vídeo.

## Como rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra: `http://localhost:3000`

Sem variáveis do Supabase, o sistema fica em modo leitura vazio e não salva dados localmente. Com Supabase configurado, as rotas `/api/*` persistem no banco e no Storage.

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. No SQL Editor, rode:
   - `supabase/schema.sql`
   - `supabase/storage.sql`
3. Copie as chaves do projeto para `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=servidor-cejas
```

A chave `SUPABASE_SERVICE_ROLE_KEY` é usada somente em rotas de servidor. Ela nunca aparece no frontend.

## Deploy na Vercel

1. Suba esta pasta para um repositório no GitHub.
2. Importe o projeto na Vercel.
3. Configure as mesmas variáveis de ambiente da seção anterior.
4. Faça deploy.

A Vercel hospeda apenas a aplicação. Dados ficam no Supabase Database e arquivos no Supabase Storage, portanto redeploy não apaga informações.

## Módulos inclusos

- Painel Geral / Dashboard
- Agenda Dinâmica
- Painel do Dia
- Chat Interno
- Orçamentos
- Financeiro
- Tarefas Pendentes
- Servidor de Arquivos
- Contratos
- Importar Relatório PDF
- Acessos / Usuários
- Configurações
- Gratuidades

## Banco limpo

O sistema inicia zerado. Nenhum evento, relatório, orçamento, lançamento financeiro, gratuidade, arquivo, contrato, tarefa, usuário ou rubrica é criado automaticamente.

Para limpar um banco já usado em teste, rode `supabase/reset-clean.sql` no SQL Editor do Supabase.

## Regras técnicas

- Sem JSON local como banco oficial.
- Sem localStorage como fonte oficial.
- Sem uploads locais como persistência.
- Sem filesystem da Vercel para dados importantes.
- Supabase Database é a fonte oficial dos dados.
- Supabase Storage é a fonte oficial dos arquivos.
