// Seed local — IDÉNTICO a Supabase (proyecto filmalert, tablas store_*).
// Es el fallback cuando Supabase no está configurado o falla.
// NO inventar números distintos a este seed.
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
  { id: 'pr-cafe-1kg', name: 'Café en grano 1 kg', seller_id: 's-cafe-habana', category: 'Café', price: 18, stock: 24, rating: 4.9, reviews: 58, featured: true, emoji: '☕', description: 'Tostado medio, notas a cacao y caña. Grano entero.' },
  { id: 'pr-cafe-taza', name: 'Set 2 tazas cerámica', seller_id: 's-cafe-habana', category: 'Hogar', price: 12, stock: 18, rating: 4.8, reviews: 31, featured: false, emoji: '🍶', description: 'Tazas artesanales esmaltadas, 250 ml cada una.' },
  { id: 'pr-vasija', name: 'Vasija de barro pintada', seller_id: 's-manos-artesanas', category: 'Artesanía', price: 25, stock: 9, rating: 4.9, reviews: 44, featured: true, emoji: '🏺', description: 'Vasija hecha a mano, pintada con motivos caribeños.' },
  { id: 'pr-bolso', name: 'Bolso tejido a mano', seller_id: 's-manos-artesanas', category: 'Artesanía', price: 32, stock: 7, rating: 4.9, reviews: 38, featured: false, emoji: '👜', description: 'Bolso de yarey tejido, asa de cuero vegetal.' },
  { id: 'pr-monstera', name: 'Monstera deliciosa', seller_id: 's-verde-vivo', category: 'Plantas', price: 15, stock: 14, rating: 4.8, reviews: 29, featured: true, emoji: '🌿', description: 'Planta de interior en maceta de barro 20 cm. Incluye guía de cuidado.' },
  { id: 'pr-cactus-set', name: 'Set 3 cactus', seller_id: 's-verde-vivo', category: 'Plantas', price: 10, stock: 22, rating: 4.7, reviews: 18, featured: false, emoji: '🌵', description: 'Tres cactus en macetas mini de cerámica.' },
  { id: 'pr-audifonos', name: 'Audífonos Bluetooth', seller_id: 's-techhabana', category: 'Electrónica', price: 28, stock: 31, rating: 4.6, reviews: 87, featured: true, emoji: '🎧', description: 'Bluetooth 5.3, 30h de batería, estuche de carga.' },
  { id: 'pr-cargador', name: 'Cargador rápido 65W', seller_id: 's-techhabana', category: 'Electrónica', price: 19, stock: 42, rating: 4.5, reviews: 64, featured: false, emoji: '🔌', description: 'GaN, 2x USB-C + 1x USB-A. Cable incluido.' },
  { id: 'pr-vestido', name: 'Vestido lino Caribe', seller_id: 's-moda-caribe', category: 'Ropa', price: 34, stock: 11, rating: 4.8, reviews: 41, featured: true, emoji: '👗', description: 'Vestido de lino fresco, corte midi. Tallas XS-XL.' },
  { id: 'pr-camisa', name: 'Camisa guayabera', seller_id: 's-moda-caribe', category: 'Ropa', price: 29, stock: 16, rating: 4.8, reviews: 35, featured: false, emoji: '👔', description: 'Guayabera blanca de algodón, bordado a mano.' },
  { id: 'pr-vela', name: 'Vela aromática Coco', seller_id: 's-dulce-hogar', category: 'Hogar', price: 9, stock: 36, rating: 4.9, reviews: 27, featured: true, emoji: '🕯️', description: 'Vela de soja 200g, aroma coco y vainilla. 40h.' },
  { id: 'pr-manta', name: 'Manta tejida', seller_id: 's-dulce-hogar', category: 'Hogar', price: 26, stock: 8, rating: 4.9, reviews: 19, featured: false, emoji: '🧶', description: 'Manta de algodón tejida a mano, 130x170 cm.' },
]

export const PLACES = [
  { id: 'p-san-jose', name: 'Mercado de Artesanía San José', type: 'Mercado', address: 'Avenida del Puerto, La Habana Vieja', hours: '10:00 - 18:00', rating: 4.8, reviews: 320, emoji: '🏺', description: 'Mercado artesanal frente al puerto. Cerámica, arte y souvenirs.' },
  { id: 'p-plaza-vieja', name: 'Plaza Vieja', type: 'Plaza', address: 'Plaza Vieja, La Habana Vieja', hours: 'Abierto 24h', rating: 4.9, reviews: 540, emoji: '🏛️', description: 'Plaza colonial con cafés, galerías y música en vivo.' },
  { id: 'p-malecon', name: 'Malecón', type: 'Paseo', address: 'Malecón, La Habana', hours: 'Abierto 24h', rating: 4.9, reviews: 890, emoji: '🌅', description: 'Paseo marítimo de 8 km. Atardeceres, música y encuentro local.' },
  { id: 'p-fac', name: 'Fábrica de Arte Cubano', type: 'Centro cultural', address: 'Calle 26, Vedado', hours: '20:00 - 02:00', rating: 4.9, reviews: 610, emoji: '🎨', description: 'Arte, música, cine y gastronomía en una fábrica convertida.' },
  { id: 'p-parque-central', name: 'Parque Central', type: 'Parque', address: 'Prado y Neptuno, Centro Habana', hours: 'Abierto 24h', rating: 4.7, reviews: 210, emoji: '🌳', description: 'Parque céntrico junto al Capitolio. Punto de encuentro clásico.' },
  { id: 'p-carlos-iii', name: 'Centro Comercial Carlos III', type: 'Centro comercial', address: 'Carlos III, Centro Habana', hours: '09:00 - 19:00', rating: 4.5, reviews: 180, emoji: '🛍️', description: 'Tiendas, cafetería y servicios en el centro de la ciudad.' },
]

export const EVENTS = [
  { id: 'ev-feria-artesania', title: 'Feria de Artesanía', date: '2026-10-24', time: '10:00', place: 'Mercado de Artesanía San José', price: 0, capacity: 400, attendees: 128, emoji: '🏺', description: 'Feria con 40 artesanos, talleres en vivo y música.' },
  { id: 'ev-noche-fac', title: 'Noche de Arte en la FAC', date: '2026-10-30', time: '20:00', place: 'Fábrica de Arte Cubano', price: 5, capacity: 300, attendees: 214, emoji: '🎨', description: 'Exposiciones, concierto y cine al aire libre.' },
  { id: 'ev-taller-cafe', title: 'Taller de Café Cubano', date: '2026-11-07', time: '09:00', place: 'Plaza Vieja', price: 8, capacity: 30, attendees: 18, emoji: '☕', description: 'Cata y métodos de preparación: colador, espresso y frío.' },
  { id: 'ev-malecon-run', title: 'Caminata al Atardecer por el Malecón', date: '2026-11-08', time: '17:00', place: 'Malecón', price: 0, capacity: 80, attendees: 42, emoji: '🌅', description: 'Caminata guiada de 5 km con parada fotográfica.' },
  { id: 'ev-moda-caribe', title: 'Desfile Moda Caribe', date: '2026-11-14', time: '18:00', place: 'Centro Comercial Carlos III', price: 0, capacity: 150, attendees: 67, emoji: '👗', description: 'Colección nueva de diseño local, con venta en sitio.' },
  { id: 'ev-plantas', title: 'Intercambio de Plantas', date: '2026-11-21', time: '10:00', place: 'Parque Central', price: 0, capacity: 60, attendees: 23, emoji: '🌿', description: 'Trae una planta, llévate otra. Charla de cuidado.' },
]

export const CATEGORIES = ['Café', 'Artesanía', 'Plantas', 'Electrónica', 'Ropa', 'Hogar']

export const sellerById = (id) => SELLERS.find((s) => s.id === id)
