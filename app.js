/* ================================================================
   Castelo Alimentos · Storefront demo
   Lê window.CASTELO_PRODUCTS (definido em products.js) e renderiza
   catálogo + carrinho + checkout via wa.me deep link.

   Configuração: número do bot via query param ?wa=55XXXXXXXXXX
   ou padrão definido em BOT_NUMBER_DEFAULT abaixo.
   ================================================================ */

(function(){
  'use strict';

  // ---------- Config ----------
  const BOT_NUMBER_DEFAULT = '551149336819'; // Castela (wa-se1602-yalo-br-2). Pode ser sobrescrito via ?wa=...
  const URL_PARAMS = new URLSearchParams(location.search);
  const BOT_NUMBER = (URL_PARAMS.get('wa') || BOT_NUMBER_DEFAULT).replace(/\D/g,'');
  const USER_REF   = URL_PARAMS.get('u') || ''; // referência opcional do usuário (vindo do bot)
  const PRELOAD_CART = URL_PARAMS.get('cart') || ''; // formato: ID1xQTY1,ID2xQTY2,...

  const PRODUCTS = window.CASTELO_PRODUCTS || [];
  const CATS = [...new Set(PRODUCTS.map(p=>p.category))]; // mantém ordem do JSON

  // ---------- Estado ----------
  const cart = new Map(); // productId -> qty
  let activeCat = 'Todos';
  let searchQ = '';

  // ---------- Utils ----------
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
  const fmt = n => 'R$ ' + Number(n||0).toFixed(2).replace('.', ',');
  const byId = id => PRODUCTS.find(p=>p.id===id);
  const cartCount = ()=>[...cart.values()].reduce((a,b)=>a+b,0);
  const cartTotal = ()=>[...cart.entries()].reduce((s,[id,q])=>s + (byId(id)?.price||0)*q, 0);
  const cartItems = ()=>[...cart.entries()].map(([id,q])=>({...byId(id),qty:q}));
  function shortCode(){
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s=''; for(let i=0;i<4;i++) s+=chars[Math.floor(Math.random()*chars.length)];
    return s;
  }

  // ---------- Render: tabs de categorias ----------
  function renderCats(){
    const nav = $('#cats-nav');
    const all = [{name:'Todos'}, ...CATS.map(c=>({name:c}))];
    nav.innerHTML = all.map(c =>
      `<button class="cat-pill ${c.name===activeCat?'active':''}" data-cat="${c.name}">${c.name}</button>`
    ).join('');
    $$('#cats-nav .cat-pill').forEach(b=>{
      b.addEventListener('click', ()=>{ activeCat=b.dataset.cat; searchQ=''; $('#search-input').value=''; renderCats(); renderGrid(); });
    });
  }

  // ---------- Render: imagem do produto ----------
  function imgHTML(p, size='product'){
    if(p.image){
      return `<div class="product-img"><img src="${p.image}" alt="${escapeAttr(p.name)}" loading="lazy" onerror="this.parentNode.classList.add('fallback');this.remove();this.parentNode.textContent='🫙';"/></div>`;
    }
    return `<div class="product-img fallback">🫙</div>`;
  }
  function escapeAttr(s){return String(s).replace(/"/g,'&quot;').replace(/</g,'&lt;');}
  function escapeHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  // ---------- Render: card de produto ----------
  function productCardHTML(p, variant='grid'){
    const qty = cart.get(p.id) || 0;
    const unavailable = !p.available;
    const cls = variant==='rec' ? 'product-card rec-card' : 'product-card';
    return `
      <article class="${cls} ${unavailable?'unavailable':''}" data-id="${p.id}">
        ${unavailable?'<span class="unavailable-tag">Esgotado</span>':''}
        ${imgHTML(p)}
        <div class="product-cat">${escapeHtml(p.category)}</div>
        <h3 class="product-name">${escapeHtml(p.name)}</h3>
        <div class="product-price">${p.listPrice && p.listPrice>p.price ? `<span class="list">${fmt(p.listPrice)}</span>`:''}${fmt(p.price)}</div>
        ${unavailable
          ? `<button class="add-btn" disabled>Indisponível</button>`
          : `<div class="qty">
               <button class="qty-btn" data-act="dec" aria-label="Remover" ${qty===0?'disabled':''}>−</button>
               <span class="qty-val">${qty}</span>
               <button class="qty-btn" data-act="inc" aria-label="Adicionar">+</button>
             </div>`
        }
      </article>`;
  }

  // ---------- Render: grid principal ----------
  function renderGrid(){
    let items = PRODUCTS;
    if(activeCat!=='Todos') items = items.filter(p=>p.category===activeCat);
    if(searchQ){
      const q = searchQ.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    $('#grid-title').textContent = activeCat==='Todos'
      ? (searchQ ? `Resultados para "${searchQ}"` : `Todos os produtos (${items.length})`)
      : `${activeCat} (${items.length})`;
    $('#product-grid').innerHTML = items.map(p=>productCardHTML(p)).join('');
    $('#empty-state').hidden = items.length>0;
    // Recomendados só aparecem em "Todos" sem busca
    $('#rec-section').hidden = !(activeCat==='Todos' && !searchQ);
    wireProductButtons('#product-grid');
  }

  // ---------- Render: quick-cats (chips circulares com foto de produto representativo) ----------
  function renderQuickCats(){
    const wrap = $('#quick-cats'); if(!wrap) return;
    // Pega 1 produto disponível por categoria, na ordem CATS
    const items = CATS.map(cat=>{
      const p = PRODUCTS.find(x=>x.category===cat && x.available && x.image);
      return {cat, img: p?.image};
    });
    wrap.innerHTML = items.map(it => `
      <div class="quick-cat" data-cat="${escapeAttr(it.cat)}">
        <div class="quick-cat-img">${it.img?`<img src="${it.img}" alt="" loading="lazy" onerror="this.parentNode.textContent='🫙'"/>`:'🫙'}</div>
        <span class="quick-cat-name">${escapeHtml(it.cat)}</span>
      </div>`).join('');
    $$('#quick-cats .quick-cat').forEach(el=>{
      el.addEventListener('click', ()=>{
        activeCat = el.dataset.cat;
        searchQ = ''; $('#search-input').value='';
        renderCats(); renderGrid();
        $('#grid-title')?.scrollIntoView({behavior:'smooth', block:'start'});
      });
    });
  }

  // ---------- Render: recomendados ----------
  function renderRecommended(){
    const recs = PRODUCTS.filter(p=>p.recommended && p.available);
    $('#rec-scroller').innerHTML = recs.map(p=>productCardHTML(p,'rec')).join('');
    wireProductButtons('#rec-scroller');
  }

  // ---------- Wire-up dos botões +/-/adicionar ----------
  function wireProductButtons(scope){
    $$(`${scope} .product-card`).forEach(card=>{
      const id = card.dataset.id;
      card.querySelectorAll('[data-act]').forEach(btn=>{
        btn.addEventListener('click', e=>{
          e.preventDefault();
          const act = btn.dataset.act;
          const cur = cart.get(id) || 0;
          if(act==='add' || act==='inc') cart.set(id, cur+1);
          else if(act==='dec'){
            if(cur<=1) cart.delete(id); else cart.set(id, cur-1);
          }
          renderGrid();
          renderRecommended();
          renderCartFab();
        });
      });
    });
  }

  // ---------- FAB do carrinho ----------
  function renderCartFab(){
    const n = cartCount();
    const fab = $('#cart-fab');
    const badge = $('#cart-badge');
    if(n>0){
      fab.hidden = false;
      $('#cart-fab-total').textContent = `${n} ${n===1?'item':'itens'} · ${fmt(cartTotal())}`;
      badge.hidden = false; badge.textContent = n;
    } else {
      fab.hidden = true;
      badge.hidden = true;
    }
  }

  // ---------- Tela: carrinho ----------
  function renderCart(){
    const items = cartItems();
    const list = $('#cart-list');
    if(items.length===0){
      list.innerHTML = '';
      $('#cart-empty').hidden = false;
      $('#totals').hidden = true;
      $('#upsell-section').hidden = true;
      $('#checkout-fab').hidden = true;
      return;
    }
    $('#cart-empty').hidden = true;
    list.innerHTML = items.map(it=>`
      <li class="cart-item" data-id="${it.id}">
        <div class="cart-item-img">${it.image?`<img src="${it.image}" alt="" onerror="this.parentNode.textContent='🫙'"/>`:'🫙'}</div>
        <div class="cart-item-info">
          <p class="cart-item-name">${escapeHtml(it.name)}</p>
          <span class="cart-item-unit">${fmt(it.price)} cada</span>
        </div>
        <div class="cart-item-right">
          <span class="cart-item-sub">${fmt(it.price*it.qty)}</span>
          <div class="cart-item-qty">
            <button class="qty-btn" data-act="dec">−</button>
            <span class="qty-val">${it.qty}</span>
            <button class="qty-btn" data-act="inc">+</button>
          </div>
        </div>
      </li>`).join('');

    // wire qty buttons
    $$('#cart-list .cart-item').forEach(li=>{
      const id = li.dataset.id;
      li.querySelectorAll('[data-act]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const cur = cart.get(id) || 0;
          if(btn.dataset.act==='inc') cart.set(id, cur+1);
          else { if(cur<=1) cart.delete(id); else cart.set(id, cur-1); }
          renderCart();
          renderCartFab();
        });
      });
    });

    // Totals
    $('#totals').hidden = false;
    $('#totals-subtotal').textContent = fmt(cartTotal());
    $('#totals-count').textContent = cartCount();
    $('#totals-grand').textContent = fmt(cartTotal());

    // Upsell — pega categorias presentes no carrinho e sugere outras
    const cartCats = new Set(items.map(i=>i.category));
    const cartIds = new Set(items.map(i=>i.id));
    const upsell = PRODUCTS.filter(p=>p.available && !cartIds.has(p.id) && !cartCats.has(p.category)).slice(0,6);
    if(upsell.length){
      $('#upsell-section').hidden = false;
      $('#upsell-scroller').innerHTML = upsell.map(p=>productCardHTML(p,'rec')).join('');
      wireProductButtons('#upsell-scroller');
    } else $('#upsell-section').hidden = true;

    $('#checkout-fab').hidden = false;
  }

  // ---------- Telas (navegação) ----------
  function showScreen(name){
    ['catalog','cart','confirm'].forEach(s=>{
      $('#screen-'+s).hidden = (s!==name);
    });
    window.scrollTo(0,0);
  }

  // ---------- Checkout: monta wa.me deep link ----------
  function buildOrderText(code){
    const items = cartItems();
    const lines = items.map(it=>`• ${it.name} — ${it.qty}x ${fmt(it.price)} = ${fmt(it.price*it.qty)}`);
    const total = fmt(cartTotal());
    const ref = USER_REF ? `\nRef: ${USER_REF}` : '';
    return `*PEDIDO#${code}*${ref}\n\n${lines.join('\n')}\n\n*Total: ${total}*\n_(Enviado pelo catálogo Castelo)_`;
  }
  function gotoConfirm(){
    if(cartCount()===0) return;
    const code = shortCode();
    const text = buildOrderText(code);
    const url = `https://wa.me/${BOT_NUMBER}?text=${encodeURIComponent(text)}`;
    // Overlay rapido + navega direto para o WhatsApp (sem tela intermediaria)
    showOpeningOverlay();
    setTimeout(()=>{ window.location.href = url; }, 250);
  }

  function showOpeningOverlay(){
    let ov = document.getElementById('wa-opening-overlay');
    if(ov) return;
    ov = document.createElement('div');
    ov.id = 'wa-opening-overlay';
    ov.innerHTML = '<div class="wa-opening-card"><div class="wa-spinner"></div><p>Abrindo WhatsApp…</p></div>';
    document.body.appendChild(ov);
  }

  // ---------- Inicialização ----------
  function init(){
    if(!PRODUCTS.length){
      $('#product-grid').innerHTML = '<p class="empty">Catálogo vazio.</p>';
      return;
    }
    // Pre-load do carrinho via ?cart=ID1xQTY1,ID2xQTY2,...
    if(PRELOAD_CART){
      for(const pair of PRELOAD_CART.split(',')){
        const [id, qty] = pair.split('x');
        const n = parseInt(qty||'1', 10);
        if(id && byId(id) && byId(id).available && n>0) cart.set(id, n);
      }
    }

    renderCats();
    renderQuickCats();
    renderRecommended();
    renderGrid();
    renderCartFab();

    // Se carrinho veio pre-carregado, ja abre a tela do carrinho
    if(cartCount()>0 && PRELOAD_CART){
      renderCart();
      showScreen('cart');
    }

    // Hero CTA: rola pra recomendados
    $('#hero-cta')?.addEventListener('click', ()=>{
      $('#rec-section')?.scrollIntoView({behavior:'smooth', block:'start'});
    });

    $('#search-input').addEventListener('input', e=>{
      searchQ = e.target.value.trim();
      renderGrid();
    });
    $('#open-cart-btn').addEventListener('click', ()=>{ renderCart(); showScreen('cart'); });
    $('#cart-fab').addEventListener('click', ()=>{ renderCart(); showScreen('cart'); });
    $('#back-to-catalog').addEventListener('click', ()=> showScreen('catalog'));
    $('#back-shop')?.addEventListener('click', ()=> showScreen('catalog'));
    $('#back-to-cart').addEventListener('click', ()=>{ renderCart(); showScreen('cart'); });
    $('#checkout-fab').addEventListener('click', gotoConfirm);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
