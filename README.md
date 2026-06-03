# Castelo Alimentos · Storefront demo

Catálogo web estático para a Castela (agente B2B) e Olívia (agente B2C) no Yalo. Substitui o storefront hospedado no Replit do M Dias Branco.

## Como funciona

1. Usuário clica em **"Ver catálogo"** no WhatsApp → abre este site.
2. Navega categorias, adiciona produtos ao carrinho, finaliza.
3. Ao finalizar, o site monta um deep link `wa.me` com o pedido pré-formatado e o usuário toca em "Enviar" no WhatsApp.
4. A mensagem `*PEDIDO#XXXX* ...` chega no bot, que detecta o prefixo e responde com o resumo.

## Stack

- HTML + CSS + JS vanilla, sem build, sem dependências.
- Catálogo (`products.js`) gerado offline a partir da API VTEX pública da Castelo (`/api/catalog_system/pub/products/search`). **107 produtos** com fotos servidas pelo CDN VTEX da própria Castelo.
- Hospedagem: **GitHub Pages** (estático, HTTPS gratuito).

## Configuração do número do bot

O número do WhatsApp Business é lido em runtime via query param:

```
https://<este-site>/?wa=5511999999999
```

O Builder passa o número no CTA URL, então o storefront sempre usa o número correto do fluxo que o invocou.

Parâmetro opcional `&u=<ref>` permite passar uma referência do usuário (ex: CNPJ B2B) para vir junto no pedido.

## Atualizar o catálogo

Re-rodar `tools/fetch_catalog.py` (se existir) ou repetir o curl da API VTEX e re-gerar `products.js`. Commit + push → Pages atualiza em ~1 min.
