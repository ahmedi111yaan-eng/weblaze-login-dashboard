import { createClient } from '@supabase/supabase-js'
import './style.css'

const STATUSES = ['pending','confirmed','shipped','delivered','cancelled']
const cap = t => t.charAt(0).toUpperCase() + t.slice(1)
const BUCKET = 'product-images'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const app = document.querySelector('#app')

if (!url || !key) {
  app.innerHTML = `<main class="setup"><div class="mark">WB</div><p class="eyebrow">WEB BLAZE · SETUP REQUIRED</p><h1>Connect your workspace</h1><p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in Vercel → Project → Settings → Environment Variables, then redeploy.</p></main>`
} else {
  const sb = createClient(url, key)
  app.innerHTML = `
  <main class="shell">
    <header><a class="brand" href="#"><b>WB</b><span>WEB BLAZE<small>ORDER MANAGEMENT</small></span></a><span class="secure">● Secure workspace</span></header>
    <section id="auth" class="auth-grid">
      <div class="intro"><p class="eyebrow">YOUR BUSINESS, IN CONTROL</p><h1>Orders organised.<br><em>Business simplified.</em></h1><p class="muted">A private workspace for your store orders. Sign in to manage your own shop.</p></div>
      <div class="panel auth-panel"><p class="eyebrow">WELCOME TO WEB BLAZE</p><h2 id="authTitle">Sign in</h2><p class="muted" id="authSub">Access your order workspace.</p>
        <form id="authForm"><label>Email address<input id="email" type="email" autocomplete="email" required placeholder="you@example.com"></label><label>Password<input id="password" type="password" minlength="8" required placeholder="At least 8 characters"></label><button class="primary" id="submit" type="submit">Sign in ↗</button></form>
        <p id="message" class="message" role="status"></p><p class="switch">New to Web Blaze? <button id="toggle" class="link" type="button">Create account</button></p><p class="fine">Use your own account. Never share your password or secret keys.</p>
      </div>
    </section>
    <section id="dash" class="hidden dashboard">
      <div class="dashhead"><div><p class="eyebrow">YOUR WORKSPACE</p><h1>Order dashboard</h1><p id="signed" class="muted"></p></div><button id="logout" class="secondary">Sign out</button></div>
      <div class="panel store"><div><p class="eyebrow">STORE</p><h2 id="storeTitle">Your store</h2><p id="storeHint" class="muted">Create your store workspace to begin.</p></div>
        <label id="storePickWrap" class="hidden storepick">Switch store<select id="storePick"></select></label>
        <form id="storeForm"><input id="storeName" minlength="2" maxlength="120" required placeholder="e.g. Ahiyas Fashion"><button class="primary" type="submit">Create store</button></form></div>
      <div class="stats"><div class="panel stat"><span class="muted">Orders loaded</span><strong id="total">0</strong></div><div class="panel stat"><span class="muted">Pending</span><strong id="pending">0</strong></div><div class="panel stat"><span class="muted">Store status</span><strong id="status">Not set up</strong></div></div>
      <nav class="tabs" id="tabs"><button class="tab on" data-tab="orders" type="button">Orders</button><button class="tab" data-tab="products" type="button">Products</button></nav>
      <div class="panel orders" id="tab-orders"><div class="dashhead"><div><p class="eyebrow">ORDER MANAGEMENT</p><h2>Orders</h2></div><div class="row"><select id="statusFilter" aria-label="Filter by status"><option value="">All statuses</option>${STATUSES.map(s=>`<option value="${s}">${cap(s)}</option>`).join('')}</select><button id="refresh" class="secondary">Refresh</button></div></div><div id="orderList" class="empty">Create a store to start setting up order management.</div></div>
      <div class="panel orders hidden" id="tab-products"><div class="dashhead"><div><p class="eyebrow">CATALOGUE</p><h2>Products</h2></div></div>
        <form id="productForm" class="pform"><label>Product name<input id="pName" required maxlength="160" placeholder="e.g. Cotton Three-piece"></label><label>Price (৳)<input id="pPrice" type="number" min="0" step="0.01" required inputmode="decimal"></label><label>Category<input id="pCat" maxlength="60" placeholder="e.g. Three-piece"></label><label>Description<input id="pDesc" maxlength="500"></label><label>Photo<input id="pPhoto" type="file" accept="image/jpeg,image/png,image/webp"></label><button class="primary" id="pSubmit" type="submit">Add product</button><p id="pMsg" class="message" role="status"></p></form>
        <div id="productList" class="empty">Loading…</div></div>
      <p class="warning">Real customer data neyar age Supabase Security Advisor check korun ar order-er secret key kokhono frontend-e dibenna.</p>
    </section>
    <footer>© <span id="year"></span> Web Blaze · Private by design<br>Created by Kawsar Ahmed Yaan</footer>
  </main>`
  document.querySelector('#year').textContent = new Date().getFullYear()
  let signup = false
  const $ = s => document.querySelector(s)
  $('#toggle').onclick = () => {
    signup = !signup
    $('#authTitle').textContent = signup ? 'Create account' : 'Sign in'
    $('#authSub').textContent = signup ? 'Create your private store workspace.' : 'Access your order workspace.'
    $('#submit').textContent = signup ? 'Create account ↗' : 'Sign in ↗'
    $('#toggle').textContent = signup ? 'Sign in' : 'Create account'
    $('#message').textContent = ''
  }
  const friendly = m => m.includes('Invalid login credentials') ? 'Email or password is incorrect.' : m.includes('Email not confirmed') ? 'Confirm your email using the link we sent.' : m.includes('Authentication required') ? 'Please sign out and sign in again.' : m
  $('#authForm').onsubmit = async e => {
    e.preventDefault(); $('#submit').disabled = true; $('#message').textContent = ''
    try {
      const email = $('#email').value.trim(), password = $('#password').value
      if (signup) {
        const {data,error} = await sb.auth.signUp({email,password}); if(error) throw error
        $('#message').textContent = data.session ? 'Account created.' : 'Account created. Confirm your email, then sign in.'
      } else {
        const {error} = await sb.auth.signInWithPassword({email,password}); if(error) throw error
      }
    } catch(err) { $('#message').textContent = friendly(err.message || 'Something went wrong.') }
    finally { $('#submit').disabled = false; await render() }
  }
  $('#logout').onclick = async () => { await sb.auth.signOut(); await render() }
  $('#storeForm').onsubmit = async e => {
    e.preventDefault(); const btn = e.submitter; btn.disabled = true
    try {
      const {error} = await sb.rpc('create_store',{p_name:$('#storeName').value.trim()}); if(error) throw error
      $('#storeName').value=''; $('#storeHint').textContent='Store created successfully.'; await loadDashboard()
    } catch(err) { $('#storeHint').textContent = friendly(err.message || 'Could not create store.') }
    finally { btn.disabled=false }
  }
  async function render() {
    const {data:{session}} = await sb.auth.getSession()
    $('#auth').classList.toggle('hidden',!!session); $('#dash').classList.toggle('hidden',!session)
    if(session) { $('#signed').textContent=session.user.email || 'Signed in'; await loadDashboard() }
  }
  // ---------- state ----------
  const state = { stores: [], storeId: localStorageGet('wb_store'), tab: 'orders' }
  function localStorageGet(k){ try { return localStorage.getItem(k) } catch { return null } }
  function localStorageSet(k,v){ try { localStorage.setItem(k,v) } catch {} }
  const money = (c,v) => `${c || 'BDT'} ${Number(v || 0).toLocaleString(undefined,{maximumFractionDigits:2})}`
  const h = (tag, props = {}, ...kids) => {
    const n = document.createElement(tag)
    for (const [k,v] of Object.entries(props)) k in n ? (n[k] = v) : n.setAttribute(k,v)
    for (const c of kids.flat()) if (c != null) n.append(c)
    return n
  }

  $('#tabs').onclick = e => {
    const b = e.target.closest('[data-tab]'); if (!b) return
    state.tab = b.dataset.tab
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t === b))
    $('#tab-orders').classList.toggle('hidden', state.tab !== 'orders')
    $('#tab-products').classList.toggle('hidden', state.tab !== 'products')
    if (state.tab === 'products') loadProducts()
  }
  $('#statusFilter').onchange = loadOrders
  $('#storePick').onchange = e => { state.storeId = e.target.value; localStorageSet('wb_store', state.storeId); showStore(); loadOrders(); if (state.tab === 'products') loadProducts() }

  // ---------- stores ----------
  async function loadDashboard() {
    const {data:{user}} = await sb.auth.getUser(); if (!user) return
    $('#orderList').className = 'empty'; $('#orderList').textContent = 'Loading…'
    const {data:members,error} = await sb.from('store_members').select('store_id,role').eq('user_id',user.id)
    if (error) { $('#storeHint').textContent = friendly(error.message); $('#orderList').textContent = 'Could not load your stores. Refresh and try again.'; return }
    let list = []
    if (members?.length) {
      const {data:rows,error:se} = await sb.from('stores').select('id,name').in('id', members.map(m => m.store_id))
      if (se) { $('#storeHint').textContent = friendly(se.message); $('#orderList').textContent = 'Could not load your stores.'; return }
      list = (rows || []).map(r => ({ id: r.id, name: r.name, role: members.find(m => m.store_id === r.id)?.role }))
    }
    state.stores = list
    if (!state.stores.length) {
      $('#storeTitle').textContent = 'No store yet'; $('#storeHint').textContent = 'Create your first store workspace below.'
      $('#status').textContent = 'Not set up'; $('#total').textContent = '0'; $('#pending').textContent = '0'
      $('#storeForm').classList.remove('hidden'); $('#storePickWrap').classList.add('hidden')
      $('#orderList').textContent = 'Create a store to start managing orders.'
      $('#productList').textContent = 'Create a store first.'; return
    }
    if (!state.stores.some(s => s.id === state.storeId)) state.storeId = state.stores[0].id
    $('#storeForm').classList.add('hidden')
    const pick = $('#storePick'); pick.replaceChildren(...state.stores.map(s => h('option', { value: s.id, textContent: s.name })))
    pick.value = state.storeId
    $('#storePickWrap').classList.toggle('hidden', state.stores.length < 2)
    showStore(); await loadOrders(); if (state.tab === 'products') await loadProducts()
  }
  function currentStore() { return state.stores.find(s => s.id === state.storeId) }
  function showStore() { const s = currentStore(); if (!s) return; $('#storeTitle').textContent = s.name; $('#storeHint').textContent = 'Role: ' + s.role; $('#status').textContent = 'Connected' }

  // ---------- orders ----------
  async function loadOrders() {
    const id = state.storeId; if (!id) return
    const box = $('#orderList'); box.className = 'empty'; box.textContent = 'Loading orders…'
    let q = sb.from('orders').select('id,customer_name,customer_phone,customer_email,shipping_address,total,currency,status,items,customer_note,source,created_at').eq('store_id',id).order('created_at',{ascending:false}).limit(100)
    const f = $('#statusFilter').value; if (f) q = q.eq('status', f)
    const {data:orders,error} = await q
    if (id !== state.storeId) return
    if (error) { box.textContent = 'Could not load orders: ' + friendly(error.message); return }
    $('#total').textContent = orders.length; $('#pending').textContent = orders.filter(o => o.status === 'pending').length
    if (!orders.length) { box.textContent = f ? `No ${f} orders.` : 'Ekhono kono order nai. Website theke order ashle ekhane dekhabe.'; return }
    box.className = 'orderlist'; box.replaceChildren(...orders.map(orderCard))
  }
  function orderCard(o) {
    const items = Array.isArray(o.items) ? o.items : []
    const sel = h('select', { className: 'st st-' + o.status, 'aria-label': 'Order status' }, STATUSES.map(s => h('option', { value: s, textContent: cap(s), selected: s === o.status })))
    sel.onchange = async () => {
      const prev = o.status; sel.disabled = true
      const {data,error} = await sb.from('orders').update({ status: sel.value }).eq('id', o.id).select('id')
      sel.disabled = false
      if (error || !data?.length) { sel.value = prev; alert('Status bodlano gelo na: ' + (error ? friendly(error.message) : 'permission nai')); return }
      o.status = sel.value; sel.className = 'st st-' + o.status
      $('#pending').textContent = [...document.querySelectorAll('#orderList .st')].filter(x => x.value === 'pending').length
    }
    const itemRows = items.length ? items.map(i => h('li', {}, `${i.name ?? 'Item'} × ${i.qty ?? 1}` + (i.price != null ? ` — ${money(o.currency, i.price)}` : ''))) : [h('li', { className: 'muted', textContent: 'No item details' })]
    return h('article', { className: 'order' },
      h('div', { className: 'ohead' },
        h('div', {}, h('strong', { textContent: o.customer_name }), h('span', { className: 'muted', textContent: ' · ' + new Date(o.created_at).toLocaleString() })),
        h('strong', { textContent: money(o.currency, o.total) })),
      h('div', { className: 'ohead' }, h('span', { className: 'muted', textContent: (o.source || 'custom') + (o.customer_phone ? ' · ' + o.customer_phone : '') }), sel),
      h('details', {}, h('summary', { textContent: 'Details' }),
        h('p', {}, h('b', { textContent: 'Address: ' }), o.shipping_address || '—'),
        o.customer_email ? h('p', {}, h('b', { textContent: 'Email: ' }), o.customer_email) : null,
        o.customer_note ? h('p', {}, h('b', { textContent: 'Note: ' }), o.customer_note) : null,
        h('ul', {}, itemRows)))
  }
  $('#refresh').onclick = loadOrders

  // ---------- products + photo upload ----------
  async function shrink(file, max = 1200) {
    try {
      const bmp = await createImageBitmap(file)
      const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
      const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
      return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.85))
    } catch { return file }
  }
  const imgUrl = p => p ? sb.storage.from(BUCKET).getPublicUrl(p).data.publicUrl : ''
  async function loadProducts() {
    const id = state.storeId; if (!id) return
    const box = $('#productList'); box.className = 'empty'; box.textContent = 'Loading products…'
    const {data,error} = await sb.from('products').select('id,name,price,category,description,image_path,active').eq('store_id',id).order('created_at',{ascending:false})
    if (id !== state.storeId) return
    if (error) { box.textContent = 'Could not load products: ' + friendly(error.message); return }
    if (!data.length) { box.textContent = 'Ekhono kono product nai. Upore form diye prothom product add korun.'; return }
    box.className = 'pgrid'
    box.replaceChildren(...data.map(p => {
      const del = h('button', { className: 'secondary small', type: 'button', textContent: 'Delete' })
      del.onclick = async () => {
        if (!confirm(`"${p.name}" muchhe felben?`)) return
        del.disabled = true
        const {error:de} = await sb.from('products').delete().eq('id', p.id)
        if (de) { alert(friendly(de.message)); del.disabled = false; return }
        if (p.image_path) await sb.storage.from(BUCKET).remove([p.image_path])
        loadProducts()
      }
      return h('article', { className: 'product' },
        p.image_path ? h('img', { src: imgUrl(p.image_path), alt: p.name, loading: 'lazy' }) : h('div', { className: 'noimg', textContent: 'No photo' }),
        h('strong', { textContent: p.name }), h('span', { className: 'muted', textContent: `৳ ${Number(p.price).toLocaleString()}${p.category ? ' · ' + p.category : ''}` }), del)
    }))
  }
  $('#productForm').onsubmit = async e => {
    e.preventDefault(); const id = state.storeId; if (!id) return
    const btn = $('#pSubmit'), msg = $('#pMsg'); btn.disabled = true; msg.textContent = 'Uploading…'
    try {
      let path = null; const file = $('#pPhoto').files[0]
      if (file) {
        if (file.size > 15 * 1024 * 1024) throw new Error('Photo onek boro (15MB er niche dao).')
        const blob = await shrink(file); path = `${id}/${crypto.randomUUID()}.jpg`
        const {error} = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' }); if (error) throw error
      }
      const {error} = await sb.from('products').insert({ store_id: id, name: $('#pName').value.trim(), price: Number($('#pPrice').value), category: $('#pCat').value.trim() || null, description: $('#pDesc').value.trim() || null, image_path: path })
      if (error) { if (path) await sb.storage.from(BUCKET).remove([path]); throw error }
      e.target.reset(); msg.textContent = 'Product added.'; loadProducts()
    } catch (err) { msg.textContent = friendly(err.message || 'Could not add product.') }
    finally { btn.disabled = false }
  }

  sb.auth.onAuthStateChange(()=>setTimeout(render,0))
  render()
  if (import.meta.env.PROD && 'serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
