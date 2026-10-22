import { createClient } from '@supabase/supabase-js'
import './style.css'

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
      <div class="panel store"><div><p class="eyebrow">STORE</p><h2 id="storeTitle">Your store</h2><p id="storeHint" class="muted">Create your store workspace to begin.</p></div><form id="storeForm"><input id="storeName" minlength="2" maxlength="120" required placeholder="e.g. Avero Outfit BD"><button class="primary" type="submit">Create store</button></form></div>
      <div class="stats"><div class="panel stat"><span class="muted">Orders loaded</span><strong id="total">0</strong></div><div class="panel stat"><span class="muted">Pending</span><strong id="pending">0</strong></div><div class="panel stat"><span class="muted">Store status</span><strong id="status">Not set up</strong></div></div>
      <div class="panel orders"><div class="dashhead"><div><p class="eyebrow">RECENT ACTIVITY</p><h2>Latest orders</h2></div><button id="refresh" class="secondary">Refresh</button></div><div id="orderList" class="empty">Create a store to start setting up order management.</div></div>
      <p class="warning">MVP preview: customer order ingestion and WooCommerce integration are not enabled yet. Do not use real customer data until integration and security review are complete.</p>
    </section>
    <footer>© <span id="year"></span> Web Blaze · Private by design</footer>
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
  $('#refresh').onclick = loadDashboard
  async function render() {
    const {data:{session}} = await sb.auth.getSession()
    $('#auth').classList.toggle('hidden',!!session); $('#dash').classList.toggle('hidden',!session)
    if(session) { $('#signed').textContent=session.user.email || 'Signed in'; await loadDashboard() }
  }
  async function loadDashboard() {
    const {data:{user}} = await sb.auth.getUser(); if(!user)return
    const {data:members,error} = await sb.from('store_members').select('store_id,role').eq('user_id',user.id)
    if(error) { $('#storeHint').textContent=friendly(error.message); return }
    if(!members?.length) {
      $('#storeTitle').textContent='No store yet'; $('#storeHint').textContent='Create your first store workspace below.'
      $('#status').textContent='Not set up'; $('#total').textContent='0'; $('#pending').textContent='0'
      $('#orderList').textContent='Create a store to start managing orders.'; return
    }
    const id=members[0].store_id
    const {data:store,error:se}=await sb.from('stores').select('id,name').eq('id',id).single()
    if(se) { $('#storeHint').textContent=friendly(se.message); return }
    $('#storeTitle').textContent=store.name; $('#storeHint').textContent='Role: '+members[0].role; $('#status').textContent='Connected'
    const {data:orders,error:oe}=await sb.from('orders').select('id,customer_name,total,currency,status,created_at').eq('store_id',id).order('created_at',{ascending:false}).limit(10)
    if(oe) { $('#orderList').textContent=friendly(oe.message); return }
    $('#total').textContent=orders.length; $('#pending').textContent=orders.filter(o=>o.status==='pending').length
    if(!orders.length) { $('#orderList').textContent='No orders yet. Connect a secure integration to receive orders.'; return }
    const table=document.createElement('table'); table.innerHTML='<thead><tr><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>'
    const body=document.createElement('tbody')
    for(const o of orders){const tr=document.createElement('tr'); for(const v of [o.customer_name,`${o.currency} ${Number(o.total).toFixed(2)}`,o.status,new Date(o.created_at).toLocaleDateString()]){const td=document.createElement('td');td.textContent=v;tr.appendChild(td)} body.appendChild(tr)}
    table.appendChild(body); $('#orderList').replaceChildren(table)
  }
  sb.auth.onAuthStateChange(()=>setTimeout(render,0))
  render()
}