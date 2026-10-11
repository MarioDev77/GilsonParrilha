# Gilson Parrilha — Frontend

Frontend do sistema de pedidos da hamburgueria artesanal **Gilson Parrilha**: site público, cardápio, carrinho, finalização pelo WhatsApp e painel `/admin`.
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 · React Hook Form + Zod · Framer Motion · Sonner · Lucide.

O frontend roda **separado do backend**. Ele não acessa banco de dados, não guarda segredos e não calcula preço definitivo: tudo isso é responsabilidade da API.

## Instalação e execução

Requisitos: Node.js 20 ou superior.

```bash
npm install
cp .env.example .env.local   # ajuste a URL da API
npm run dev                  # http://localhost:3000
```

Produção:

```bash
npm run build
npm start
```

Verificação de tipos: `npm run typecheck`.

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API, ex.: `http://localhost:4000/api/v1`. Pública: nunca coloque segredos. |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site (metadados). |

Variáveis `NEXT_PUBLIC_*` são embutidas no build. Mudou a URL da API? Gere o build de novo.

## Depende de configuração externa

- **Backend** com os endpoints abaixo, CORS liberando a origem do site **com credenciais** (`Access-Control-Allow-Credentials: true`).
- **Sessão do admin** por cookie `httpOnly` + `Secure` + `SameSite` definido pelo backend. O frontend nunca guarda token nem senha. Se site e API ficarem em domínios diferentes, o cookie precisa de `SameSite=None; Secure`.
- **Número do WhatsApp** (campo `whatsapp` das configurações), cadastrado em `/admin/configuracoes`. Não existe número no código.
- **Logo oficial e foto principal**: enviadas em `/admin/configuracoes`. Sem elas, o site usa a logo tipográfica provisória e um fundo de grelha (nenhuma foto é inventada).
- **Upload de imagens**: endpoint `POST /admin/uploads` do backend.
- **Seções da home**: "Combos" e "Acompanhamentos e bebidas" agrupam categorias por *slug* (`src/config/site.ts`, `HOME_SECTIONS`). Ajuste os slugs conforme as categorias reais.

## Contrato esperado da API

Nenhuma documentação do backend foi fornecida, então os contratos em `src/types/index.ts` e `src/services/*` são uma **proposta**. Se o backend real for diferente, ajuste esses dois lugares; as telas não precisam mudar. Valores em reais (`number`). Corpos JSON sem envelope.

Públicos:

| Método e rota | Uso |
|---|---|
| `GET /categories` | Categorias (`id, name, slug, order, active`) |
| `GET /products` | Produtos com `addons`, `ingredients`, `removableIngredients`, `available`, `featured`, `badge` |
| `GET /products/:id` | Detalhe de um produto |
| `GET /settings` | Configurações públicas (nome, WhatsApp, horários, taxa, etc.) |
| `POST /cart/quote` | Recebe `{ items, fulfillment }`; devolve preços oficiais, disponibilidade e `canCheckout` |
| `POST /orders` | Registra o pedido. Header `Idempotency-Key`. Devolve `id`, `number`, `status`, totais e `whatsappUrl` ou `whatsappMessage` |

Administrativos (todos exigem sessão válida; 401 → login, 403 → "sem permissão"):

`POST /admin/auth/login` · `POST /admin/auth/logout` · `GET /admin/auth/me` · `GET /admin/dashboard?days=` · `GET /admin/orders` (filtros `q, status, dateFrom, dateTo, page, pageSize`) · `GET /admin/orders/:id` (inclui `allowedTransitions`) · `PATCH /admin/orders/:id/status` (`{ status, reason? }`) · `PATCH /admin/orders/:id/notes` · `GET|POST /admin/products` · `PUT|DELETE /admin/products/:id` · `PATCH /admin/products/:id/availability` · `GET|POST /admin/categories` · `PUT|DELETE /admin/categories/:id` · `PUT /admin/categories/order` · `GET|PUT /admin/settings` · `GET|POST /admin/users` · `PUT|DELETE /admin/users/:id` · `GET /admin/roles` · `POST /admin/uploads`

Status de pedido: `awaiting_whatsapp, confirmed, preparing, ready, out_for_delivery, completed, cancelled`.

## Como o fluxo do pedido funciona

1. O carrinho guarda no navegador só as **escolhas** (produto, quantidade, adicionais, observações), nunca preços.
2. Carrinho e checkout chamam `POST /cart/quote`; os valores exibidos vêm do servidor. Item indisponível ou pedido abaixo do mínimo bloqueia o avanço.
3. "Registrar pedido" envia o pedido com `Idempotency-Key`; o botão fica travado durante o envio e a chave é reutilizada em reenvios do mesmo conteúdo, evitando pedidos duplicados.
4. A tela `/pedido/:id` mostra o resumo e o botão **Finalizar pedido pelo WhatsApp**, que abre o WhatsApp com a mensagem pronta. O site avisa que o cliente precisa **enviar** a mensagem e não afirma que o pedido foi enviado ou confirmado. O status exibido continua "Aguardando contato pelo WhatsApp" até a equipe atualizar no painel.
5. O resumo do pedido fica só no `sessionStorage` da aba, apenas para exibir essa tela. Não é banco de dados.

## Estrutura

```
src/
  app/            (site)/ público · admin/ painel
  components/     layout · products · cart · checkout · admin · ui
  context/        carrinho, configurações públicas, sessão admin
  hooks/          useAsync (com polling), useMenu, useCartQuote, useDebounce
  services/       camada HTTP e um serviço por domínio
  schemas/        validações Zod
  types/          contratos da API
  utils/          formatação, status, WhatsApp
```

## Segurança

- Sem credenciais no código; sessão admin por cookie httpOnly do backend.
- Permissões são aplicadas pelo backend; a interface só reflete (`allowedTransitions`, 401/403).
- Erros 5xx mostram mensagem genérica, sem detalhes do servidor.
- Nenhum HTML vindo da API é renderizado como HTML.
- Cabeçalhos de segurança básicos em `next.config.mjs`. Defina uma CSP no servidor de produção conforme os domínios de imagem usados.

## Implantação

Vercel, Docker ou Node com `npm run build && npm start`. Configure as variáveis de ambiente no provedor e garanta HTTPS (o cookie de sessão exige `Secure`).
