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
| `NEXT_PUBLIC_API_URL` | URL base da API, ex.: `http://localhost:3333/api/v1` (a porta do backend em `PORT`). Pública: nunca coloque segredos. |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site (metadados). |

Variáveis `NEXT_PUBLIC_*` são embutidas no build. Mudou a URL da API? Gere o build de novo.

## Depende de configuração externa

- **Backend** com os endpoints abaixo, CORS liberando a origem do site **com credenciais** (`Access-Control-Allow-Credentials: true`).
- **Sessão do admin** por cookie `httpOnly` + `Secure` + `SameSite` definido pelo backend. O frontend nunca guarda token nem senha. Se site e API ficarem em domínios diferentes, o cookie precisa de `SameSite=None; Secure`.
- **Número do WhatsApp** (campo `whatsapp` das configurações), cadastrado em `/admin/configuracoes`. Não existe número no código.
- **Logo oficial e foto principal**: enviadas em `/admin/configuracoes`. Sem elas, o site usa a logo tipográfica provisória e um fundo de grelha (nenhuma foto é inventada).
- **Upload de imagens**: endpoint `POST /admin/uploads` do backend.
- **Seções da home**: "Combos" e "Acompanhamentos e bebidas" agrupam categorias por *slug* (`src/config/site.ts`, `HOME_SECTIONS`). Ajuste os slugs conforme as categorias reais.

## Integração com o backend

O contrato é o do backend (veja o README dele). Ele trabalha em **centavos**, responde `{ data }` / `{ data, meta }` / `{ error: { code, message } }` e usa enums em pt-BR (`DELIVERY`, `AGUARDANDO_CONTATO_WHATSAPP`...). Toda a tradução fica em **`src/services/mappers.ts`** (mais `services/http.ts` para envelope, erros e CSRF); os modelos de `src/types` (valores em reais, enums em inglês) são o que as telas usam. Se o backend mudar, ajuste esses arquivos; as telas não precisam mudar.

Públicos (já integrados):

| Rota do backend | Uso no site |
|---|---|
| `GET /categories` | Categorias ativas, já ordenadas |
| `GET /products` | Cardápio. O backend pagina (máx. 50); o `productsService.list` busca todas as páginas. Cada produto traz `hasExtras`; os adicionais completos vêm só no detalhe |
| `GET /products/:slugOuId` | Detalhe com adicionais. O site usa o `id` do produto nos links |
| `GET /settings/public` | Nome, WhatsApp, endereço, horários, taxa, pedido mínimo |
| `POST /cart/quote` | Preços oficiais, disponibilidade, pedido mínimo, horário e `canCheckout` |
| `POST /orders` | Registra o pedido (`Idempotency-Key`). Devolve o pedido e o link do WhatsApp prontos |

Painel admin: só **login, `/me` e logout** existem no backend hoje. O token CSRF devolvido por eles é guardado **em memória** e enviado em `X-CSRF-Token` em toda requisição que altera dados. As demais telas do painel (`/admin/orders`, `/admin/products`, `/admin/categories`, `/admin/settings`, `/admin/users`, `/admin/dashboard`, `/admin/uploads`) aguardam as Etapas 5 e 6 do backend; os `services/` correspondentes ainda seguem o contrato proposto antes (reais, sem envelope) e **precisarão passar pelo mapeador** quando essas rotas existirem. Alterações usam `PATCH`, o método liberado no CORS do backend.

Status de pedido nas telas: `awaiting_whatsapp, confirmed, preparing, ready, out_for_delivery, completed, cancelled`.

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
  components/     layout · products · cart · checkout · admin · ui · fx (efeitos Canvas UI)
  context/        carrinho, configurações públicas, sessão admin
  hooks/          useAsync (com polling), useMenu, useCartQuote, useDebounce
  services/       camada HTTP e um serviço por domínio
  schemas/        validações Zod
  types/          contratos da API
  utils/          formatação, status, WhatsApp
```

> **Atenção:** não crie uma pasta `app/` na raiz do projeto. Se ela existir, o Next.js ignora `src/app` e todas as rotas, exceto uma, passam a dar 404. Tudo fica dentro de `src/`.

## Efeitos (Canvas UI)

`src/components/fx/` contém o **Blaze** (fogo no hero) e o **Flame Wrap** (borda de fogo no botão "Ver cardápio"), copiados de [github.com/DavidHDev/canvas-ui](https://github.com/DavidHDev/canvas-ui) (licença MIT + Commons Clause: pode usar em site de cliente, não pode revender os componentes). Só as variantes WebGL foram copiadas; não há dependência nova.

- Sem o recurso experimental *HTML-in-canvas* do Chrome (o caso da maioria dos aparelhos), o conteúdo aparece como HTML normal e o efeito vira uma camada de fogo por cima. Nada quebra.
- Os efeitos pausam fora da tela e respeitam `prefers-reduced-motion`.
- Use só no hero. Não aplique no cardápio, carrinho ou checkout.

## Segurança

- Sem credenciais no código; sessão admin por cookie httpOnly do backend.
- Permissões são aplicadas pelo backend; a interface só reflete (`allowedTransitions`, 401/403).
- Erros 5xx mostram mensagem genérica, sem detalhes do servidor.
- Nenhum HTML vindo da API é renderizado como HTML.
- Cabeçalhos de segurança básicos em `next.config.mjs`. Defina uma CSP no servidor de produção conforme os domínios de imagem usados.

## Implantação

Vercel, Docker ou Node com `npm run build && npm start`. Configure as variáveis de ambiente no provedor e garanta HTTPS (o cookie de sessão exige `Secure`).
