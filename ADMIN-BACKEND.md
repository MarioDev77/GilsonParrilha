# Painel administrativo — integração e implantação

O backend registra as rotas do painel sob `/api/v1/admin`, protegidas por sessão de servidor, CSRF e permissões por função. Inclui CRUD de produtos e categorias, ordenação, disponibilidade, pedidos, dashboard, usuários, configurações e upload de imagens JPEG/PNG/WebP (até 5 MiB). Os adicionais do produto são sincronizados com `extras`/`product_extras`.

## Configuração local

1. Use Node.js 20 ou superior e PostgreSQL.
2. Copie `backend/.env.example` para `backend/.env` e configure `DATABASE_URL`, `FRONTEND_ORIGINS`, `WHATSAPP_NUMBER` e os segredos necessários.
3. Em `backend/`: `npm ci`, `npm run prisma:validate`, `npm run prisma:generate`, `npm run db:migrate:deploy`, `npm run db:seed`, `npm run admin:create`, `npm run build` e `npm test`.
4. Em `frontend/`: configure `NEXT_PUBLIC_API_URL` apontando para `http://localhost:3333/api/v1` (ou o endereço da API), rode `npm ci`, `npm run typecheck` e `npm run build`.
5. Rode backend e frontend e teste login, criar/editar/excluir produto, adicionais, categorias, upload, pedidos, transições de status, usuários e configurações.

## Importante antes de produção

- O diretório `backend/uploads` é armazenamento local. Em hospedagem com disco efêmero ou múltiplas instâncias, configure volume persistente ou substitua por armazenamento de objetos.
- O painel de configurações pressupõe o registro `store_settings` com `id = 1`; o seed o cria se `WHATSAPP_NUMBER` estiver configurado.
- Configure os segredos e origens reais antes de expor a API. Nunca use credenciais de desenvolvimento em produção.
- As alterações de código precisam ser validadas com build e testes em ambiente com dependências e PostgreSQL disponíveis. A geração do ZIP, por si só, não comprova execução em produção.
