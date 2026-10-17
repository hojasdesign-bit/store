# Esquema Supabase — Store (proyecto filmalert)

Proyecto: `lbmgxxdfjmdaclkwafwr` (filmalert). Prefijo `store_*` para no
mezclarse con otras tablas del proyecto.

El frontend lee por REST (`/rest/v1/<tabla>?select=*`) con la anon key.
Si no hay keys o la lectura falla, usa el seed local de `src/data.js`
y muestra «Datos demo».

## store_sellers

| Columna | Tipo | Notas |
|---|---|---|
| id | text PK | p. ej. `s-cafe-habana` |
| name | text | |
| category | text | |
| location | text | |
| rating | numeric | 0–5 |
| reviews | int | reseñas (≤ completed) |
| total | int | = completed + cancelled |
| completed | int | operaciones completadas |
| cancelled | int | operaciones canceladas |
| volume | numeric | volumen USD (seed ya calculado) |
| score | int | 0–100 |
| emoji | text | avatar emoji |
| verified | boolean | |

## store_products

| Columna | Tipo | Notas |
|---|---|---|
| id | text PK | |
| name | text | |
| seller_id | text FK → store_sellers.id | |
| category | text | Café / Artesanía / Plantas / Electrónica / Ropa / Hogar |
| price | numeric | USD |
| stock | int | |
| rating | numeric | |
| reviews | int | |
| is_featured | boolean | destacados en Inicio |
| emoji | text | |
| description | text | |

## store_places

| Columna | Tipo | Notas |
|---|---|---|
| id | text PK | |
| name | text | |
| type | text | Mercado / Plaza / Paseo / Centro cultural / Parque / Centro comercial |
| address | text | |
| hours | text | p. ej. `10:00–18:00` |
| rating | numeric | |
| reviews | int | |
| emoji | text | |
| description | text | |

## store_events

| Columna | Tipo | Notas |
|---|---|---|
| id | text PK | |
| title | text | |
| date | date | `YYYY-MM-DD` |
| time | text | `HH:MM` |
| place | text | |
| price | numeric | 0 = Gratis |
| capacity | int | |
| attendees | int | ≤ capacity |
| emoji | text | |
| description | text | |

## Seed

El seed exacto está en `src/data.js` (6 vendedores, 12 productos,
6 lugares, 6 eventos). Al insertar en Supabase, usar esos mismos valores.
