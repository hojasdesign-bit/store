// Lectura + escritura Supabase vía REST (sin supabase-js).
// Si no hay VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY o la petición falla,
// la app usa el seed local (datos demo) y persiste los cambios en localStorage.
// Las escrituras remotas se intentan sin bloquear la UI: las políticas RLS
// de store_* permiten lectura + escritura pública (permisivas MVP —
// endurecer con autenticación antes de producción). Si no hay config o la
// escritura falla, el cambio queda guardado en este dispositivo (demo)
// y la app sigue funcionando.
const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(URL && KEY && KEY !== 'tu-anon-key-aqui')

const BASE = () => `${String(URL).replace(/\/$/, '')}/rest/v1`

function headers(extra = {}) {
  return { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...extra }
}

async function fetchTable(table) {
  if (!hasSupabaseConfig) return null
  try {
    const res = await fetch(`${BASE()}/${table}?select=*`, { headers: headers() })
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
        rating: Number(r.rating), reviews: Number(r.reviews ?? r.reviews_count),
        total: Number(r.trades_total ?? r.total),
        completed: Number(r.trades_completed ?? r.completed),
        cancelled: Number(r.trades_cancelled ?? r.cancelled),
        volume: Number(r.volume), score: Number(r.score),
        emoji: r.avatar_emoji || r.emoji || '🏪',
        verified: Boolean(r.is_verified ?? r.verified),
      }))
    }
    if (kind === 'products') {
      return rows.map((r) => ({
        id: r.id, name: r.name, seller_id: r.seller_id, category: r.category,
        price: Number(r.price), stock: Number(r.stock), rating: Number(r.rating),
        reviews: Number(r.reviews ?? r.reviews_count), featured: Boolean(r.is_featured ?? r.featured),
        emoji: r.emoji || '🛍️', description: r.description || '',
        // Supabase no tiene columna `condition`: los anuncios del seed son Nuevos.
        condition: 'Nuevo',
      }))
    }
    if (kind === 'places') {
      return rows.map((r) => ({
        id: r.id, name: r.name, type: r.type, address: r.address, city: r.city || 'La Habana',
        hours: r.hours, rating: Number(r.rating), reviews: Number(r.reviews ?? r.reviews_count),
        emoji: r.emoji || '📍', description: r.description || '',
      }))
    }
    if (kind === 'events') {
      return rows.map((r) => {
        // Supabase guarda start_at timestamptz + place_name + attendees_count.
        const start = String(r.start_at || '')
        return {
          id: r.id, title: r.title,
          date: r.date || start.slice(0, 10),
          time: r.time || start.slice(11, 16),
          place: r.place_name || r.place,
          price: Number(r.price), capacity: Number(r.capacity),
          attendees: Number(r.attendees_count ?? r.attendees),
          emoji: r.emoji || '📅', description: r.description || '',
        }
      })
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

// --- Escritura (CRUD) -------------------------------------------------------

const TABLE_BY_KIND = { product: 'store_products', event: 'store_events', place: 'store_places' }

// Convierte un item del formato de la app al formato de columnas Supabase.
// Los campos solo-locales (condition) se omiten: no existe esa columna.
export function toSupabaseRow(kind, item) {
  if (kind === 'product') {
    return {
      id: item.id, seller_id: item.seller_id, name: item.name,
      description: item.description || '', price: Number(item.price),
      currency: 'USD', category: item.category, stock: Number(item.stock),
      rating: Number(item.rating ?? 5), reviews_count: Number(item.reviews ?? 0),
      emoji: item.emoji || '🛍️', is_featured: Boolean(item.featured),
    }
  }
  if (kind === 'event') {
    return {
      id: item.id, title: item.title, description: item.description || '',
      place_id: null, place_name: item.place, category: 'Evento',
      start_at: `${item.date} ${item.time}:00`, end_at: null,
      price: Number(item.price), currency: 'USD', capacity: Number(item.capacity),
      attendees_count: Number(item.attendees ?? 0), emoji: item.emoji || '📅',
      is_featured: false,
    }
  }
  if (kind === 'place') {
    return {
      id: item.id, name: item.name, type: item.type, address: item.address || '',
      city: item.city || 'La Habana', description: item.description || '',
      rating: Number(item.rating ?? 5), reviews_count: Number(item.reviews ?? 0),
      hours: item.hours || '', emoji: item.emoji || '📍',
    }
  }
  return null
}

export async function createRow(kind, item) {
  if (!hasSupabaseConfig) return null
  const table = TABLE_BY_KIND[kind]
  const body = toSupabaseRow(kind, item)
  if (!table || !body) return null
  const res = await fetch(`${BASE()}/${table}`, {
    method: 'POST', headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Supabase create ${table}: ${res.status}`)
  return res.json()
}

export async function updateRow(kind, id, item) {
  if (!hasSupabaseConfig) return null
  const table = TABLE_BY_KIND[kind]
  const body = toSupabaseRow(kind, item)
  if (!table || !body) return null
  const res = await fetch(`${BASE()}/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Supabase update ${table}: ${res.status}`)
  return res.json()
}

export async function deleteRow(kind, id) {
  if (!hasSupabaseConfig) return null
  const table = TABLE_BY_KIND[kind]
  if (!table) return null
  const res = await fetch(`${BASE()}/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: headers(),
  })
  if (!res.ok) throw new Error(`Supabase delete ${table}: ${res.status}`)
  return true
}
