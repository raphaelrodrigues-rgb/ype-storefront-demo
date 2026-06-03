# Ypê Storefront Demo

Storefront WhatsApp-ready para a demo da **Ypê** (Química Amparo). 185 SKUs reais (Linhas-Mãe: Lavanderia, Cozinha, Limpeza Pesada, Cuidados Pessoais, Lançamentos), pricing B2B vs Varejo, carrinho via WhatsApp Deep Link.

## Estrutura

- `index.html` — SPA 3-telas (Catálogo · Carrinho · Confirmação)
- `app.js` — engine: cart state, busca, filter por categoria, monta `wa.me?text=PEDIDO#...`
- `products.js` — catálogo (185 SKUs gerados da planilha master Ypê)
- `styles.css` — paleta Ypê (verde `#00A651` + amarelo `#FFD80B`)
- `assets/` — logo Ypê + 5 placeholder por Linha-Mãe

## Como acessar

URL base: `https://raphaelrodrigues-rgb.github.io/ype-storefront-demo/`

Parâmetros suportados via query string:
- `?wa=551149336819` — número do bot WhatsApp pra retornar o pedido (padrão: BR-2)
- `?u=YPE-PDV-XXXXX` — código do PDV (aparece no pedido como `Ref:`)

Exemplo completo:
```
https://raphaelrodrigues-rgb.github.io/ype-storefront-demo/?wa=551149336819&u=YPE-PDV-15302017000121
```

## Como funciona o checkout

1. Lojista navega o catálogo, adiciona ao carrinho
2. Toca em "FINALIZAR PEDIDO"
3. Storefront monta `wa.me/551149336819?text=PEDIDO#<código>%0A<itens>%0A<total>`
4. WhatsApp abre com a mensagem pré-preenchida
5. Lojista toca em enviar — flow Yalo `wa-se1602-yalo-br-2` recebe o `PEDIDO#...`
6. Webhook "Back from Storefront" parsea, gera order_id, mostra confirmação

## Origem

Forkado do template `castelo-storefront-demo` (mesmo engine VTEX-style). Adaptado pra Ypê com:
- 185 SKUs reais (planilha master Ypê)
- 5 Linhas-Mãe em vez das 8 categorias Castelo
- Pricing B2B/Varejo em vez de só varejo
- Paleta Ypê (verde + amarelo)
