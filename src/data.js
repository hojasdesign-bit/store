// Seed local — idéntico a los datos demo que usa el fallback cuando Supabase
// no está configurado o falla. NO inventar números distintos a este seed.
// Stats derivadas: total = completadas + canceladas; volumen ya está en el seed.

export const SELLERS = [
  { id: 's-cafe-habana', name: 'Café Habana', category: 'Café y repostería', location: 'La Habana Vieja', rating: 4.8, reviews: 142, total: 187, completed: 181, cancelled: 6, volume: 2172, score: 92, emoji: '☕', verified: true },
  { id: 's-manos-artesanas', name: 'Manos Artesanas', category: 'Artesanía', location: 'Centro Habana', rating: 4.9, reviews: 198, total: 233, completed: 226, cancelled: 7, volume: 4068, score: 95, emoji: '🏺', verified: true },
  { id: 's-verde-vivo', name: 'Verde Vivo', category: 'Plantas y hogar', location: 'Vedado', rating: 4.7, reviews: 81, total: 98, completed: 95, cancelled: 3, volume: 1425, score: 88, emoji: '🌿', verified: false },
  { id: 's-techhabana', name: 'TechHabana', category: 'Electrónica', location: 'Vedado', rating: 4.6, reviews: 240, total: 312, completed: 303, cancelled: 9, volume: 13635, score: 90, emoji: '🔌', verified: true },
  { id: 's-moda-caribe', name: 'Moda Caribe', category: 'Ropa', location: 'Miramar', rating: 4.8, reviews: 121, total: 154, completed: 149, cancelled: 5, volume: 3278, score: 91, emoji: '👗', verified: true },
  { id: 's-dulce-hogar', name: 'Dulce Hogar', category: 'Hogar', location: 'Playa', rating: 4.9, reviews: 63, total: 76, completed: 74, cancelled: 2, volume: 1480, score: 94, emoji: '🕯️', verified: false },
]

export const PRODUCTS = [
  { id: 'p-cafe-grano', name: 'Café en grano 1 kg', seller_id: 's-cafe-habana', category: 'Café', price: 18, stock: 32, rating: 4.9, reviews: 87, featured: true, emoji: '☕', description: 'Café cubano en grano, tueste medio, 1 kg. Molido al momento si lo prefieres.' },
  { id: 'p-tazas', name: 'Set 2 tazas', seller_id: 's-cafe-habana', category: 'Café', price: 12, stock: 24, rating: 4.7, reviews: 41, featured: false, emoji: '☕', description: 'Set de 2 tazas de cerámica para espresso, hechas a mano.' },
  { id: 'p-vasija', name: 'Vasija de barro', seller_id: 's-manos-artesanas', category: 'Artesanía', price: 25, stock: 14, rating: 4.9, reviews: 63, featured: true, emoji: '🏺', description: 'Vasija de barro torneada a mano, pieza única de taller habanero.' },
  { id: 'p-bolso', name: 'Bolso tejido', seller_id: 's-manos-artesanas', category: 'Artesanía', price: 32, stock: 18, rating: 4.8, reviews: 52, featured: false, emoji: '👜', description: 'Bolso tejido a mano con fibras naturales, asa reforzada.' },
  { id: 'p-monstera', name: 'Monstera', seller_id: 's-verde-vivo', category: 'Plantas', price: 15, stock: 21, rating: 4.8, reviews: 45, featured: true, emoji: '🌿', description: 'Monstera deliciosa en maceta de 20 cm, lista para interior luminoso.' },
  { id: 'p-cactus', name: 'Set 3 cactus', seller_id: 's-verde-vivo', category: 'Plantas', price: 10, stock: 36, rating: 4.6, reviews: 29, featured: false, emoji: '🌵', description: 'Set de 3 cactus en macetas pequeñas, riego mínimo.' },
  { id: 'p-audifonos', name: 'Audífonos Bluetooth', seller_id: 's-techhabana', category: 'Electrónica', price: 28, stock: 26, rating: 4.7, reviews: 78, featured: true, emoji: '🎧', description: 'Audífonos Bluetooth con micrófono, hasta 20 h de batería y estuche de carga.' },
  { id: 'p-cargador', name: 'Cargador 65W', seller_id: 's-techhabana', category: 'Electrónica', price: 19, stock: 40, rating: 4.5, reviews: 54, featured: false, emoji: '🔌', description: 'Cargador rápido GaN 65W, USB-C, para laptop y móvil.' },
  { id: 'p-vestido', name: 'Vestido de lino', seller_id: 's-moda-caribe', category: 'Ropa', price: 34, stock: 12, rating: 4.9, reviews: 38, featured: true, emoji: '👗', description: 'Vestido de lino fresco, corte holgado, tallas S–L.' },
  { id: 'p-guayabera', name: 'Guayabera', seller_id: 's-moda-caribe', category: 'Ropa', price: 29, stock: 16, rating: 4.8, reviews: 47, featured: false, emoji: '👔', description: 'Guayabera clásica de algodón, bordado tradicional.' },
  { id: 'p-vela', name: 'Vela Coco', seller_id: 's-dulce-hogar', category: 'Hogar', price: 9, stock: 30, rating: 4.8, reviews: 33, featured: true, emoji: '🕯️', description: 'Vela aromática de coco en frasco de vidrio, 40 h de quemado.' },
  { id: 'p-manta', name: 'Manta tejida', seller_id: 's-dulce-hogar', category: 'Hogar', price: 26, stock: 11, rating: 4.9, reviews: 22, featured: false, emoji: '🧶', description: 'Manta tejida a mano, algodón suave, 130 × 170 cm.' },
]

export const PLACES = [
  { id: 'l-san-jose', name: 'Mercado de Artesanía San José', type: 'Mercado', address: 'Av. del Puerto, La Habana Vieja', hours: '10:00–18:00', rating: 4.8, reviews: 320, emoji: '🏺', description: 'Artesanía cubana, souvenirs y talleres de artistas locales.' },
  { id: 'l-plaza-vieja', name: 'Plaza Vieja', type: 'Plaza', address: 'Calle Teniente Rey, La Habana Vieja', hours: 'Abierto todo el día', rating: 4.9, reviews: 540, emoji: '🏛️', description: 'Plaza colonial restaurada con cafés, galerías y música en vivo.' },
  { id: 'l-malecon', name: 'Malecón', type: 'Paseo', address: 'Malecón, La Habana', hours: 'Abierto todo el día', rating: 4.9, reviews: 890, emoji: '🌅', description: 'El paseo marítimo de 8 km, atardeceres y encuentro de la ciudad.' },
  { id: 'l-fac', name: 'Fábrica de Arte Cubano', type: 'Centro cultural', address: 'Calle 26, Vedado', hours: '20:00–02:00', rating: 4.9, reviews: 610, emoji: '🎨', description: 'Arte, música, cine y diseño en una antigua fábrica.' },
  { id: 'l-parque-central', name: 'Parque Central', type: 'Parque', address: 'Prado y Neptuno, Centro Habana', hours: 'Abierto todo el día', rating: 4.7, reviews: 210, emoji: '🌳', description: 'Parque histórico frente al Capitolio, punto de encuentro.' },
  { id: 'l-carlos-iii', name: 'Centro Comercial Carlos III', type: 'Centro comercial', address: 'Av. Salvador Allende, Centro Habana', hours: '09:00–19:00', rating: 4.5, reviews: 180, emoji: '🛍️', description: 'Tiendas, servicios y gastronomía en el centro de la ciudad.' },
]

export const EVENTS = [
  { id: 'e-feria', title: 'Feria de Artesanía', date: '2026-10-24', time: '10:00', place: 'Mercado de Artesanía San José', price: 0, capacity: 400, attendees: 128, emoji: '🏺', description: 'Feria de artesanos con venta directa, demostraciones y música.' },
  { id: 'e-fac', title: 'Noche de Arte FAC', date: '2026-10-30', time: '20:00', place: 'Fábrica de Arte Cubano', price: 5, capacity: 300, attendees: 214, emoji: '🎨', description: 'Noche de exposiciones, conciertos y proyecciones en la FAC.' },
  { id: 'e-cafe', title: 'Taller de Café Cubano', date: '2026-11-07', time: '09:00', place: 'Café Habana, La Habana Vieja', price: 8, capacity: 30, attendees: 18, emoji: '☕', description: 'Aprende tueste, molido y colado del café cubano con cata incluida.' },
  { id: 'e-caminata', title: 'Caminata por el Malecón', date: '2026-11-08', time: '17:00', place: 'Malecón, La Habana', price: 0, capacity: 80, attendees: 42, emoji: '🌅', description: 'Caminata grupal al atardecer con parada fotográfica y merienda.' },
  { id: 'e-desfile', title: 'Desfile Moda Caribe', date: '2026-11-14', time: '18:00', place: 'Plaza Vieja', price: 0, capacity: 150, attendees: 67, emoji: '👗', description: 'Desfile de moda local con diseñadores emergentes.' },
  { id: 'e-plantas', title: 'Intercambio de Plantas', date: '2026-11-21', time: '10:00', place: 'Parque Central', price: 0, capacity: 60, attendees: 23, emoji: '🌿', description: 'Trae una planta, llévate otra. Intercambio y consejos de cuidado.' },
]

export const CATEGORIES = ['Café', 'Artesanía', 'Plantas', 'Electrónica', 'Ropa', 'Hogar']

export const sellerById = (id) => SELLERS.find((s) => s.id === id)
