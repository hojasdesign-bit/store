import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, EVENTS as SEED_EVENTS, PLACES as SEED_PLACES, PRODUCTS as SEED_PRODUCTS, SELLERS as SEED_SELLERS, sellerById as seedSellerById } from './data.js'
import { createRow, deleteRow, hasSupabaseConfig, loadStoreData, updateRow } from './supabase.js'
import './App.css'

// Store — visualidad INSPIRADA en Play Store (layout y patrones), marca propia.
// Sin logo, wordmark ni assets de Google. Eventos con RSVP (Me interesa / Voy).
// Events, productos como Marketplace. CRUD + persistencia local/Supabase.

const MY_SELLER = { id: 's-yo', name: 'Mi tienda (yo)', category: 'Mi tienda', location: 'La Habana', rating: 5, reviews: 0, total: 0, completed: 0, cancelled: 0, volume: 0, score: 100, emoji: '🏪', verified: false }
const EVENT_MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const EMOJIS = ['🛍️', '☕', '🏺', '🌿', '🔌', '👗', '🕯️', '🎧', '📚', '🎨', '🍶', '👜', '🌵', '👔', '🧶', '🎉', '🏖️', '🍰']
const PLACE_TYPES = ['Mercado', 'Plaza', 'Paseo', 'Centro cultural', 'Parque', 'Centro comercial', 'Café', 'Tienda', 'Otro']

function fmtUSD(n) { return `$${Number(n).toFixed(0)} USD` }
function priceLabel(p) { return Number(p) === 0 ? 'Gratis' : fmtUSD(p) }
function todayISO() { const d = new Date(); const p = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` }
function interestedOf(ev) { return Math.round(Number(ev.attendees || 0) * 1.6) }
function eventMonthDay(ev) {
  const m = Number(String(ev.date || '').slice(5, 7)) - 1
  return { month: EVENT_MONTHS[m] || '', day: String(ev.date || '').slice(8, 10) }
}
function readJSON(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback } catch { return fallback } }

function applyOverrides(base, overrides) {
  const out = {}
  for (const kind of ['products', 'events', 'places']) {
    const deleted = new Set((overrides.deleted && overrides.deleted[kind]) || [])
    const updated = (overrides.updated && overrides.updated[kind]) || {}
    const created = (overrides.created && overrides.created[kind]) || []
    let list = (base[kind] || []).filter((i) => !deleted.includes(i.id)).map((i) => (updated[i.id] ? { ...i, ...updated[i.id] } : i))
    const existing = new Set(list.map((i) => i.id))
    for (const c of created) if (!deleted.includes(c.id) && !existing.has(c.id)) list.push(c)
    out[kind] = list
  }
  return out
}

function emptyOverrides() { return { created: { products: [], events: [], places: [] }, updated: { products: {}, events: {}, places: {} }, deleted: { products: [], events: [], places: [] } } }

export default function App() {
  const [view, setView] = useState('feed')
  const [sellers, setSellers] = useState(SEED_SELLERS)
  const [products, setProducts] = useState(SEED_PRODUCTS)
  const [places, setPlaces] = useState(SEED_PLACES)
  const [events, setEvents] = useState(SEED_EVENTS)
  const [isDemo, setIsDemo] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [sellerFilter, setSellerFilter] = useState('Todos')
  const [sellerTab, setSellerTab] = useState('Todos')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [condition, setCondition] = useState('Todas')
  const [savedOnly, setSavedOnly] = useState(false)
  const [eventFilter, setEventFilter] = useState('Todos')
  const [eventQuery, setEventQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [cart, setCart] = useState(() => readJSON('store-cart', []))
  const [rsvp, setRsvp] = useState(() => readJSON('store-event-rsvp', {}))
  const [saved, setSaved] = useState(() => readJSON('store-saved', {}))
  const [mineIds, setMineIds] = useState(() => readJSON('store-mine', []))
  const [form, setForm] = useState(null) // {kind:'product'|'event'|'place', mode:'create'|'edit', itemId, fields, errors}
  const [confirmDelete, setConfirmDelete] = useState(null) // {kind, id, name}
  const [toast, setToast] = useState('')

  useEffect(() => {
    loadStoreData().then((d) => {
      const base = {
        products: d.products || SEED_PRODUCTS,
        events: d.events || SEED_EVENTS,
        places: d.places || SEED_PLACES,
      }
      const merged = applyOverrides(base, readJSON('store-overrides', emptyOverrides()))
      setProducts(merged.products)
      setEvents(merged.events)
      setPlaces(merged.places)
      if (d.sellers) setSellers(d.sellers)
      setIsDemo(!(d.sellers && d.products && d.places && d.events))
    })
  }, [])

  useEffect(() => { localStorage.setItem('store-cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('store-event-rsvp', JSON.stringify(rsvp)) }, [rsvp])
  useEffect(() => { localStorage.setItem('store-saved', JSON.stringify(saved)) }, [saved])
  useEffect(() => { localStorage.setItem('store-mine', JSON.stringify(mineIds)) }, [mineIds])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800) }
  const sellerById = (id) => {
    if (id === MY_SELLER.id) return MY_SELLER
    return sellers.find((s) => s.id === id) || seedSellerById(id)
  }
  const isMine = (id) => mineIds.includes(id)

  const toggleRsvp = (eventId, kind) => {
    setRsvp((prev) => {
      const next = { ...prev }
      if (next[eventId] === kind) delete next[eventId]
      else next[eventId] = kind
      return next
    })
  }
  const toggleSaved = (id) => setSaved((prev) => ({ ...prev, [id]: !prev[id] }))

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === product.id)
      if (found) return prev.map((i) => i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, Math.max(1, product.stock)) } : i)
      return [...prev, { id: product.id, qty }]
    })
    showToast(`Añadido a Biblioteca: ${product.name}`)
  }
  const changeQty = (id, delta) => setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id))
  const cartDetailed = cart.map((i) => ({ ...i, product: products.find((p) => p.id === i.id) })).filter((i) => i.product)
  const cartTotal = cartDetailed.reduce((s, i) => s + i.product.price * i.qty, 0)
  const cartCount = cartDetailed.reduce((s, i) => s + i.qty, 0)

  const orderWhatsApp = () => {
    if (cartDetailed.length === 0) return
    const lines = cartDetailed.map((i) => `• ${i.product.name} × ${i.qty} — ${fmtUSD(i.product.price * i.qty)}`).join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(`Hola Store, quiero pedir:\n${lines}\nTotal: ${fmtUSD(cartTotal)}\n(Demo — sin pago real)`)}`, '_blank')
  }

  // --- Overrides (persistencia local) ---
  function recordOverride(kind, action, item) {
    const ov = readJSON('store-overrides', emptyOverrides())
    const key = kind === 'product' ? 'products' : kind === 'event' ? 'events' : 'places'
    if (action === 'create') ov.created[key].push(item)
    if (action === 'update') ov.updated[key][item.id] = item
    if (action === 'delete') {
      ov.deleted[key].push(item.id)
      ov.created[key] = ov.created[key].filter((c) => c.id !== item.id)
      delete ov.updated[key][item.id]
    }
    localStorage.setItem('store-overrides', JSON.stringify(ov))
  }

  async function syncRemote(kind, action, item) {
    if (!hasSupabaseConfig) { showToast('Guardado en este dispositivo (demo).'); return }
    try {
      if (action === 'create') await createRow(kind, item)
      if (action === 'update') await updateRow(kind, item.id, item)
      if (action === 'delete') await deleteRow(kind, item.id)
      showToast('Guardado en Supabase y en este dispositivo.')
    } catch {
      showToast('Guardado en este dispositivo (demo) — Supabase no permitió la escritura (RLS).')
    }
  }

  // --- Formularios CRUD ---
  function openCreate(kind, preset = {}) {
    const base =
      kind === 'product' ? { name: '', price: '', category: 'Café', condition: 'Nuevo', description: '', stock: '', seller_id: 's-yo', emoji: '🛍️' }
      : kind === 'event' ? { title: '', description: '', date: todayISO(), time: '18:00', placeMode: 'existing', placeSelect: places[0]?.name || '', placeOther: '', price: '', capacity: '', emoji: '🎉' }
      : { name: '', type: 'Otro', address: '', city: 'La Habana', hours: '', description: '', emoji: '📍' }
    setForm({ kind, mode: 'create', itemId: null, fields: { ...base, ...preset }, errors: {} })
  }

  function openEdit(kind, item) {
    const fields =
      kind === 'product' ? { name: item.name, price: String(item.price), category: item.category, condition: item.condition || 'Nuevo', description: item.description || '', stock: String(item.stock), seller_id: item.seller_id, emoji: item.emoji || '🛍️' }
      : kind === 'event' ? { title: item.title, description: item.description || '', date: item.date, time: item.time, placeMode: 'existing', placeSelect: places[0]?.name || item.place, placeOther: item.place, price: String(item.price), capacity: String(item.capacity), emoji: item.emoji || '🎉' }
      : { name: item.name, type: item.type, address: item.address || '', city: item.city || 'La Habana', hours: item.hours || '', description: item.description || '', emoji: item.emoji || '📍' }
    setForm({ kind, mode: 'edit', itemId: item.id, fields, errors: {} })
  }

  function submitForm() {
    const { kind, mode, itemId, fields } = form
    const errors = {}
    if (kind === 'product') {
      if (!fields.name.trim()) errors.name = 'El nombre es obligatorio.'
      if (fields.price === '' || Number(fields.price) < 0) errors.price = 'El precio debe ser 0 o mayor.'
      if (!fields.category) errors.category = 'Elige una categoría.'
      if (fields.stock === '' || Number(fields.stock) < 0) errors.stock = 'El stock debe ser 0 o mayor.'
      if (Object.keys(errors).length) { setForm({ ...form, errors }); return }
      const item = {
        id: mode === 'create' ? `local-product-${Date.now()}` : itemId,
        name: fields.name.trim(), price: Number(fields.price), category: fields.category,
        condition: fields.condition, description: fields.description.trim(),
        stock: Number(fields.stock), seller_id: fields.seller_id, emoji: fields.emoji || '🛍️',
        rating: 5, reviews: 0, featured: false,
      }
      if (mode === 'create') {
        setProducts((p) => [item, ...p]); recordOverride('product', 'create', item)
        setMineIds((m) => [...m, item.id])
        if (item.seller_id !== MY_SELLER.id) syncRemote('product', 'create', item); else showToast('Guardado en este dispositivo (demo).')
      } else {
        setProducts((p) => p.map((x) => x.id === item.id ? item : x)); recordOverride('product', 'update', item)
        if (item.seller_id !== MY_SELLER.id) syncRemote('product', 'update', item); else showToast('Guardado en este dispositivo (demo).')
      }
      setSelectedProduct(item)
    }
    if (kind === 'event') {
      const place = fields.placeMode === 'existing' ? fields.placeSelect : fields.placeOther.trim()
      if (!fields.title.trim()) errors.title = 'El título es obligatorio.'
      if (!fields.date) errors.date = 'La fecha es obligatoria.'
      if (!place) errors.place = 'El lugar es obligatorio.'
      if (fields.price === '' || Number(fields.price) < 0) errors.price = 'El precio debe ser 0 o mayor.'
      if (fields.capacity === '' || Number(fields.capacity) <= 0) errors.capacity = 'La capacidad debe ser mayor que 0.'
      if (Object.keys(errors).length) { setForm({ ...form, errors }); return }
      const item = {
        id: mode === 'create' ? `local-event-${Date.now()}` : itemId,
        title: fields.title.trim(), description: fields.description.trim(), date: fields.date, time: fields.time,
        place, price: Number(fields.price), capacity: Number(fields.capacity),
        attendees: mode === 'create' ? 0 : (events.find((e) => e.id === itemId)?.attendees ?? 0),
        emoji: fields.emoji || '🎉',
      }
      if (mode === 'create') {
        setEvents((e) => [item, ...e]); recordOverride('event', 'create', item)
        setMineIds((m) => [...m, item.id]); syncRemote('event', 'create', item)
      } else {
        setEvents((e) => e.map((x) => x.id === item.id ? item : x)); recordOverride('event', 'update', item)
        syncRemote('event', 'update', item)
      }
      setSelectedEvent(item)
    }
    if (kind === 'place') {
      if (!fields.name.trim()) errors.name = 'El nombre es obligatorio.'
      if (!fields.type) errors.type = 'Elige un tipo.'
      if (Object.keys(errors).length) { setForm({ ...form, errors }); return }
      const item = {
        id: mode === 'create' ? `local-place-${Date.now()}` : itemId,
        name: fields.name.trim(), type: fields.type, address: fields.address.trim(),
        city: fields.city.trim() || 'La Habana', hours: fields.hours.trim(),
        description: fields.description.trim(), emoji: fields.emoji || '📍',
        rating: mode === 'create' ? 5 : (places.find((p) => p.id === itemId)?.rating ?? 5),
        reviews: mode === 'create' ? 0 : (places.find((p) => p.id === itemId)?.reviews ?? 0),
      }
      if (mode === 'create') {
        setPlaces((p) => [item, ...p]); recordOverride('place', 'create', item)
        setMineIds((m) => [...m, item.id]); syncRemote('place', 'create', item)
      } else {
        setPlaces((p) => p.map((x) => x.id === item.id ? item : x)); recordOverride('place', 'update', item)
        syncRemote('place', 'update', item)
      }
      setSelectedPlace(item)
    }
    setForm(null)
  }

  function doDelete() {
    const { kind, id } = confirmDelete
    if (kind === 'product') {
      setProducts((p) => p.filter((x) => x.id !== id)); recordOverride('product', 'delete', { id })
      setCart((c) => c.filter((x) => x.id !== id)); setSelectedProduct(null); syncRemote('product', 'delete', { id })
    }
    if (kind === 'event') {
      setEvents((e) => e.filter((x) => x.id !== id)); recordOverride('event', 'delete', { id })
      setSelectedEvent(null); syncRemote('event', 'delete', { id })
    }
    if (kind === 'place') {
      // Al eliminar un lugar, sus eventos quedan con el lugar en texto (no se borran).
      setPlaces((p) => p.filter((x) => x.id !== id)); recordOverride('place', 'delete', { id })
      setSelectedPlace(null); syncRemote('place', 'delete', { id })
    }
    setMineIds((m) => m.filter((x) => x !== id))
    setConfirmDelete(null)
    showToast('Publicación eliminada.')
  }

  // --- Derivados ---
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (category !== 'Todas' && p.category !== category) return false
      if (sellerFilter !== 'Todos' && p.seller_id !== sellerFilter) return false
      if (condition !== 'Todas' && (p.condition || 'Nuevo') !== condition) return false
      if (priceMin !== '' && p.price < Number(priceMin)) return false
      if (priceMax !== '' && p.price > Number(priceMax)) return false
      if (savedOnly && !saved[p.id]) return false
      if (q && !(p.name.toLowerCase().includes(q) || (sellerById(p.seller_id)?.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))) return false
      return true
    })
  }, [products, sellers, query, category, sellerFilter, condition, priceMin, priceMax, savedOnly, saved])

  const sortedEvents = useMemo(() => {
    const today = todayISO()
    const q = eventQuery.trim().toLowerCase()
    return [...events].sort((a, b) => String(a.date).localeCompare(String(b.date))).filter((ev) => {
      if (eventFilter === 'Próximos' && ev.date < today) return false
      if (eventFilter === 'Pasados' && ev.date >= today) return false
      if (eventFilter === 'Mis eventos' && !rsvp[ev.id]) return false
      if (eventFilter === 'Que organizo' && !isMine(ev.id)) return false
      if (q && !(ev.title.toLowerCase().includes(q) || ev.place.toLowerCase().includes(q))) return false
      return true
    })
  }, [events, eventFilter, eventQuery, rsvp, mineIds])

  const upcomingEvents = [...events].sort((a, b) => String(a.date).localeCompare(String(b.date))).filter((e) => e.date >= todayISO()).slice(0, 3)
  const featuredProducts = products.filter((p) => p.featured).slice(0, 6)
  const topPlaces = [...places].sort((a, b) => b.rating - a.rating).slice(0, 3)
  const mineProducts = products.filter((p) => isMine(p.id))
  const mineEvents = events.filter((e) => isMine(e.id))
  const minePlaces = places.filter((p) => isMine(p.id))

  const NAV = [
    { id: 'feed', label: 'Inicio', icon: '🏠' },
    { id: 'marketplace', label: 'Marketplace', icon: '🛍️' },
    { id: 'events', label: 'Eventos', icon: '📅' },
    { id: 'places', label: 'Lugares', icon: '📍' },
    { id: 'sellers', label: 'Vendedores', icon: '🏪' },
    { id: 'mine', label: 'Mis publicaciones', icon: '📝' },
    { id: 'library', label: 'Biblioteca', icon: '📚' },
  ]
  const go = (id) => { setView(id); setSelectedSeller(null) }

  return (
    <div className="fb-app">
      <header className="fb-topbar">
        <button className="fb-brand" onClick={() => go('feed')}><span className="fb-brand-mark">🛍️</span><strong>Store</strong></button>
        <div className="fb-search" role="search">
          <span>🔍</span>
          <input value={query} onChange={(e) => { setQuery(e.target.value); if (view !== 'marketplace') setView('marketplace') }} placeholder="Buscar en Store" aria-label="Buscar en Store" />
        </div>
        <div className="fb-top-actions">
          {isDemo && <span className="fb-badge">Datos demo</span>}
          <button className="fb-icon-btn" onClick={() => go('library')} title="Biblioteca">📚{cartCount > 0 && <b className="fb-count">{cartCount}</b>}</button>
          <span className="fb-avatar" title="Tu cuenta">A</span>
        </div>
      </header>

      <nav className="fb-tabs" aria-label="Secciones">
        {NAV.map((n) => (
          <button key={n.id} className={view === n.id ? 'fb-tab active' : 'fb-tab'} onClick={() => go(n.id)}><span>{n.icon}</span> {n.label}</button>
        ))}
        <span className="fb-tabs-spacer" />
        <button className="fb-btn-primary fb-tab-cta" onClick={() => openCreate('product')}>+ Vender algo</button>
        <button className="fb-btn fb-tab-cta" onClick={() => openCreate('event')}>+ Crear evento</button>
        <button className="fb-btn fb-tab-cta" onClick={() => openCreate('place')}>+ Crear lugar</button>
      </nav>

      {isDemo && <div className="fb-demo">Datos demo — configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para datos reales. Demo — sin pago real.</div>}

      <div className="fb-layout">
        <main className="fb-main">
          {view === 'feed' && (
            <div className="fb-feed">
              <section className="fb-card composer">
                <div className="composer-row"><span className="fb-avatar">A</span><button className="composer-input" onClick={() => openCreate('product')}>¿Qué quieres vender / qué evento organizas?</button></div>
                <div className="composer-actions">
                  <button onClick={() => openCreate('product')}>🛍️ Vender algo</button>
                  <button onClick={() => openCreate('event')}>📅 Crear evento</button>
                  <button onClick={() => openCreate('place')}>📍 Crear lugar</button>
                </div>
              </section>

              <section className="fb-card">
                <div className="section-head"><h2>Marketplace destacado</h2><button className="fb-link" onClick={() => go('marketplace')}>Ver todo →</button></div>
                <div className="fb-grid">{featuredProducts.map((p) => <ProductCard key={p.id} p={p} seller={sellerById(p.seller_id)} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} onSave={() => toggleSaved(p.id)} saved={!!saved[p.id]} />)}</div>
              </section>

              <section className="fb-card">
                <div className="section-head"><h2>Próximos eventos</h2><button className="fb-link" onClick={() => go('events')}>Ver todo →</button></div>
                <div className="fb-event-list">{upcomingEvents.map((ev) => <EventCard key={ev.id} ev={ev} rsvp={rsvp[ev.id]} onRsvp={toggleRsvp} onOpen={() => setSelectedEvent(ev)} />)}</div>
              </section>

              <section className="fb-card">
                <div className="section-head"><h2>Lugares destacados</h2><button className="fb-link" onClick={() => go('places')}>Ver todo →</button></div>
                <div className="fb-grid">{topPlaces.map((pl) => <PlaceCard key={pl.id} pl={pl} onOpen={() => setSelectedPlace(pl)} />)}</div>
              </section>
            </div>
          )}

          {view === 'marketplace' && (
            <div className="fb-feed">
              <section className="fb-card">
                <h1 className="fb-title">Marketplace</h1>
                <p className="fb-muted">Compra y vende en La Habana. Demo: puedes gestionar cualquier publicación.</p>
                <div className="fb-chips">
                  <button className={category === 'Todas' ? 'fb-chip active' : 'fb-chip'} onClick={() => setCategory('Todas')}>Todas</button>
                  {CATEGORIES.map((c) => <button key={c} className={category === c ? 'fb-chip active' : 'fb-chip'} onClick={() => setCategory(c)}>{c}</button>)}
                </div>
                <div className="fb-filters">
                  <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} aria-label="Vendedor"><option value="Todos">Todos los vendedores</option>{[...sellers, MY_SELLER].map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} aria-label="Condición"><option value="Todas">Todas las condiciones</option><option value="Nuevo">Nuevo</option><option value="Usado">Usado</option></select>
                  <input type="number" min="0" placeholder="Precio mín" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} aria-label="Precio mínimo" />
                  <input type="number" min="0" placeholder="Precio máx" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} aria-label="Precio máximo" />
                  <label className="fb-check"><input type="checkbox" checked={savedOnly} onChange={(e) => setSavedOnly(e.target.checked)} /> Solo guardados</label>
                  <button className="fb-btn" onClick={() => { setCategory('Todas'); setSellerFilter('Todos'); setCondition('Todas'); setPriceMin(''); setPriceMax(''); setSavedOnly(false); setQuery('') }}>Limpiar</button>
                </div>
                <p className="fb-muted">{filteredProducts.length} anuncios</p>
                <div className="fb-grid">{filteredProducts.map((p) => <ProductCard key={p.id} p={p} seller={sellerById(p.seller_id)} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} onSave={() => toggleSaved(p.id)} saved={!!saved[p.id]} onEdit={() => openEdit('product', p)} onDelete={() => setConfirmDelete({ kind: 'product', id: p.id, name: p.name })} showManage />)}</div>
                {filteredProducts.length === 0 && <p className="fb-empty">Sin anuncios. Prueba otros filtros o publica el primero con «Vender algo».</p>}
              </section>
            </div>
          )}

          {view === 'events' && (
            <div className="fb-feed">
              <section className="fb-card">
                <h1 className="fb-title">Eventos</h1>
                <p className="fb-muted">Marca «Me interesa» o «Voy». Demo: puedes gestionar cualquier publicación.</p>
                <input className="fb-input" placeholder="Buscar eventos…" value={eventQuery} onChange={(e) => setEventQuery(e.target.value)} aria-label="Buscar eventos" />
                <div className="fb-chips">
                  {['Todos', 'Próximos', 'Pasados', 'Mis eventos', 'Que organizo'].map((f) => (
                    <button key={f} className={eventFilter === f ? 'fb-chip active' : 'fb-chip'} onClick={() => setEventFilter(f)}>{f}</button>
                  ))}
                </div>
                <p className="fb-muted">{sortedEvents.length} eventos</p>
                <div className="fb-event-list">{sortedEvents.map((ev) => <EventCard key={ev.id} ev={ev} rsvp={rsvp[ev.id]} onRsvp={toggleRsvp} onOpen={() => setSelectedEvent(ev)} onEdit={() => openEdit('event', ev)} onDelete={() => setConfirmDelete({ kind: 'event', id: ev.id, name: ev.title })} showManage />)}</div>
                {sortedEvents.length === 0 && <p className="fb-empty">Sin eventos en este filtro.</p>}
              </section>
            </div>
          )}

          {view === 'places' && (
            <div className="fb-feed">
              <section className="fb-card">
                <h1 className="fb-title">Lugares</h1>
                <p className="fb-muted">Demo: puedes gestionar cualquier publicación.</p>
                <div className="fb-grid">{places.map((pl) => <PlaceCard key={pl.id} pl={pl} onOpen={() => setSelectedPlace(pl)} onEdit={() => openEdit('place', pl)} onDelete={() => setConfirmDelete({ kind: 'place', id: pl.id, name: pl.name })} showManage />)}</div>
              </section>
            </div>
          )}

          {view === 'sellers' && (
            <div className="fb-feed">
              <section className="fb-card">
                <h1 className="fb-title">Vendedores</h1>
                <p className="fb-muted">Catálogo de vendedores como en una tienda de apps: cada vendedor es un desarrollador con sus anuncios.</p>
                {selectedSeller ? (
                  <div>
                    <button className="fb-link" onClick={() => setSelectedSeller(null)}>← Todos los vendedores</button>
                    <div className="play-dev-head">
                      <span className="play-dev-icon">{selectedSeller.emoji}</span>
                      <div>
                        <h2>{selectedSeller.name} {selectedSeller.verified && <span className="fb-verified">✓</span>}</h2>
                        <p className="fb-muted">{selectedSeller.category} · {selectedSeller.location}</p>
                        <p>★ {selectedSeller.rating.toFixed(1)} · {selectedSeller.reviews} reseñas · Score {selectedSeller.score}</p>
                        <button className="fb-btn-primary" onClick={() => { setSellerFilter(selectedSeller.id); go('marketplace') }}>Ver anuncios</button>
                      </div>
                    </div>
                    <div className="fb-stats">
                      <div><strong>{selectedSeller.completed}</strong><span>Ventas completadas</span></div>
                      <div><strong>{selectedSeller.cancelled}</strong><span>Canceladas</span></div>
                      <div><strong>{fmtUSD(selectedSeller.volume)}</strong><span>Volumen</span></div>
                      <div><strong>{selectedSeller.total}</strong><span>Operaciones</span></div>
                    </div>
                    <p className="fb-muted">Reseñas ({selectedSeller.reviews}) ≤ ventas completadas ({selectedSeller.completed}). Total = completadas + canceladas.</p>
                    <h3>Anuncios de {selectedSeller.name}</h3>
                    <div className="fb-grid">{products.filter((p) => p.seller_id === selectedSeller.id).map((p) => <ProductCard key={p.id} p={p} seller={selectedSeller} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} onSave={() => toggleSaved(p.id)} saved={!!saved[p.id]} />)}</div>
                  </div>
                ) : (
                  <div>
                    <div className="fb-chips">
                      {['Todos', 'Verificados', 'Top ventas'].map((t) => (
                        <button key={t} className={sellerTab === t ? 'fb-chip active' : 'fb-chip'} onClick={() => setSellerTab(t)}>{t}</button>
                      ))}
                    </div>
                    <h3>Top vendedores</h3>
                    <div className="play-chart">{[...sellers].sort((a, b) => b.completed - a.completed).slice(0, 3).map((s, i) => {
                      const apps = products.filter((p) => p.seller_id === s.id)
                      return (
                        <article className="play-chart-row" key={s.id}>
                          <span className="play-rank">{i + 1}</span>
                          <button className="play-seller-icon" onClick={() => setSelectedSeller(s)} aria-label={`Ver ${s.name}`}>{s.emoji}</button>
                          <button className="play-seller-main" onClick={() => setSelectedSeller(s)}><strong>{s.name} {s.verified && <span className="fb-verified">✓</span>}</strong><small>{s.category}</small><small>★ {s.rating.toFixed(1)} · {s.reviews} reseñas</small><small>{s.completed} ventas · {apps.length} anuncios</small></button>
                          <button className="fb-btn" onClick={() => { setSellerFilter(s.id); go('marketplace') }}>Ver apps</button>
                        </article>
                      )
                    })}</div>
                    <h3>Todos los vendedores</h3>
                    <div className="fb-grid">{sellers.filter((s) => {
                      if (sellerTab === 'Verificados') return s.verified
                      if (sellerTab === 'Top ventas') return [...sellers].sort((a, b) => b.completed - a.completed).slice(0, 3).some((t) => t.id === s.id)
                      return true
                    }).map((s) => {
                      const apps = products.filter((p) => p.seller_id === s.id)
                      const minPrice = apps.length ? Math.min(...apps.map((p) => p.price)) : 0
                      return (
                        <article className="play-seller-card" key={s.id}>
                          <button className="play-seller-icon" onClick={() => setSelectedSeller(s)} aria-label={`Ver ${s.name}`}>{s.emoji}</button>
                          <button className="play-seller-main" onClick={() => setSelectedSeller(s)}><strong>{s.name} {s.verified && <span className="fb-verified">✓</span>}</strong><small>{s.category} · {s.location}</small><small>★ {s.rating.toFixed(1)} · {s.reviews} reseñas</small><small>{apps.length} anuncios · Desde {priceLabel(minPrice)}</small></button>
                          <button className="fb-btn" onClick={() => { setSellerFilter(s.id); go('marketplace') }}>Ver apps</button>
                        </article>
                      )
                    })}</div>
                  </div>
                )}
              </section>
            </div>
          )}

          {view === 'mine' && (
            <div className="fb-feed">
              <section className="fb-card">
                <h1 className="fb-title">Mis publicaciones</h1>
                <p className="fb-muted">Publicaciones creadas en este navegador. Demo: también puedes editar/eliminar cualquier publicación desde Marketplace, Eventos y Lugares.</p>
                <h3>Anuncios ({mineProducts.length})</h3>
                <div className="fb-grid">{mineProducts.map((p) => <ProductCard key={p.id} p={p} seller={sellerById(p.seller_id)} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} onSave={() => toggleSaved(p.id)} saved={!!saved[p.id]} onEdit={() => openEdit('product', p)} onDelete={() => setConfirmDelete({ kind: 'product', id: p.id, name: p.name })} showManage />)}</div>
                {mineProducts.length === 0 && <p className="fb-empty">Aún no has publicado anuncios.</p>}
                <h3>Eventos ({mineEvents.length})</h3>
                <div className="fb-event-list">{mineEvents.map((ev) => <EventCard key={ev.id} ev={ev} rsvp={rsvp[ev.id]} onRsvp={toggleRsvp} onOpen={() => setSelectedEvent(ev)} onEdit={() => openEdit('event', ev)} onDelete={() => setConfirmDelete({ kind: 'event', id: ev.id, name: ev.title })} showManage />)}</div>
                {mineEvents.length === 0 && <p className="fb-empty">Aún no has creado eventos.</p>}
                <h3>Lugares ({minePlaces.length})</h3>
                <div className="fb-grid">{minePlaces.map((pl) => <PlaceCard key={pl.id} pl={pl} onOpen={() => setSelectedPlace(pl)} onEdit={() => openEdit('place', pl)} onDelete={() => setConfirmDelete({ kind: 'place', id: pl.id, name: pl.name })} showManage />)}</div>
                {minePlaces.length === 0 && <p className="fb-empty">Aún no has creado lugares.</p>}
              </section>
            </div>
          )}

          {view === 'library' && (
            <div className="fb-feed">
              <section className="fb-card">
                <h1 className="fb-title">Biblioteca</h1>
                <p className="fb-muted">Tus productos obtenidos (carrito), guardados en este dispositivo.</p>
                <p className="fb-note">Demo — sin pago real. El pedido se envía por WhatsApp.</p>
                {cartDetailed.length === 0 ? <p className="fb-empty">Tu Biblioteca está vacía. Explora Marketplace y pulsa Obtener. 📚</p> : (
                  <div>
                    <div className="fb-list">{cartDetailed.map((i) => (
                      <div className="fb-row" key={i.id}>
                        <span className="fb-thumb">{i.product.emoji}</span>
                        <div className="fb-row-main"><strong>{i.product.name}</strong><small>{sellerById(i.product.seller_id)?.name} · {fmtUSD(i.product.price)}</small>
                          <div className="fb-qty"><button onClick={() => changeQty(i.id, -1)}>−</button><span>{i.qty}</span><button onClick={() => changeQty(i.id, 1)}>+</button></div>
                        </div>
                        <div className="fb-row-right"><strong>{fmtUSD(i.product.price * i.qty)}</strong><button className="fb-link danger" onClick={() => removeItem(i.id)}>Quitar</button></div>
                      </div>
                    ))}</div>
                    <div className="fb-total"><span>Total</span><strong>{fmtUSD(cartTotal)}</strong></div>
                    <button className="fb-btn-primary fb-block" onClick={orderWhatsApp}>Obtener y pedir por WhatsApp 💬</button>
                    <button className="fb-btn fb-block" onClick={() => setCart([])}>Vaciar Biblioteca</button>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      <nav className="fb-bottomnav">
        {NAV.slice(0, 5).map((n) => (
          <button key={n.id} className={view === n.id ? 'active' : ''} onClick={() => go(n.id)}><span>{n.icon}</span><small>{n.label}</small></button>
        ))}
        <button className={view === 'library' ? 'active' : ''} onClick={() => go('library')}><span>📚</span><small>Biblioteca{cartCount > 0 ? ` (${cartCount})` : ''}</small></button>
      </nav>

      {selectedProduct && (
        <div className="fb-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="fb-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={selectedProduct.name}>
            <button className="fb-close" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="fb-cover"><span>{selectedProduct.emoji}</span></div>
            <div className="fb-modal-body">
              <h2>{selectedProduct.name}</h2>
              <p><strong>{priceLabel(selectedProduct.price)}</strong> · {selectedProduct.condition || 'Nuevo'} · Stock: {selectedProduct.stock}</p>
              <p>★ {selectedProduct.rating.toFixed(1)} · {selectedProduct.reviews} reseñas · {sellerById(selectedProduct.seller_id)?.name}</p>
              <p>{selectedProduct.description}</p>
              <div className="fb-modal-actions">
                <button className="fb-btn-primary" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null) }}>Obtener · {priceLabel(selectedProduct.price)}</button>
                <button className="fb-btn" onClick={() => toggleSaved(selectedProduct.id)}>{saved[selectedProduct.id] ? '★ Guardado' : '☆ Guardar'}</button>
                <button className="fb-btn" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hola, me interesa tu anuncio en Store: ${selectedProduct.name} (${priceLabel(selectedProduct.price)})`)}`, '_blank')}>💬 Mensaje al vendedor</button>
              </div>
              <div className="fb-modal-actions">
                <button className="fb-btn" onClick={() => { setSelectedProduct(null); openEdit('product', selectedProduct) }}>Editar</button>
                <button className="fb-btn danger" onClick={() => { const p = selectedProduct; setSelectedProduct(null); setConfirmDelete({ kind: 'product', id: p.id, name: p.name }) }}>Eliminar</button>
              </div>
              {isMine(selectedProduct.id) && <p className="fb-muted">Publicación tuya.</p>}
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fb-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="fb-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={selectedEvent.title}>
            <button className="fb-close" onClick={() => setSelectedEvent(null)}>✕</button>
            <div className="fb-cover"><span>{selectedEvent.emoji}</span></div>
            <div className="fb-modal-body">
              <div className="fb-event-head"><DateBadge ev={selectedEvent} /><div><h2>{selectedEvent.title}</h2><p className="fb-muted">Organiza · {selectedEvent.place}</p><p className="fb-muted">🕒 {selectedEvent.date} · {selectedEvent.time} · 📍 {selectedEvent.place}</p></div></div>
              <p><strong>{priceLabel(selectedEvent.price)}</strong> · {selectedEvent.attendees + (rsvp[selectedEvent.id] === 'going' ? 1 : 0)} van · {interestedOf(selectedEvent) + (rsvp[selectedEvent.id] === 'interested' ? 1 : 0)} interesados · Capacidad {selectedEvent.capacity}</p>
              <p>{selectedEvent.description}</p>
              <div className="fb-modal-actions">
                <button className={rsvp[selectedEvent.id] === 'interested' ? 'fb-btn active' : 'fb-btn'} onClick={() => toggleRsvp(selectedEvent.id, 'interested')}>⭐ Me interesa</button>
                <button className={rsvp[selectedEvent.id] === 'going' ? 'fb-btn-primary' : 'fb-btn'} onClick={() => toggleRsvp(selectedEvent.id, 'going')}>✓ Voy</button>
                <button className="fb-btn" onClick={() => { const link = `${window.location.origin}/#evento-${selectedEvent.id}`; if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => showToast('Enlace copiado.')).catch(() => showToast(link)); else showToast(link) }}>🔗 Compartir</button>
              </div>
              <div className="fb-modal-actions">
                <button className="fb-btn" onClick={() => { setSelectedEvent(null); openEdit('event', selectedEvent) }}>Editar</button>
                <button className="fb-btn danger" onClick={() => { const ev = selectedEvent; setSelectedEvent(null); setConfirmDelete({ kind: 'event', id: ev.id, name: ev.title }) }}>Eliminar</button>
              </div>
              {isMine(selectedEvent.id) && <p className="fb-muted">Evento organizado por ti.</p>}
            </div>
          </div>
        </div>
      )}

      {selectedPlace && (
        <div className="fb-backdrop" onClick={() => setSelectedPlace(null)}>
          <div className="fb-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={selectedPlace.name}>
            <button className="fb-close" onClick={() => setSelectedPlace(null)}>✕</button>
            <div className="fb-cover"><span>{selectedPlace.emoji}</span></div>
            <div className="fb-modal-body">
              <h2>{selectedPlace.name}</h2>
              <p className="fb-muted">{selectedPlace.type} · {selectedPlace.address} · {selectedPlace.city}</p>
              <p className="fb-muted">🕒 {selectedPlace.hours} · ★ {selectedPlace.rating.toFixed(1)} · {selectedPlace.reviews} reseñas</p>
              <p>{selectedPlace.description}</p>
              <h3>Eventos aquí ({events.filter((e) => e.place === selectedPlace.name).length})</h3>
              <div className="fb-event-list">{events.filter((e) => e.place === selectedPlace.name).map((ev) => <EventCard key={ev.id} ev={ev} rsvp={rsvp[ev.id]} onRsvp={toggleRsvp} onOpen={() => { setSelectedPlace(null); setSelectedEvent(ev) }} />)}</div>
              <div className="fb-modal-actions">
                <button className="fb-btn-primary" onClick={() => { const name = selectedPlace.name; setSelectedPlace(null); openCreate('event', { placeMode: 'existing', placeSelect: name }) }}>+ Crear evento aquí</button>
                <button className="fb-btn" onClick={() => { setSelectedPlace(null); openEdit('place', selectedPlace) }}>Editar</button>
                <button className="fb-btn danger" onClick={() => { const pl = selectedPlace; setSelectedPlace(null); setConfirmDelete({ kind: 'place', id: pl.id, name: pl.name }) }}>Eliminar</button>
              </div>
              <p className="fb-muted">Al eliminar el lugar, sus eventos quedan con el lugar en texto.</p>
            </div>
          </div>
        </div>
      )}

      {form && (
        <div className="fb-backdrop" onClick={() => setForm(null)}>
          <div className="fb-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={form.mode === 'create' ? 'Crear' : 'Editar'}>
            <button className="fb-close" onClick={() => setForm(null)}>✕</button>
            <div className="fb-modal-body">
              <h2>{form.mode === 'create' ? 'Crear' : 'Editar'} {form.kind === 'product' ? 'anuncio' : form.kind === 'event' ? 'evento' : 'lugar'}</h2>
              {form.kind === 'product' && (
                <div className="fb-form">
                  <label>Nombre *<input value={form.fields.name} onChange={(e) => setForm({ ...form, fields: { ...form.fields, name: e.target.value } })} /></label>
                  {form.errors.name && <small className="fb-error">{form.errors.name}</small>}
                  <label>Precio (USD) *<input type="number" min="0" value={form.fields.price} onChange={(e) => setForm({ ...form, fields: { ...form.fields, price: e.target.value } })} /></label>
                  {form.errors.price && <small className="fb-error">{form.errors.price}</small>}
                  <label>Categoría *<select value={form.fields.category} onChange={(e) => setForm({ ...form, fields: { ...form.fields, category: e.target.value } })}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
                  {form.errors.category && <small className="fb-error">{form.errors.category}</small>}
                  <label>Condición<select value={form.fields.condition} onChange={(e) => setForm({ ...form, fields: { ...form.fields, condition: e.target.value } })}><option value="Nuevo">Nuevo</option><option value="Usado">Usado</option></select></label>
                  <label>Stock *<input type="number" min="0" value={form.fields.stock} onChange={(e) => setForm({ ...form, fields: { ...form.fields, stock: e.target.value } })} /></label>
                  {form.errors.stock && <small className="fb-error">{form.errors.stock}</small>}
                  <label>Vendedor<select value={form.fields.seller_id} onChange={(e) => setForm({ ...form, fields: { ...form.fields, seller_id: e.target.value } })}><option value={MY_SELLER.id}>Mi tienda (yo)</option>{sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
                  <label>Emoji<input value={form.fields.emoji} onChange={(e) => setForm({ ...form, fields: { ...form.fields, emoji: e.target.value } })} /></label>
                  <div className="fb-emoji-pick">{EMOJIS.map((em) => <button type="button" key={em} className={form.fields.emoji === em ? 'picked' : ''} onClick={() => setForm({ ...form, fields: { ...form.fields, emoji: em } })}>{em}</button>)}</div>
                  <label>Descripción<textarea value={form.fields.description} onChange={(e) => setForm({ ...form, fields: { ...form.fields, description: e.target.value } })} /></label>
                </div>
              )}
              {form.kind === 'event' && (
                <div className="fb-form">
                  <label>Título *<input value={form.fields.title} onChange={(e) => setForm({ ...form, fields: { ...form.fields, title: e.target.value } })} /></label>
                  {form.errors.title && <small className="fb-error">{form.errors.title}</small>}
                  <label>Descripción<textarea value={form.fields.description} onChange={(e) => setForm({ ...form, fields: { ...form.fields, description: e.target.value } })} /></label>
                  <label>Fecha *<input type="date" value={form.fields.date} onChange={(e) => setForm({ ...form, fields: { ...form.fields, date: e.target.value } })} /></label>
                  {form.errors.date && <small className="fb-error">{form.errors.date}</small>}
                  <label>Hora<input type="time" value={form.fields.time} onChange={(e) => setForm({ ...form, fields: { ...form.fields, time: e.target.value } })} /></label>
                  <label>Lugar *</label>
                  <div className="fb-radio">
                    <label><input type="radio" checked={form.fields.placeMode === 'existing'} onChange={() => setForm({ ...form, fields: { ...form.fields, placeMode: 'existing' } })} /> Lugar existente</label>
                    <label><input type="radio" checked={form.fields.placeMode === 'other'} onChange={() => setForm({ ...form, fields: { ...form.fields, placeMode: 'other' } })} /> Otro lugar</label>
                  </div>
                  {form.fields.placeMode === 'existing'
                    ? <select value={form.fields.placeSelect} onChange={(e) => setForm({ ...form, fields: { ...form.fields, placeSelect: e.target.value } })}>{places.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
                    : <input value={form.fields.placeOther} onChange={(e) => setForm({ ...form, fields: { ...form.fields, placeOther: e.target.value } })} placeholder="Escribe el lugar" />}
                  {form.errors.place && <small className="fb-error">{form.errors.place}</small>}
                  <label>Precio (USD) *<input type="number" min="0" value={form.fields.price} onChange={(e) => setForm({ ...form, fields: { ...form.fields, price: e.target.value } })} /></label>
                  {form.errors.price && <small className="fb-error">{form.errors.price}</small>}
                  <label>Capacidad *<input type="number" min="1" value={form.fields.capacity} onChange={(e) => setForm({ ...form, fields: { ...form.fields, capacity: e.target.value } })} /></label>
                  {form.errors.capacity && <small className="fb-error">{form.errors.capacity}</small>}
                  <label>Emoji de portada<input value={form.fields.emoji} onChange={(e) => setForm({ ...form, fields: { ...form.fields, emoji: e.target.value } })} /></label>
                  <div className="fb-emoji-pick">{EMOJIS.map((em) => <button type="button" key={em} className={form.fields.emoji === em ? 'picked' : ''} onClick={() => setForm({ ...form, fields: { ...form.fields, emoji: em } })}>{em}</button>)}</div>
                </div>
              )}
              {form.kind === 'place' && (
                <div className="fb-form">
                  <label>Nombre *<input value={form.fields.name} onChange={(e) => setForm({ ...form, fields: { ...form.fields, name: e.target.value } })} /></label>
                  {form.errors.name && <small className="fb-error">{form.errors.name}</small>}
                  <label>Tipo<select value={form.fields.type} onChange={(e) => setForm({ ...form, fields: { ...form.fields, type: e.target.value } })}>{PLACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
                  {form.errors.type && <small className="fb-error">{form.errors.type}</small>}
                  <label>Dirección<input value={form.fields.address} onChange={(e) => setForm({ ...form, fields: { ...form.fields, address: e.target.value } })} /></label>
                  <label>Ciudad<input value={form.fields.city} onChange={(e) => setForm({ ...form, fields: { ...form.fields, city: e.target.value } })} /></label>
                  <label>Horario<input value={form.fields.hours} onChange={(e) => setForm({ ...form, fields: { ...form.fields, hours: e.target.value } })} placeholder="Ej. 10:00 - 18:00" /></label>
                  <label>Descripción<textarea value={form.fields.description} onChange={(e) => setForm({ ...form, fields: { ...form.fields, description: e.target.value } })} /></label>
                  <label>Emoji<input value={form.fields.emoji} onChange={(e) => setForm({ ...form, fields: { ...form.fields, emoji: e.target.value } })} /></label>
                  <div className="fb-emoji-pick">{EMOJIS.map((em) => <button type="button" key={em} className={form.fields.emoji === em ? 'picked' : ''} onClick={() => setForm({ ...form, fields: { ...form.fields, emoji: em } })}>{em}</button>)}</div>
                </div>
              )}
              <div className="fb-modal-actions">
                <button className="fb-btn-primary fb-block" onClick={submitForm}>{form.mode === 'create' ? 'Publicar' : 'Guardar cambios'}</button>
                <button className="fb-btn fb-block" onClick={() => setForm(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fb-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="fb-modal sm" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Confirmar eliminación">
            <div className="fb-modal-body">
              <h2>¿Eliminar «{confirmDelete.name}»?</h2>
              <p>Esta acción no se puede deshacer. {confirmDelete.kind === 'place' && 'Los eventos de este lugar quedan con el lugar en texto.'}</p>
              <div className="fb-modal-actions">
                <button className="fb-btn danger-solid fb-block" onClick={doDelete}>Eliminar</button>
                <button className="fb-btn fb-block" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fb-toast">{toast}</div>}
    </div>
  )
}

function DateBadge({ ev }) {
  const { month, day } = eventMonthDay(ev)
  return <div className="fb-date-badge"><span className="fb-date-month">{month}</span><span className="fb-date-day">{day}</span></div>
}

function ProductCard({ p, seller, onOpen, onAdd, onSave, saved, onEdit, onDelete, showManage }) {
  return (
    <article className="fb-ad-card">
      <button className="fb-ad-photo" onClick={onOpen} aria-label={`Ver ${p.name}`}><span>{p.emoji}</span></button>
      <div className="fb-ad-body">
        <strong className="fb-ad-price">{priceLabel(p.price)}</strong>
        <button className="fb-ad-title" onClick={onOpen}>{p.name}</button>
        <small className="fb-muted">{p.condition || 'Nuevo'} · {seller?.location || 'La Habana'}</small>
        <small className="fb-muted">{seller?.name} · ★ {p.rating.toFixed(1)} ({p.reviews})</small>
        <div className="fb-card-actions">
          <button className="fb-btn-primary fb-flex" onClick={onAdd}>Obtener</button>
          <button className="fb-btn fb-flex" onClick={onSave}>{saved ? '★ Guardado' : '☆ Guardar'}</button>
        </div>
        {showManage && (
          <div className="fb-card-actions">
            <button className="fb-btn fb-flex" onClick={onEdit}>Editar</button>
            <button className="fb-btn danger fb-flex" onClick={onDelete}>Eliminar</button>
          </div>
        )}
      </div>
    </article>
  )
}

function EventCard({ ev, rsvp, onRsvp, onOpen, onEdit, onDelete, showManage }) {
  const going = ev.attendees + (rsvp === 'going' ? 1 : 0)
  const interested = interestedOf(ev) + (rsvp === 'interested' ? 1 : 0)
  const pct = Math.min(100, Math.round((ev.attendees / Math.max(1, ev.capacity)) * 100))
  return (
    <article className="fb-event-card">
      <button className="fb-event-cover" onClick={onOpen} aria-label={`Ver ${ev.title}`}><span>{ev.emoji}</span></button>
      <div className="fb-event-body">
        <div className="fb-event-head"><DateBadge ev={ev} /><div className="fb-event-title"><button className="fb-ad-title" onClick={onOpen}>{ev.title}</button><small>Organiza · {ev.place}</small><small>🕒 {ev.date} · {ev.time}</small><small>📍 {ev.place}</small></div></div>
        <small className="fb-event-counts">{going} van · {interested} interesados · {priceLabel(ev.price)}</small>
        <div className="fb-bar"><div style={{ width: `${pct}%` }} /></div>
        <small className="fb-muted">{going}/{ev.capacity} van · {pct}% ocupación</small>
        <div className="fb-rsvp">
          <button className={rsvp === 'interested' ? 'fb-btn active fb-flex' : 'fb-btn fb-flex'} onClick={() => onRsvp(ev.id, 'interested')} aria-pressed={rsvp === 'interested'}>⭐ Me interesa</button>
          <button className={rsvp === 'going' ? 'fb-btn-primary fb-flex' : 'fb-btn fb-flex'} onClick={() => onRsvp(ev.id, 'going')} aria-pressed={rsvp === 'going'}>✓ Voy</button>
        </div>
        {showManage && (
          <div className="fb-rsvp">
            <button className="fb-btn fb-flex" onClick={onEdit}>Editar</button>
            <button className="fb-btn danger fb-flex" onClick={onDelete}>Eliminar</button>
          </div>
        )}
      </div>
    </article>
  )
}

function PlaceCard({ pl, onOpen, onEdit, onDelete, showManage }) {
  return (
    <article className="fb-place-card">
      <button className="fb-place-photo" onClick={onOpen} aria-label={`Ver ${pl.name}`}><span>{pl.emoji}</span></button>
      <div className="fb-ad-body">
        <button className="fb-ad-title" onClick={onOpen}>{pl.name}</button>
        <small className="fb-muted">{pl.type} · {pl.address}</small>
        <small className="fb-muted">🕒 {pl.hours} · ★ {pl.rating.toFixed(1)} ({pl.reviews})</small>
        <p className="fb-muted">{pl.description}</p>
        {showManage && (
          <div className="fb-card-actions">
            <button className="fb-btn fb-flex" onClick={onEdit}>Editar</button>
            <button className="fb-btn danger fb-flex" onClick={onDelete}>Eliminar</button>
          </div>
        )}
      </div>
    </article>
  )
}
