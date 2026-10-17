import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, EVENTS as SEED_EVENTS, PLACES as SEED_PLACES, PRODUCTS as SEED_PRODUCTS, SELLERS as SEED_SELLERS, sellerById as seedSellerById } from './data.js'
import { loadStoreData } from './supabase.js'
import './App.css'

const TABS = [
  { id: 'home', label: 'Inicio', icon: '🏠' },
  { id: 'products', label: 'Productos', icon: '🛍️' },
  { id: 'sellers', label: 'Vendedores', icon: '🏪' },
  { id: 'places', label: 'Lugares', icon: '📍' },
  { id: 'events', label: 'Eventos', icon: '📅' },
  { id: 'cart', label: 'Carrito', icon: '🧺' },
]

function fmtUSD(n) { return `$${Number(n).toFixed(0)} USD` }
function priceLabel(p) { return p === 0 ? 'Gratis' : fmtUSD(p) }

export default function App() {
  const [tab, setTab] = useState('home')
  const [sellers, setSellers] = useState(SEED_SELLERS)
  const [products, setProducts] = useState(SEED_PRODUCTS)
  const [places, setPlaces] = useState(SEED_PLACES)
  const [events, setEvents] = useState(SEED_EVENTS)
  const [isDemo, setIsDemo] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [sellerFilter, setSellerFilter] = useState('Todos')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('store-cart') || '[]') } catch { return [] }
  })
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    loadStoreData().then((d) => {
      if (d.sellers) setSellers(d.sellers)
      if (d.products) setProducts(d.products)
      if (d.places) setPlaces(d.places)
      if (d.events) setEvents(d.events)
      // Demo solo si alguna fuente falló / no hay config. Si todo vino de Supabase, no es demo.
      setIsDemo(!(d.sellers && d.products && d.places && d.events))
    })
    const onPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  useEffect(() => {
    localStorage.setItem('store-cart', JSON.stringify(cart))
  }, [cart])

  const sellerById = (id) => sellers.find((s) => s.id === id) || seedSellerById(id)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === product.id)
      if (found) return prev.map((i) => i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, product.stock) } : i)
      return [...prev, { id: product.id, qty }]
    })
    showToast(`Añadido: ${product.name}`)
  }
  const changeQty = (id, delta) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i).filter((i) => i.qty > 0))
  }
  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id))

  const cartDetailed = cart.map((i) => ({ ...i, product: products.find((p) => p.id === i.id) })).filter((i) => i.product)
  const cartTotal = cartDetailed.reduce((sum, i) => sum + i.product.price * i.qty, 0)
  const cartCount = cartDetailed.reduce((sum, i) => sum + i.qty, 0)

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (category !== 'Todas' && p.category !== category) return false
      if (sellerFilter !== 'Todos' && p.seller_id !== sellerFilter) return false
      if (q && !(p.name.toLowerCase().includes(q) || (sellerById(p.seller_id)?.name || '').toLowerCase().includes(q))) return false
      return true
    })
  }, [products, sellers, query, category, sellerFilter])

  const featured = products.filter((p) => p.featured)
  const upcomingEvents = [...events].sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(0, 2)
  const verifiedSellers = sellers.filter((s) => s.verified)
  const topPlaces = [...places].sort((a, b) => b.rating - a.rating).slice(0, 3)

  const installApp = async () => {
    if (!deferredPrompt) { showToast('En tu navegador: menú → Instalar app / Añadir a pantalla de inicio'); return }
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  const orderWhatsApp = () => {
    if (cartDetailed.length === 0) return
    const lines = cartDetailed.map((i) => `• ${i.product.name} × ${i.qty} — ${fmtUSD(i.product.price * i.qty)}`).join('\n')
    const text = `Hola Store, quiero pedir:\n${lines}\nTotal: ${fmtUSD(cartTotal)}\n(Demo — sin pago real)`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const openSeller = (seller) => { setSelectedSeller(seller); setTab('sellers') }
  const sellerProducts = selectedSeller ? products.filter((p) => p.seller_id === selectedSeller.id) : []

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">🛍️</span><div><strong>Store</strong><small>Mercado local · La Habana</small></div></div>
        <div className="top-actions">
          {isDemo && <span className="badge-demo">Datos demo</span>}
          <button className="btn btn-ghost" onClick={installApp}>⬇ Instalar app</button>
          <button className="btn btn-dark" onClick={() => setTab('cart')}>🧺 {cartCount > 0 && <span className="cart-count">{cartCount}</span>}</button>
        </div>
      </header>

      {isDemo && <div className="demo-banner">Datos demo — configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para datos reales. Demo — sin pago real.</div>}

      <main className="main">
        {tab === 'home' && (
          <div>
            <section className="hero">
              <h1>Compra local,<br />en La Habana.</h1>
              <p>Productos, vendedores, lugares y eventos — todo en un solo mercado.</p>
              <div className="search-row">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busca café, artesanía, plantas…" aria-label="Buscar" />
                <button className="btn btn-dark" onClick={() => setTab('products')}>Buscar</button>
              </div>
              <div className="hero-chips">
                {CATEGORIES.map((c) => <button key={c} onClick={() => { setCategory(c); setTab('products') }}>{c}</button>)}
              </div>
            </section>

            <section>
              <div className="section-head"><h2>Destacados</h2><button className="link" onClick={() => setTab('products')}>Ver todos →</button></div>
              <div className="grid">{featured.slice(0, 6).map((p) => <ProductCard key={p.id} p={p} seller={sellerById(p.seller_id)} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} />)}</div>
            </section>

            <section>
              <div className="section-head"><h2>Próximos eventos</h2><button className="link" onClick={() => setTab('events')}>Ver todos →</button></div>
              <div className="list">{upcomingEvents.map((ev) => <EventCard key={ev.id} ev={ev} />)}</div>
            </section>

            <section>
              <div className="section-head"><h2>Vendedores verificados</h2><button className="link" onClick={() => setTab('sellers')}>Ver todos →</button></div>
              <div className="list">{verifiedSellers.map((s) => <SellerCard key={s.id} s={s} onOpen={() => openSeller(s)} />)}</div>
            </section>

            <section>
              <div className="section-head"><h2>Lugares top</h2><button className="link" onClick={() => setTab('places')}>Ver todos →</button></div>
              <div className="list">{topPlaces.map((pl) => <PlaceCard key={pl.id} pl={pl} />)}</div>
            </section>
          </div>
        )}

        {tab === 'products' && (
          <div>
            <h1 className="page-title">Productos</h1>
            <input className="search-full" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto o vendedor…" aria-label="Buscar productos" />
            <div className="filters">
              <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoría"><option>Todas</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
              <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} aria-label="Vendedor"><option value="Todos">Todos los vendedores</option>{sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </div>
            <p className="muted">{filteredProducts.length} productos</p>
            <div className="grid">{filteredProducts.map((p) => <ProductCard key={p.id} p={p} seller={sellerById(p.seller_id)} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} />)}</div>
            {filteredProducts.length === 0 && <p className="empty">Sin resultados. Prueba otra búsqueda o categoría.</p>}
          </div>
        )}

        {tab === 'sellers' && (
          <div>
            <h1 className="page-title">Vendedores</h1>
            {selectedSeller ? (
              <div className="seller-profile">
                <button className="link" onClick={() => setSelectedSeller(null)}>← Todos los vendedores</button>
                <div className="profile-head"><span className="avatar-lg">{selectedSeller.emoji}</span><div><h2>{selectedSeller.name} {selectedSeller.verified && '✓'}</h2><p>{selectedSeller.category} · {selectedSeller.location}</p><p>⭐ {selectedSeller.rating} · {selectedSeller.reviews} reseñas · Score {selectedSeller.score}</p></div></div>
                <div className="stats">
                  <div><strong>{selectedSeller.completed}</strong><span>Completadas</span></div>
                  <div><strong>{selectedSeller.cancelled}</strong><span>Canceladas</span></div>
                  <div><strong>{fmtUSD(selectedSeller.volume)}</strong><span>Volumen</span></div>
                  <div><strong>{selectedSeller.total}</strong><span>Operaciones</span></div>
                </div>
                <p className="muted">Reseñas ({selectedSeller.reviews}) ≤ operaciones completadas ({selectedSeller.completed}). Total = completadas + canceladas.</p>
                <h3>Productos de {selectedSeller.name}</h3>
                <div className="grid">{sellerProducts.map((p) => <ProductCard key={p.id} p={p} seller={selectedSeller} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} />)}</div>
                {sellerProducts.length === 0 && <p className="empty">Este vendedor aún no tiene productos.</p>}
              </div>
            ) : (
              <div className="list">{sellers.map((s) => <SellerCard key={s.id} s={s} onOpen={() => openSeller(s)} />)}</div>
            )}
          </div>
        )}

        {tab === 'places' && (
          <div>
            <h1 className="page-title">Lugares</h1>
            <div className="list">{places.map((pl) => <PlaceCard key={pl.id} pl={pl} />)}</div>
          </div>
        )}

        {tab === 'events' && (
          <div>
            <h1 className="page-title">Eventos y actividades</h1>
            <div className="list">{[...events].sort((a, b) => String(a.date).localeCompare(String(b.date))).map((ev) => <EventCard key={ev.id} ev={ev} />)}</div>
          </div>
        )}

        {tab === 'cart' && (
          <div>
            <h1 className="page-title">Carrito</h1>
            <p className="demo-note">Demo — sin pago real. El pedido se envía por WhatsApp.</p>
            {cartDetailed.length === 0 ? <p className="empty">Tu carrito está vacío. Explora productos y añade alguno. 🧺</p> : (
              <div>
                <div className="list">{cartDetailed.map((i) => (
                  <div className="card cart-row" key={i.id}>
                    <span className="emoji-md">{i.product.emoji}</span>
                    <div className="cart-info"><strong>{i.product.name}</strong><small>{sellerById(i.product.seller_id)?.name} · {fmtUSD(i.product.price)}</small>
                      <div className="qty"><button onClick={() => changeQty(i.id, -1)}>−</button><span>{i.qty}</span><button onClick={() => changeQty(i.id, 1)}>+</button></div>
                    </div>
                    <div className="cart-right"><strong>{fmtUSD(i.product.price * i.qty)}</strong><button className="link danger" onClick={() => removeItem(i.id)}>Quitar</button></div>
                  </div>
                ))}</div>
                <div className="total-row"><span>Total</span><strong>{fmtUSD(cartTotal)}</strong></div>
                <button className="btn btn-dark btn-block" onClick={orderWhatsApp}>Pedir por WhatsApp 💬</button>
                <button className="btn btn-ghost btn-block" onClick={() => setCart([])}>Vaciar carrito</button>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => { setTab(t.id); if (t.id !== 'sellers') setSelectedSeller(null) }}>
            <span>{t.icon}</span><small>{t.label}{t.id === 'cart' && cartCount > 0 ? ` (${cartCount})` : ''}</small>
          </button>
        ))}
      </nav>

      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="emoji-xl">{selectedProduct.emoji}</div>
            <h2>{selectedProduct.name}</h2>
            <p className="muted">{sellerById(selectedProduct.seller_id)?.name} · {selectedProduct.category}</p>
            <p>{selectedProduct.description}</p>
            <p>⭐ {selectedProduct.rating} · {selectedProduct.reviews} reseñas · Stock: {selectedProduct.stock}</p>
            <div className="total-row"><span>Precio</span><strong>{fmtUSD(selectedProduct.price)}</strong></div>
            <button className="btn btn-dark btn-block" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null) }}>Añadir al carrito 🧺</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function ProductCard({ p, seller, onOpen, onAdd }) {
  return (
    <article className="card product-card">
      <button className="card-click" onClick={onOpen} aria-label={`Ver ${p.name}`}>
        <span className="emoji-lg">{p.emoji}</span>
        <h3>{p.name}</h3>
        <p className="muted">{seller?.name} · {p.category}</p>
        <p>⭐ {p.rating} · Stock {p.stock}</p>
        <strong className="price">{fmtUSD(p.price)}</strong>
      </button>
      <button className="btn btn-dark btn-block" onClick={onAdd}>Añadir 🧺</button>
    </article>
  )
}

function SellerCard({ s, onOpen }) {
  return (
    <article className="card seller-row">
      <span className="avatar">{s.emoji}</span>
      <button className="card-click left" onClick={onOpen}>
        <strong>{s.name} {s.verified && <span title="Verificado">✓</span>}</strong>
        <small>{s.category} · {s.location}</small>
        <small>⭐ {s.rating} · {s.reviews} reseñas · Score {s.score} · {s.total} operaciones</small>
      </button>
      <span className="score-ring">{s.score}</span>
    </article>
  )
}

function PlaceCard({ pl }) {
  return (
    <article className="card place-row">
      <span className="emoji-md">{pl.emoji}</span>
      <div><strong>{pl.name}</strong><small>{pl.type} · {pl.address}</small><small>🕒 {pl.hours} · ⭐ {pl.rating} · {pl.reviews} reseñas</small><p className="muted">{pl.description}</p></div>
    </article>
  )
}

function EventCard({ ev }) {
  const pct = Math.min(100, Math.round((ev.attendees / Math.max(1, ev.capacity)) * 100))
  return (
    <article className="card event-row">
      <span className="emoji-md">{ev.emoji}</span>
      <div className="event-body">
        <strong>{ev.title}</strong>
        <small>📅 {ev.date} · {ev.time} · {ev.place}</small>
        <small>{priceLabel(ev.price)} · {ev.attendees}/{ev.capacity} asistentes</small>
        <div className="bar"><div style={{ width: `${pct}%` }} /></div>
        <small className="muted">{pct}% ocupación · {ev.description}</small>
      </div>
    </article>
  )
}
