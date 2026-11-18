// Para cambiar una portada, sustituye su imagen en assets o cambia la ruta de cover.
const catalogo = {
  'cyberpunk': {
    nombre: 'Cyberpunk 2077', plataforma: 'PS5', genero: 'Rol y acción',
    cover: 'assets/cyberpunk.webp', fondo: 'assets/fondo-cyberpunk.webp', color: '#484522',
    descripcion: 'Recorre las calles de Night City como V, un mercenario que busca hacerse un nombre entre las luces de neón.'
  },
  'gta-v': {
    nombre: 'Grand Theft Auto V', plataforma: 'PS5', genero: 'Acción y aventura',
    alias: ['GTA 5', 'GTA5', 'GTAV', 'Grand Theft Auto 5'],
    cover: 'assets/gta-v.webp', fondo: 'assets/fondo-gta-v.webp', color: '#254439',
    descripcion: 'Tres protagonistas, una ciudad y un plan que puede salir mal en cualquier momento. Bienvenido a Los Santos.'
  },
  'gta-vi': {
    nombre: 'Grand Theft Auto VI', plataforma: 'PS5', genero: 'Acción y aventura',
    alias: ['GTA 6', 'GTA6', 'GTAVI', 'Grand Theft Auto 6'],
    cover: 'assets/gta-vi.webp', logo: 'assets/gta-vi-logo.svg', color: '#4d274b',
    descripcion: 'Vive la experiencia de la serie Grand Theft Auto más ambiciosa y envolvente hasta la fecha.'
  },
  'red-dead': {
    nombre: 'Red Dead Redemption 2', plataforma: 'PS4', genero: 'Aventura del Oeste',
    alias: ['RDR2'],
    cover: 'assets/red-dead.webp', fondo: 'assets/fondo-red-dead.webp', color: '#522623',
    descripcion: 'Cabalga con Arthur Morgan y la banda de Van der Linde por un Oeste que cambia a su alrededor.'
  },
  'netflix': {
    nombre: 'Netflix', plataforma: 'App', genero: 'Cine y series', color: '#440d1c',
    descripcion: 'Abre Netflix en tu navegador para explorar su catálogo de películas y series.'
  },
  'elden-ring': {
    nombre: 'Elden Ring', plataforma: 'PS5', genero: 'Rol y aventura',
    cover: 'assets/elden-ring.webp', fondo: 'assets/fondo-elden-ring.webp', color: '#43402a',
    descripcion: 'Sigue el rastro de la Gracia a través de las ruinas, castillos y bosques de las Tierras Intermedias.'
  },
  'astro-bot': {
    nombre: 'ASTRO BOT', plataforma: 'PS5', genero: 'Plataformas',
    cover: 'assets/astro-bot.webp', fondo: 'assets/fondo-astro-bot.webp', color: '#123f82',
    descripcion: 'Salta de planeta en planeta con Astro y reúne a su tripulación en una aventura galáctica.'
  },
  'ratchet': {
    nombre: 'Ratchet & Clank: Rift Apart', plataforma: 'PS5', genero: 'Acción y plataformas',
    cover: 'assets/ratchet.webp', fondo: 'assets/fondo-ratchet.webp', color: '#214959',
    descripcion: 'Atraviesa portales con Ratchet y Clank en un viaje entre dimensiones y mundos mecánicos.'
  },
  'tsushima': {
    nombre: 'Ghost of Tsushima', plataforma: 'PS5', genero: 'Acción y aventura',
    cover: 'assets/tsushima.webp', fondo: 'assets/fondo-tsushima.webp', color: '#414349',
    descripcion: 'Sigue al viento entre bosques de bambú, santuarios y campos abiertos de la isla de Tsushima.'
  },
  'galeria': {
    nombre: 'Galería multimedia', plataforma: 'App', genero: 'Arte de los juegos', color: '#53355e',
    descripcion: 'Vuelve al atardecer de Vice City y recorre las ilustraciones de tu colección.'
  },
  'biblioteca': {
    nombre: 'Biblioteca de juegos', plataforma: 'Colección', genero: 'Tu colección', color: '#273a54',
    descripcion: 'Explora tu colección y elige qué juego quieres ver en el menú de inicio.'
  }
};

const secciones = {
  games: ['cyberpunk', 'gta-v', 'gta-vi', 'red-dead', 'netflix', 'elden-ring', 'astro-bot', 'ratchet', 'tsushima', 'galeria', 'biblioteca'],
  media: ['galeria', 'netflix']
};

const galeria = [
  { titulo: 'Atardecer en Vice City', imagen: 'assets/vice-city.webp', alt: 'Lucía y Jason frente a la bahía de Vice City al atardecer.' },
  { titulo: 'Postales de Leonida', imagen: 'assets/gta-vi.webp', alt: 'Collage ilustrado de los personajes y vehículos de Leonida.' },
  { titulo: 'Los Santos', imagen: 'assets/gta-v.webp', alt: 'Los protagonistas de Los Santos entre coches y helicópteros.' },
  { titulo: 'Un salto galáctico', imagen: 'assets/astro-bot.webp', alt: 'Astro Bot salta en un cielo azul brillante.' }
];

// Duración que aparece en la fotografía. El usuario puede elegir otra fecha desde el menú.
const segundosDeMuestra = ((5 * 24 + 10) * 60 + 11) * 60 + 36;
