// Lectura Supabase vía REST (sin supabase-js).
// Si no hay VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY o la petición falla,
// devuelve null y la app usa el seed local (datos demo).
const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(URL && KEY && KEY !== 'tu-anon-key-aqui')

async function fetchTable(table) {
  if (!hasSupabaseConfig) return null
  try {
    const res = await fetch(`${URL.replace(/\/$/, '')}/rest/v1/${table}?select=*`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// Normaliza filas de Supabase al formato del seed. Si una tabla viene vacía
// o con formato inesperado, devuelve null para que se use el fallback local.
function normalize(rows, kind) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  try {
    if (kind === 'sellers') {
      return rows.map((r) => ({
        id: r.id, name: r.name, category: r.category, location: r.location,
        rating: Number(r.rating), reviews: Number(r.reviews), total: Number(r.total),
        completed: Number(r.completed), cancelled: Number(r.cancelled),
        volume: Number(r.volume), score: Number(r.score),
        emoji: r.emoji || '🏪', verified: Boolean(r.verified),
      }))
    }
    if (kind === 'products') {
      return rows.map((r) => ({
        id: r.id, name: r.name, seller_id: r.seller_id, category: r.category,
        price: Number(r.price), stock: Number(r.stock), rating: Number(r.rating),
        reviews: Number(r.reviews), featured: Boolean(r.is_featured ?? r.featured),
        emoji: r.emoji || '🛍️', description: r.description || '',
      }))
    }
    if (kind === 'places') {
      return rows.map((r) => ({
        id: r.id, name: r.name, type: r.type, address: r.address, hours: r.hours,
        rating: Number(r.rating), reviews: Number(r.reviews), emoji: r.emoji || '📍',
        description: r.description || '',
      }))
    }
    if (kind === 'events') {
      return rows.map((r) => ({
        id: r.id, title: r.title, date: r.date, time: r.time, place: r.place,
        price: Number(r.price), capacity: Number(r.capacity), attendees: Number(r.attendees),
        emoji: r.emoji || '📅', description: r.description || '',
      }))
    }
  } catch {
    return null
  }
  return null
}

export async function loadStoreData() {
  const [s, p, l, e] = await Promise.all([
    fetchTable('store_sellers').then((r) => normalize(r, 'sellers')),
    fetchTable('store_products').then((r) => normalize(r, 'products')),
    fetchTable('store_places').then((r) => normalize(r, 'places')),
    fetchTable('store_events').then((r) => normalize(r, 'events')),
  ])
  return { sellers: s, products: p, places: l, events: e }
}
