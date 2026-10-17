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
  { id: 'cart', label: 'Biblioteca', icon: '📚' },
]

const HOME_MODES = [
  { id: 'para-ti', label: 'Para ti' },
  { id: 'mas-vendidos', label: 'Más vendidos' },
  { id: 'nuevos', label: 'Nuevos' },
  { id: 'categorias', label: 'Categorías' },
]

// Color de fondo del icono cuadrado por categoría (propio, no de marca).
const CATEGORY_COLORS = {
  'Café': '#fef3e2',
  'Artesanía': '#fce8e6',
  'Plantas': '#e6f4ea',
  'Electrónica': '#e8f0fe',
  'Ropa': '#f3e8fd',
  'Hogar': '#fef7e0',
}
const iconBg = (category) => CATEGORY_COLORS[category] || '#f1f3f4'

function fmtUSD(n) { return `$${Number(n).toFixed(0)} USD` }
function priceLabel(p) { return p === 0 ? 'Gratis' : fmtUSD(p) }

// Estrellas ★ según rating (0–5). Media estrella aproximada con ☆.
function Stars({ rating, reviews }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const stars = '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(5 - full - (half ? 1 : 0))
  return <span className="stars" title={`${rating} de 5`}>{stars} <span className="stars-num">{rating.toFixed(1)}</span>{reviews != null && <span className="stars-reviews"> · {reviews} reseñas</span>}</span>
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [homeMode, setHomeMode] = useState('para-ti')
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
  // RSVP de eventos estilo Facebook Events: { [eventId]: 'going' | 'interested' }
  const [rsvp, setRsvp] = useState(() => {
    try { return JSON.parse(localStorage.getItem('store-event-rsvp') || '{}') } catch { return {} }
  })
  const [eventFilter, setEventFilter] = useState('Todos')
  const [toast, setToast] = useState('')

  useEffect(() => {
    loadStoreData().then((d) => {
      if (d.sellers) setSellers(d.sellers)
      if (d.products) setProducts(d.products)
      if (d.places) setPlaces(d.places)
      if (d.events) setEvents(d.events)
      setIsDemo(!(d.sellers && d.products && d.places && d.events))
    })
  }, [])

  useEffect(() => {
    localStorage.setItem('store-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('store-event-rsvp', JSON.stringify(rsvp))
  }, [rsvp])

  const toggleRsvp = (eventId, kind) => {
    setRsvp((prev) => {
      const next = { ...prev }
      if (next[eventId] === kind) delete next[eventId]
      else next[eventId] = kind
      return next
    })
  }

  const sellerById = (id) => sellers.find((s) => s.id === id) || seedSellerById(id)
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === product.id)
      if (found) return prev.map((i) => i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, product.stock) } : i)
      return [...prev, { id: product.id, qty }]
    })
    showToast(`Obtenido: ${product.name}`)
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
  const bestSellers = [...products].sort((a, b) => b.reviews - a.reviews)
  const newest = [...products].reverse()
  const upcomingEvents = [...events].sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(0, 3)
  const verifiedSellers = sellers.filter((s) => s.verified)
  const topPlaces = [...places].sort((a, b) => b.rating - a.rating).slice(0, 4)

  const orderWhatsApp = () => {
    if (cartDetailed.length === 0) return
    const lines = cartDetailed.map((i) => `• ${i.product.name} × ${i.qty} — ${fmtUSD(i.product.price * i.qty)}`).join('\n')
    const text = `Hola Store, quiero pedir:\n${lines}\nTotal: ${fmtUSD(cartTotal)}\n(Demo — sin pago real)`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const openSeller = (seller) => { setSelectedSeller(seller); setTab('sellers') }
  const viewSellerProducts = (seller) => {
    setSellerFilter(seller.id)
    setCategory('Todas')
    setTab('products')
    setSelectedSeller(null)
  }
  const sellerProducts = selectedSeller ? products.filter((p) => p.seller_id === selectedSeller.id) : []

  const goTab = (id) => { setTab(id); if (id !== 'sellers') setSelectedSeller(null) }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">🛍️</span>
          <strong className="brand-name">Store</strong>
        </div>
        <div className="top-search" role="search">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); }}
            onKeyDown={(e) => { if (e.key === 'Enter') setTab('products') }}
            placeholder="Buscar productos, vendedores, lugares…"
            aria-label="Buscar en Store"
          />
          <button className="btn btn-play btn-sm" onClick={() => setTab('products')}>Buscar</button>
        </div>
        <div className="top-actions">
          {isDemo && <span className="badge-demo">Datos demo</span>}
          <button className="btn btn-ghost btn-sm cart-btn" onClick={() => goTab('cart')} aria-label="Abrir Biblioteca">📚 {cartCount > 0 && <span className="cart-count">{cartCount}</span>}</button>
          <span className="avatar-top" aria-hidden="true">A</span>
        </div>
      </header>

      {isDemo && <div className="demo-banner">Datos demo — configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para datos reales. Demo — sin pago real.</div>}

      <main className="main">
        {tab === 'home' && (
          <div>
            <nav className="play-tabs" aria-label="Secciones de inicio">
              {HOME_MODES.map((m) => (
                <button key={m.id} className={homeMode === m.id ? 'play-tab active' : 'play-tab'} onClick={() => setHomeMode(m.id)}>{m.label}</button>
              ))}
            </nav>

            {homeMode === 'categorias' && (
              <section>
                <h1 className="page-title">Categorías</h1>
                <div className="chips">
                  <button className={category === 'Todas' ? 'chip active' : 'chip'} onClick={() => setCategory('Todas')}>Todas</button>
                  {CATEGORIES.map((c) => <button key={c} className={category === c ? 'chip active' : 'chip'} onClick={() => setCategory(c)}>{c}</button>)}
                </div>
                <p className="muted">{category === 'Todas' ? `${products.length} productos` : `${products.filter((p) => p.category === category).length} productos en ${category}`}</p>
                <div className="grid">
                  {products.filter((p) => category === 'Todas' || p.category === category).map((p) => (
                    <ProductCard key={p.id} p={p} seller={sellerById(p.seller_id)} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} />
                  ))}
                </div>
              </section>
            )}

            {homeMode === 'mas-vendidos' && (
              <section>
                <h1 className="page-title">Más vendidos</h1>
                <p className="muted">Ordenados por reseñas. Las ventas mostradas son ventas del vendedor (operaciones completadas en el catálogo).</p>
                <div className="carousel">
                  {bestSellers.map((p) => <ProductCard key={p.id} p={p} seller={sellerById(p.seller_id)} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} />)}
                </div>
              </section>
            )}

            {homeMode === 'nuevos' && (
              <section>
                <h1 className="page-title">Nuevos</h1>
                <p className="muted">Añadidos recientemente (orden del catálogo, del último al primero).</p>
                <div className="carousel">
                  {newest.map((p) => <ProductCard key={p.id} p={p} seller={sellerById(p.seller_id)} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} />)}
                </div>
              </section>
            )}

            {homeMode === 'para-ti' && (
              <div>
                <section>
                  <div className="section-head"><h2>Recomendados para ti</h2><button className="link" onClick={() => setTab('products')}>Ver todos →</button></div>
                  <div className="carousel">{featured.map((p) => <ProductCard key={p.id} p={p} seller={sellerById(p.seller_id)} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} />)}</div>
                </section>
                <section>
                  <div className="section-head"><h2>Más vendidos</h2><button className="link" onClick={() => setHomeMode('mas-vendidos')}>Ver todos →</button></div>
                  <div className="carousel">{bestSellers.slice(0, 6).map((p) => <ProductCard key={p.id} p={p} seller={sellerById(p.seller_id)} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} />)}</div>
                </section>
                <section>
                  <div className="section-head"><h2>Nuevos</h2><button className="link" onClick={() => setHomeMode('nuevos')}>Ver todos →</button></div>
                  <div className="carousel">{newest.slice(0, 6).map((p) => <ProductCard key={p.id} p={p} seller={sellerById(p.seller_id)} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} />)}</div>
                </section>
                <section>
                  <div className="section-head"><h2>Colección: próximos eventos</h2><button className="link" onClick={() => goTab('events')}>Ver todos →</button></div>
                  <div className="collection-row">{upcomingEvents.map((ev) => <EventCard key={ev.id} ev={ev} compact rsvp={rsvp[ev.id]} onRsvp={toggleRsvp} />)}</div>
                </section>
                <section>
                  <div className="section-head"><h2>Desarrolladores verificados</h2><button className="link" onClick={() => goTab('sellers')}>Ver todos →</button></div>
                  <div className="list">{verifiedSellers.map((s) => <SellerCard key={s.id} s={s} onOpen={() => openSeller(s)} onViewProducts={() => viewSellerProducts(s)} />)}</div>
                </section>
                <section>
                  <div className="section-head"><h2>Colección: lugares destacados</h2><button className="link" onClick={() => goTab('places')}>Ver todos →</button></div>
                  <div className="collection-row">{topPlaces.map((pl) => <PlaceCard key={pl.id} pl={pl} compact />)}</div>
                </section>
              </div>
            )}
          </div>
        )}

        {tab === 'products' && (
          <div>
            <h1 className="page-title">Productos</h1>
            <div className="chips">
              <button className={category === 'Todas' ? 'chip active' : 'chip'} onClick={() => setCategory('Todas')}>Todas</button>
              {CATEGORIES.map((c) => <button key={c} className={category === c ? 'chip active' : 'chip'} onClick={() => setCategory(c)}>{c}</button>)}
            </div>
            <div className="filters">
              <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} aria-label="Vendedor"><option value="Todos">Todos los vendedores</option>{sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              {(sellerFilter !== 'Todos' || category !== 'Todas' || query.trim()) && <button className="btn btn-ghost btn-sm" onClick={() => { setSellerFilter('Todos'); setCategory('Todas'); setQuery('') }}>Limpiar filtros</button>}
            </div>
            <p className="muted">{filteredProducts.length} productos{sellerFilter !== 'Todos' ? ` · ${sellerById(sellerFilter)?.name}` : ''}</p>
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
                <div className="profile-head">
                  <span className="avatar-lg" style={{ background: '#e6f4ea' }}>{selectedSeller.emoji}</span>
                  <div>
                    <h2>{selectedSeller.name} {selectedSeller.verified && <span className="verified" title="Verificado">✓</span>}</h2>
                    <p className="muted">{selectedSeller.category} · {selectedSeller.location}</p>
                    <p><Stars rating={selectedSeller.rating} reviews={selectedSeller.reviews} /> · Score {selectedSeller.score}</p>
                    <button className="btn btn-play btn-sm" onClick={() => viewSellerProducts(selectedSeller)}>Ver apps del desarrollador</button>
                  </div>
                </div>
                <div className="stats">
                  <div><strong>{selectedSeller.completed}</strong><span>Ventas completadas</span></div>
                  <div><strong>{selectedSeller.cancelled}</strong><span>Canceladas</span></div>
                  <div><strong>{fmtUSD(selectedSeller.volume)}</strong><span>Volumen</span></div>
                  <div><strong>{selectedSeller.total}</strong><span>Operaciones</span></div>
                </div>
                <p className="muted">Reseñas ({selectedSeller.reviews}) ≤ ventas completadas ({selectedSeller.completed}). Total = completadas + canceladas.</p>
                <h3>Productos de {selectedSeller.name}</h3>
                <div className="grid">{sellerProducts.map((p) => <ProductCard key={p.id} p={p} seller={selectedSeller} onOpen={() => setSelectedProduct(p)} onAdd={() => addToCart(p)} />)}</div>
                {sellerProducts.length === 0 && <p className="empty">Este vendedor aún no tiene productos.</p>}
              </div>
            ) : (
              <div className="list">{sellers.map((s) => <SellerCard key={s.id} s={s} onOpen={() => openSeller(s)} onViewProducts={() => viewSellerProducts(s)} />)}</div>
            )}
          </div>
        )}

        {tab === 'places' && (
          <div>
            <h1 className="page-title">Lugares</h1>
            <p className="muted">Colecciones de lugares en La Habana.</p>
            <div className="collection-grid">{places.map((pl) => <PlaceCard key={pl.id} pl={pl} />)}</div>
          </div>
        )}

        {tab === 'events' && (
          <div>
            <h1 className="page-title">Eventos y actividades</h1>
            <p className="muted">Descubre eventos como en Facebook Events: marca «Me interesa» o «Voy». Asistentes ≤ capacidad en todos los eventos.</p>
            <div className="chips">
              {['Todos', 'Gratis', 'De pago', 'Mis eventos'].map((f) => (
                <button key={f} className={eventFilter === f ? 'chip active' : 'chip'} onClick={() => setEventFilter(f)}>{f}</button>
              ))}
            </div>
            <div className="collection-grid">{[...events].sort((a, b) => String(a.date).localeCompare(String(b.date))).filter((ev) => {
              if (eventFilter === 'Gratis') return ev.price === 0
              if (eventFilter === 'De pago') return ev.price > 0
              if (eventFilter === 'Mis eventos') return Boolean(rsvp[ev.id])
              return true
            }).map((ev) => <EventCard key={ev.id} ev={ev} rsvp={rsvp[ev.id]} onRsvp={toggleRsvp} />)}</div>
            {[...events].filter((ev) => {
              if (eventFilter === 'Gratis') return ev.price === 0
              if (eventFilter === 'De pago') return ev.price > 0
              if (eventFilter === 'Mis eventos') return Boolean(rsvp[ev.id])
              return true
            }).length === 0 && <p className="empty">Sin eventos en este filtro. Marca «Me interesa» o «Voy» en un evento para verlo en Mis eventos.</p>}
          </div>
        )}

        {tab === 'cart' && (
          <div>
            <h1 className="page-title">Biblioteca</h1>
            <p className="muted">Tus productos obtenidos. Equivale al carrito: se guarda en este dispositivo.</p>
            <p className="demo-note">Demo — sin pago real. El pedido se envía por WhatsApp.</p>
            {cartDetailed.length === 0 ? <p className="empty">Tu Biblioteca está vacía. Explora productos y pulsa Obtener. 📚</p> : (
              <div>
                <div className="list">{cartDetailed.map((i) => (
                  <div className="card cart-row" key={i.id}>
                    <span className="app-icon sm" style={{ background: iconBg(i.product.category) }}>{i.product.emoji}</span>
                    <div className="cart-info"><strong>{i.product.name}</strong><small>{sellerById(i.product.seller_id)?.name} · {fmtUSD(i.product.price)}</small>
                      <div className="qty"><button onClick={() => changeQty(i.id, -1)}>−</button><span>{i.qty}</span><button onClick={() => changeQty(i.id, 1)}>+</button></div>
                    </div>
                    <div className="cart-right"><strong>{fmtUSD(i.product.price * i.qty)}</strong><button className="link danger" onClick={() => removeItem(i.id)}>Quitar</button></div>
                  </div>
                ))}</div>
                <div className="total-row"><span>Total</span><strong>{fmtUSD(cartTotal)}</strong></div>
                <button className="btn btn-play btn-block" onClick={orderWhatsApp}>Obtener y pedir por WhatsApp 💬</button>
                <button className="btn btn-ghost btn-block" onClick={() => setCart([])}>Vaciar Biblioteca</button>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => goTab(t.id)}>
            <span>{t.icon}</span><small>{t.label}{t.id === 'cart' && cartCount > 0 ? ` (${cartCount})` : ''}</small>
          </button>
        ))}
      </nav>

      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Ficha de ${selectedProduct.name}`}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="detail-head">
              <span className="app-icon xl" style={{ background: iconBg(selectedProduct.category) }}>{selectedProduct.emoji}</span>
              <div>
                <h2>{selectedProduct.name}</h2>
                <button className="link dev-link" onClick={() => { const s = sellerById(selectedProduct.seller_id); setSelectedProduct(null); if (s) openSeller(s) }}>{sellerById(selectedProduct.seller_id)?.name}</button>
                <p className="muted">{selectedProduct.category}</p>
                <Stars rating={selectedProduct.rating} reviews={selectedProduct.reviews} />
                <p className="muted">{sellerById(selectedProduct.seller_id)?.completed} ventas del vendedor · Stock: {selectedProduct.stock}</p>
              </div>
            </div>
            <div className="detail-actions">
              <button className="btn btn-play btn-block" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null) }}>Obtener · {priceLabel(selectedProduct.price)}</button>
            </div>
            <h3>Capturas</h3>
            <div className="screenshots">
              <span className="shot" style={{ background: iconBg(selectedProduct.category) }}>{selectedProduct.emoji}</span>
              <span className="shot shot-alt">{selectedProduct.emoji}</span>
              <span className="shot" style={{ background: iconBg(selectedProduct.category) }}>{selectedProduct.emoji}</span>
            </div>
            <h3>Acerca de este producto</h3>
            <p>{selectedProduct.description}</p>
            <h3>Información</h3>
            <dl className="info-list">
              <div><dt>Vendedor</dt><dd>{sellerById(selectedProduct.seller_id)?.name}</dd></div>
              <div><dt>Categoría</dt><dd>{selectedProduct.category}</dd></div>
              <div><dt>Precio</dt><dd>{priceLabel(selectedProduct.price)}</dd></div>
              <div><dt>Stock</dt><dd>{selectedProduct.stock} unidades</dd></div>
              <div><dt>Valoración</dt><dd>{selectedProduct.rating.toFixed(1)} · {selectedProduct.reviews} reseñas</dd></div>
            </dl>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function ProductCard({ p, seller, onOpen, onAdd }) {
  return (
    <article className="card app-card">
      <button className="card-click" onClick={onOpen} aria-label={`Ver ${p.name}`}>
        <span className="app-icon" style={{ background: iconBg(p.category) }}>{p.emoji}</span>
        <span className="app-meta">
          <strong className="app-name">{p.name}</strong>
          <span className="app-dev">{seller?.name}</span>
          <Stars rating={p.rating} reviews={p.reviews} />
          <span className="app-sales">{seller?.completed} ventas del vendedor · Stock {p.stock}</span>
          <strong className="price">{priceLabel(p.price)}</strong>
        </span>
      </button>
      <button className="btn btn-play btn-sm obtain-btn" onClick={onAdd}>Obtener</button>
    </article>
  )
}

function SellerCard({ s, onOpen, onViewProducts }) {
  return (
    <article className="card seller-row">
      <span className="avatar">{s.emoji}</span>
      <button className="card-click left" onClick={onOpen}>
        <strong>{s.name} {s.verified && <span className="verified" title="Verificado">✓</span>}</strong>
        <small>{s.category} · {s.location}</small>
        <small><Stars rating={s.rating} reviews={s.reviews} /> · Score {s.score}</small>
        <small>{s.total} operaciones · {s.completed} ventas completadas</small>
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onViewProducts}>Ver apps</button>
    </article>
  )
}

function PlaceCard({ pl, compact }) {
  return (
    <article className={`card place-card ${compact ? 'compact' : ''}`}>
      <span className="collection-emoji">{pl.emoji}</span>
      <div className="collection-body"><strong>{pl.name}</strong><small>{pl.type} · {pl.address}</small><small>🕒 {pl.hours}</small><Stars rating={pl.rating} reviews={pl.reviews} /><p className="muted">{pl.description}</p></div>
    </article>
  )
}

// Eventos con referencia a Facebook Events (sin marca Facebook): portada,
// bloque de fecha (mes + día), organizador, hora, lugar y botones
// «Me interesa» / «Voy». Interesados se deriva de asistentes (×1.6).
const EVENT_MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

function EventCard({ ev, compact, rsvp, onRsvp }) {
  const pct = Math.min(100, Math.round((ev.attendees / Math.max(1, ev.capacity)) * 100))
  const going = ev.attendees + (rsvp === 'going' ? 1 : 0)
  const interested = Math.round(ev.attendees * 1.6) + (rsvp === 'interested' ? 1 : 0)
  const day = String(ev.date || '').slice(8, 10)
  const month = EVENT_MONTHS[Number(String(ev.date || '').slice(5, 7)) - 1] || ''
  return (
    <article className={`card event-card fb-event ${compact ? 'compact' : ''}`}>
      <div className="event-cover" aria-hidden="true"><span>{ev.emoji}</span></div>
      <div className="event-body">
        <div className="fb-event-head">
          <div className="date-badge"><span className="date-month">{month}</span><span className="date-day">{day}</span></div>
          <div className="fb-event-title">
            <strong>{ev.title}</strong>
            <small>Organiza · {ev.place}</small>
            <small>🕒 {ev.date} · {ev.time}</small>
            <small>📍 {ev.place}</small>
          </div>
        </div>
        <small className="fb-event-counts">{going} van · {interested} interesados · {priceLabel(ev.price)}</small>
        <div className="bar"><div style={{ width: `${pct}%` }} /></div>
        <small className="muted">{going}/{ev.capacity} van · {pct}% ocupación{compact ? '' : ` · ${ev.description}`}</small>
        <div className="rsvp-row">
          <button className={rsvp === 'interested' ? 'rsvp-btn active' : 'rsvp-btn'} onClick={() => onRsvp && onRsvp(ev.id, 'interested')} aria-pressed={rsvp === 'interested'}>⭐ Me interesa</button>
          <button className={rsvp === 'going' ? 'rsvp-btn active primary' : 'rsvp-btn primary'} onClick={() => onRsvp && onRsvp(ev.id, 'going')} aria-pressed={rsvp === 'going'}>✓ Voy</button>
        </div>
      </div>
    </article>
  )
}
