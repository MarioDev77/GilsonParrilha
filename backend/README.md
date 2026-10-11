# Gilson Parrilha — Backend (API REST)

API em Node.js + TypeScript + Express + PostgreSQL (Prisma). O frontend Next.js é um projeto separado.

> **Status:** Etapas 1 (fundação), 2 (migração, seed, auth admin), 3 (cardápio público) e 4 (pedidos + WhatsApp) concluídas.
> **Faltam:** Etapa 5 (admin: pedidos, produtos, categorias, adicionais, configurações) → Etapa 6 (dashboard + uploads) → Etapa 7 (testes de integração com banco, OpenAPI/Swagger, deploy).

## Requisitos
- Node.js 20+
- PostgreSQL 14+ (obrigatório; não há outro banco suportado)

## 1. PostgreSQL

**Opção A — Docker (desenvolvimento):**
```bash
docker compose up -d
# DATABASE_URL="postgresql://gilson:gilson_dev_pass@localhost:5432/gilson_parrilha?schema=public"
```

**Opção B — PostgreSQL instalado na máquina:**
```sql
CREATE USER gilson WITH PASSWORD 'defina_uma_senha_forte';
CREATE DATABASE gilson_parrilha OWNER gilson;
```

**Produção:** use um PostgreSQL gerenciado (ex.: Railway) e copie a URL para `DATABASE_URL` nas variáveis do serviço. A API nunca expõe essa URL ao frontend.

## 2. Configuração
```bash
cp .env.example .env     # preencha DATABASE_URL, FRONTEND_ORIGIN e SESSION_SECRET
npm install              # também roda `prisma generate`
```
Gerar um SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 3. Executar
```bash
npm run dev              # desenvolvimento (recarrega sozinho)
npm run build && npm start   # produção
```
O servidor **não** roda migrações nem recria o banco ao iniciar. Migrações são um passo explícito.

## 4. Banco: migração, seed e primeiro administrador
```bash
npm run db:migrate:dev       # desenvolvimento: aplica a migração 'init' e gera o client
npm run db:migrate:deploy    # produção: só APLICA migrações existentes (nunca apaga nem recria)
npm run db:seed              # cria configurações da loja + categorias iniciais (idempotente, não sobrescreve)
npm run admin:create         # cria o PRIMEIRO administrador (senha digitada de forma oculta)
```
- O seed exige `WHATSAPP_NUMBER` no `.env` na primeira execução. O horário de funcionamento nasce **vazio (fechado)**: configure pelo painel (`PATCH /admin/settings`, Etapa 5).
- Outros administradores: `npm run admin:create -- --additional --role=STAFF` (ou `ADMIN`).
- Em produção (Railway): rode esses comandos a partir do seu computador com `DATABASE_URL` apontando para o banco de produção, ou pelo shell do serviço.
- A migração `init` inclui restrições CHECK (valores ≥ 0, `total = subtotal + taxa`, endereço obrigatório em entrega, e-mail em minúsculas).

## 5. Autenticação admin (sessão + CSRF)
- `POST /api/v1/admin/auth/login` `{ "email", "password" }` → define o cookie `gp_session` (HttpOnly; Secure em produção) e devolve `{ data: { admin, csrfToken } }`.
- `GET /api/v1/admin/auth/me` → admin logado + `csrfToken` (use após recarregar a página).
- `POST /api/v1/admin/auth/logout` → revoga a sessão no banco. Exige `X-CSRF-Token`.
- Toda requisição que **altera dados** no painel deve enviar `X-CSRF-Token` e usar `credentials: 'include'` no `fetch`.
- Não há `/refresh`: a sessão dura `SESSION_TTL_HOURS` (padrão 12 h) e depois exige novo login.
- Proteções: Argon2id, mensagem de erro única, limite de 10 falhas/15 min por IP e 8 falhas/15 min por conta, checagem de `Origin`, hash HMAC do token no banco.

Teste rápido (terminal):
```bash
curl -i -c jar.txt -H "Content-Type: application/json" \
  -d '{"email":"voce@exemplo.com","password":"SUA_SENHA"}' http://localhost:3333/api/v1/admin/auth/login
curl -b jar.txt http://localhost:3333/api/v1/admin/auth/me
```

> **Cookies entre domínios:** Vercel (frontend) e Railway (API) em domínios diferentes exigem `COOKIE_SAMESITE=none` + HTTPS, e alguns navegadores (Safari) bloqueiam cookies de terceiros. O caminho mais robusto é usar um domínio próprio com subdomínios (`app.` e `api.`) e `COOKIE_SAMESITE=lax` com `COOKIE_DOMAIN`.

## 6. Cardápio público (somente leitura)
| Rota | Descrição |
|---|---|
| `GET /api/v1/categories` | Categorias ativas, com `productCount` (produtos visíveis) |
| `GET /api/v1/products` | Lista paginada. Filtros: `category` (slug), `search` (nome/descrição, mín. 2 letras), `featured=true`, `sort=default\|price_asc\|price_desc\|name`, `page`, `pageSize` (máx. 50) |
| `GET /api/v1/products/:slug` | Detalhe + adicionais permitidos e disponíveis |
| `GET /api/v1/extras` | Adicionais disponíveis. Filtro opcional: `product=<slug>` |
| `GET /api/v1/settings/public` | Dados públicos da loja + `isOpenNow` (calculado no fuso da loja) |

Regras: só aparecem produtos **ativos, não arquivados, de categoria ativa**; a listagem mostra apenas os **disponíveis**, e o detalhe devolve `isAvailable` (para o site exibir "indisponível" em links antigos). Preços sempre em centavos (`priceCents`). Respostas de lista: `{ data: [...], meta: { page, pageSize, total, totalPages } }`. Cache público de 30 s.

## 7. Pedidos (Etapa 4)

### `POST /api/v1/orders`
Cabeçalho obrigatório: `Idempotency-Key` (16–100 caracteres; gere um UUID **por tentativa de checkout** e reutilize-o em reenvios).

```json
{
  "customer": { "name": "Maria Silva", "phone": "(75) 99999-8888" },
  "fulfillmentType": "DELIVERY",
  "deliveryAddress": "Rua das Flores, 100, Centro",
  "deliveryReference": "Perto da praça",
  "customerNotes": "Tocar a campainha",
  "items": [
    {
      "productId": "<uuid do produto>",
      "quantity": 2,
      "extras": [{ "extraId": "<uuid>", "quantity": 1 }],
      "removedIngredients": ["cebola"],
      "notes": "Bem passado"
    }
  ]
}
```
O corpo é **estrito**: `total`, `price`, `discount`, `deliveryFee`, `status` ou qualquer campo desconhecido geram `400`. Preços, taxa e totais vêm **somente do banco**.

**Resposta `201`** (`200` + cabeçalho `Idempotent-Replayed: true` em repetição):
```json
{ "data": {
  "order": { "publicId": "...", "orderNumber": 42, "status": "AGUARDANDO_CONTATO_WHATSAPP",
             "items": [...], "subtotalCents": 8380, "deliveryFeeCents": 600, "totalCents": 8980,
             "outsideBusinessHours": false, "estimatedPrepMinutes": 40 },
  "whatsapp": { "url": "https://wa.me/5575...?text=...", "message": "..." },
  "notice": "Pedido registrado. Ele só será confirmado pela equipe depois que você enviar a mensagem pelo WhatsApp.",
  "idempotentReplay": false
} }
```
O frontend deve **abrir `whatsapp.url`** e exibir o resumo devolvido (recalculado). A API apenas prepara o link: não sabe se o cliente enviou a mensagem e o pedido **nunca** nasce confirmado.

| Status | Código | Quando |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Corpo inválido, campo inesperado, `Idempotency-Key` ausente/inválida |
| 409 | `IDEMPOTENCY_CONFLICT` | Mesma chave usada com um pedido **diferente** |
| 422 | `ITEM_UNAVAILABLE` | Produto indisponível/inativo/arquivado, adicional não permitido ou indisponível, ingrediente não removível. `details[]` traz `itemIndex` e `reason` |
| 422 | `MIN_ORDER_NOT_MET` | Subtotal abaixo do mínimo (a taxa de entrega não conta) |
| 422 | `STORE_CLOSED` | Fora do horário e a loja **não** aceita pedidos fora do horário |
| 422 | `FULFILLMENT_UNAVAILABLE` | Entrega ou retirada desativada nas configurações |
| 429 | `RATE_LIMITED` | Mais de 15 pedidos/10 min por IP |
| 503 | `SERVICE_UNAVAILABLE` | Loja sem configuração ou com número de WhatsApp inválido (nada é gravado) |

Regras: fora do horário com `acceptOrdersOutsideHours=true` o pedido é aceito com `outsideBusinessHours=true` (a mensagem avisa que depende de confirmação). Retirada ignora endereço e taxa. Nome de ingrediente removido é gravado com o nome oficial do cardápio. Textos livres viram uma única linha (sem quebras de linha nem caracteres invisíveis), o que impede injetar linhas falsas na mensagem. Se a mensagem ficar longa demais para um link, usa-se uma versão compacta com os totais (itens consultáveis no painel pelo número do pedido).

**Idempotência:** a chave é gravada no pedido junto com o hash do corpo normalizado. Mesma chave + mesmo corpo devolve o pedido original (inclusive sob requisições simultâneas, via restrição UNIQUE do banco); mesma chave + corpo diferente devolve `409`.

### `GET /api/v1/orders/:publicId`
Consulta pública pelo identificador aleatório (144 bits, 24 caracteres). Devolve só o necessário: status, itens, valores, **primeiro nome**, modalidade e datas. Não devolve telefone, endereço, observações internas nem ids internos. Identificador inválido ou inexistente responde `404` igual. Limite: 60/min por IP. Não há listagem pública nem consulta por número sequencial.

> Ambas as rotas respondem com `Cache-Control: no-store`.

## 8. Verificar
```bash
curl http://localhost:3333/api/v1/health   # {"status":"ok"}
curl http://localhost:3333/api/v1/ready    # 200 se o PostgreSQL responder, 503 se não
```

## Scripts
| Script | O que faz |
|---|---|
| `npm run dev` | API em modo desenvolvimento |
| `npm run build` / `npm start` | Compila / roda em produção |
| `npm run typecheck` | Checagem de tipos |
| `npm run prisma:validate` | Valida o `schema.prisma` |
| `npm run db:migrate:dev` | Cria/aplica migrações (dev) |
| `npm run db:migrate:deploy` | Aplica migrações (produção) |
| `npm run db:seed` | Seed idempotente (configurações + categorias) |
| `npm run admin:create` | Cria administrador (CLI, senha oculta) |
| `npm test` | Testes unitários (a Etapa 7 adiciona os de integração com banco de testes) |

## Decisões de arquitetura (resumo)
- Valores monetários: **centavos inteiros** (`Int`).
- Pedido guarda **snapshot** (nome, preços, adicionais) — editar o cardápio não altera pedidos antigos.
- `Order.publicId` aleatório para consulta pública; `orderNumber` sequencial só para a equipe/mensagem.
- Sessão admin no servidor (cookie HttpOnly com token aleatório; só o hash fica no banco) + CSRF.
- Erros centralizados: nunca vazam stack, SQL ou detalhes do banco.
