# Etapas 5 e 6 — integração administrativa

## Implementado nesta revisão

- Integração dos serviços do painel com as respostas da API para produtos, categorias, pedidos, dashboard e configurações.
- Conversão dos valores monetários em centavos/reais e dos status de pedido entre API e interface.
- Sincronização de adicionais (`extras` e `product_extras`) ao criar/editar produtos.
- Endpoint protegido de upload de imagens JPEG, PNG e WebP com limite de 5 MiB e validação da assinatura do arquivo.
- Servir imagens salvas em `backend/uploads` e converter horários do formulário para o formato persistido por dia da semana.
- Normalização dos dados de endereço e das configurações públicas.

## Verificações feitas aqui

- Análise sintática TypeScript/TSX em 152 arquivos: sem erros de sintaxe.
- Não foi possível executar `npm ci`, build, suíte Vitest ou testes reais contra PostgreSQL neste ambiente: a instalação das dependências não terminou. Portanto, este arquivo não declara build, integração de banco ou produção validados.

## Passos obrigatórios no ambiente de execução

Na pasta `backend`, configure `.env` e execute `npm ci`, `npm run prisma:validate`, `npm run prisma:generate`, `npm run db:migrate:deploy`, `npm run db:seed`, `npm run admin:create`, `npm run typecheck`, `npm run build` e `npm test`.

Na pasta `frontend`, configure `NEXT_PUBLIC_API_URL` (padrão local `http://localhost:3333/api/v1`) e execute `npm ci`, `npm run typecheck` e `npm run build`.

O upload atual usa disco local. Em produção, configure volume persistente para `backend/uploads` ou migre para storage de objetos antes de escalar para múltiplas instâncias.
