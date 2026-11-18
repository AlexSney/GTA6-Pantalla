'use strict';

let coleccionLocal;
let capturasLocales = [];
let avisosLocales = [];
let filtroBiblioteca = 'todos';
let indiceGaleria = 0;

function datosLocales(clave, valorInicial) {
  try { return JSON.parse(leer(clave)) ?? valorInicial; }
  catch { return valorInicial; }
}

function leerColeccion() { return coleccionLocal; }
function guardarColeccion() { guardar('coleccion', JSON.stringify(coleccionLocal)); }
function juegosDisponibles() { return Object.keys(catalogo).filter(id => catalogo[id].cover); }
function normalizarTexto(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function inicializarConsola() {
  const datos = datosLocales('coleccion', {});
  const listaValida = lista => Array.isArray(lista)
    ? [...new Set(lista.filter(id => juegosDisponibles().includes(id)))] : [];
  coleccionLocal = {
    favoritos: listaValida(datos.favoritos), recientes: listaValida(datos.recientes), ocultos: [],
    nombre: typeof datos.nombre === 'string' && datos.nombre.trim() ? datos.nombre.trim().slice(0, 24) : 'Jugador',
    estado: ['online', 'busy', 'offline'].includes(datos.estado) ? datos.estado : 'online'
  };
  const capturas = datosLocales('capturas', []);
  capturasLocales = Array.isArray(capturas) ? capturas.filter(item => item &&
    typeof item.imagen === 'string' && galeria.some(foto => foto.imagen === item.imagen) &&
    typeof item.titulo === 'string').slice(0, 30) : [];
  const avisos = datosLocales('avisos', []);
  avisosLocales = Array.isArray(avisos) ? avisos.filter(item => item &&
    typeof item.texto === 'string' && Number.isFinite(item.fecha)).slice(0, 20) : [];
  actualizarPerfilLocal();
  $('#control-center-button').addEventListener('click', abrirCentroControl);
  document.addEventListener('keydown', manejarTecladoConsola);
  window.addEventListener('gamepadconnected', iniciarMando);
  try { if ([...navigator.getGamepads()].some(Boolean)) iniciarMando(); } catch { /* API opcional. */ }
}

function actualizarPerfilLocal() {
  const nombres = { online: 'En línea', busy: 'Ocupado', offline: 'Aparecer desconectado' };
  $('#profile-button').title = coleccionLocal.nombre + ' · ' + nombres[coleccionLocal.estado];
  $('#profile-button').setAttribute('aria-label', 'Perfil de ' + coleccionLocal.nombre);
  $('#profile-button').dataset.status = coleccionLocal.estado;
}

function registrarAviso(texto) {
  avisosLocales.unshift({ texto, fecha: Date.now() });
  avisosLocales = avisosLocales.slice(0, 20);
  guardar('avisos', JSON.stringify(avisosLocales));
  notificar(texto);
}

function alternarFavorito(id) {
  const favoritos = coleccionLocal.favoritos;
  const indice = favoritos.indexOf(id);
  if (indice < 0) favoritos.push(id);
  else favoritos.splice(indice, 1);
  guardarColeccion();
  registrarAviso(catalogo[id].nombre + (indice < 0 ? ' añadido a favoritos' : ' eliminado de favoritos'));
  return indice < 0;
}

function botonVolver(texto, accion) {
  const volver = boton('', 'view-back', accion);
  volver.append(icono('left'), nodo('span', '', texto));
  return volver;
}

function mostrarBiblioteca() {
  abrirPanel('biblioteca', 'Biblioteca de juegos');
  const intro = nodo('div', 'view-intro');
  intro.append(nodo('p', 'eyebrow', 'TU ESPACIO PARA JUGAR'), nodo('p', '', 'Todos tus juegos, en un solo lugar.'));
  const pestañas = nodo('div', 'view-tabs');
  pestañas.setAttribute('aria-label', 'Filtrar colección');
  const opciones = [['todos', 'Tu colección'], ['favoritos', 'Favoritos'], ['recientes', 'Vistos recientemente']];
  const entrada = nodo('input', 'text-input library-search');
  entrada.type = 'search'; entrada.placeholder = 'Buscar en tu colección'; entrada.id = 'library-search';
  entrada.setAttribute('aria-label', 'Buscar en tu colección');
  const plataforma = nodo('select', 'select-input');
  plataforma.id = 'library-platform'; plataforma.setAttribute('aria-label', 'Plataforma');
  for (const [valor, titulo] of [['todas', 'Todas las plataformas'], ['PS5', 'PS5'], ['PS4', 'PS4']]) {
    const opcion = nodo('option', '', titulo); opcion.value = valor; plataforma.append(opcion);
  }
  const orden = nodo('select', 'select-input');
  orden.id = 'library-sort'; orden.setAttribute('aria-label', 'Ordenar juegos');
  for (const [valor, titulo] of [['az', 'Nombre: A–Z'], ['za', 'Nombre: Z–A']]) {
    const opcion = nodo('option', '', titulo); opcion.value = valor; orden.append(opcion);
  }
  const herramientas = nodo('div', 'library-tools'); herramientas.append(entrada, plataforma, orden);
  const cantidad = nodo('p', 'collection-count'); cantidad.setAttribute('role', 'status');
  const grid = nodo('div', 'collection-grid ps5-collection'); grid.id = 'library-grid';
  function dibujar() {
    grid.replaceChildren();
    let ids = filtroBiblioteca === 'favoritos' ? [...coleccionLocal.favoritos]
      : filtroBiblioteca === 'recientes' ? [...coleccionLocal.recientes] : juegosDisponibles();
    const consulta = normalizarTexto(entrada.value.trim());
    ids = ids.filter(id => (plataforma.value === 'todas' || catalogo[id].plataforma === plataforma.value) &&
      normalizarTexto([catalogo[id].nombre, ...(catalogo[id].alias || [])].join(' ')).includes(consulta));
    if (filtroBiblioteca !== 'recientes') ids.sort((a, b) => catalogo[a].nombre.localeCompare(catalogo[b].nombre, 'es') * (orden.value === 'za' ? -1 : 1));
    cantidad.textContent = ids.length + (ids.length === 1 ? ' juego' : ' juegos');
    for (const id of ids) {
      const card = nodo('div', 'library-card'); card.dataset.game = id;
      const abrir = boton('', 'grid-item', () => mostrarJuego(id, mostrarBiblioteca));
      abrir.append(portada(id), nodo('span', 'grid-name', catalogo[id].nombre), nodo('span', 'game-platform', catalogo[id].plataforma));
      const favorito = boton('', 'favorite-toggle', () => {
        const activo = alternarFavorito(id);
        favorito.setAttribute('aria-pressed', String(activo));
        if (filtroBiblioteca === 'favoritos') { dibujar(); pestañas.querySelector('[aria-pressed="true"]').focus(); }
      });
      favorito.append(icono('heart'));
      favorito.setAttribute('aria-label', 'Favorito: ' + catalogo[id].nombre);
      favorito.setAttribute('aria-pressed', String(coleccionLocal.favoritos.includes(id)));
      card.append(abrir, favorito); grid.append(card);
    }
    if (!ids.length) {
      const vacio = nodo('div', 'empty-state');
      vacio.append(icono(filtroBiblioteca === 'favoritos' ? 'heart' : 'search'), nodo('h3', '', 'Todavía no hay juegos aquí'),
        nodo('p', '', filtroBiblioteca === 'favoritos' ? 'Marca el corazón de un juego para añadirlo a favoritos.' : 'Prueba otro filtro o abre un juego de tu colección.'));
      grid.append(vacio);
    }
  }
  for (const [id, titulo] of opciones) {
    const tab = boton(titulo, 'view-tab', () => {
      filtroBiblioteca = id;
      for (const hermano of pestañas.children) hermano.setAttribute('aria-pressed', String(hermano === tab));
      dibujar();
    });
    tab.dataset.filter = id; tab.setAttribute('aria-pressed', String(filtroBiblioteca === id)); pestañas.append(tab);
  }
  entrada.addEventListener('input', dibujar); plataforma.addEventListener('change', dibujar); orden.addEventListener('change', dibujar);
  panelBody.append(intro, pestañas, herramientas, cantidad, grid); dibujar();
}

function mostrarJuego(id, volver) {
  const item = catalogo[id];
  if (!item.cover) return id === 'capturas' ? abrirCapturas() : id === 'galeria' ? abrirGaleria() : abrirBiblioteca();
  coleccionLocal.recientes = [id, ...coleccionLocal.recientes.filter(otro => otro !== id)].slice(0, 12);
  guardarColeccion();
  abrirPanel('juego', item.nombre);
  if (volver) panelBody.append(botonVolver('Volver', volver));
  const arte = imagen(item.fondo || item.cover, 'game-detail-art', 'Arte de ' + item.nombre);
  const detalle = nodo('div', 'game-detail-content');
  detalle.append(nodo('span', 'platform-badge', item.plataforma), nodo('p', 'eyebrow', item.genero), nodo('h3', '', item.nombre), nodo('p', '', item.descripcion));
  const acciones = nodo('div', 'form-actions');
  if (id === 'gta-vi') acciones.append(boton('Cuenta regresiva', 'panel-button primary', abrirContador));
  const favorito = boton(coleccionLocal.favoritos.includes(id) ? 'En favoritos' : 'Añadir a favoritos', 'panel-button', () => {
    const activo = alternarFavorito(id); favorito.textContent = activo ? 'En favoritos' : 'Añadir a favoritos';
    favorito.setAttribute('aria-pressed', String(activo));
  });
  favorito.setAttribute('aria-pressed', String(coleccionLocal.favoritos.includes(id)));
  acciones.append(favorito, boton('Ver en inicio', 'panel-button', () => seleccionarDesdePanel(id)));
  detalle.append(acciones, nodo('p', 'local-note', 'Colección interactiva. Los juegos se ejecutan desde tu consola.'));
  const cabecera = nodo('div', 'game-detail'); cabecera.append(arte, detalle); panelBody.append(cabecera);
}

function mostrarBusqueda() {
  abrirPanel('buscar', 'Buscar');
  const entrada = nodo('input', 'text-input console-search'); entrada.type = 'search'; entrada.id = 'console-search';
  entrada.placeholder = 'Busca un juego o contenido multimedia'; entrada.setAttribute('aria-label', entrada.placeholder);
  const lista = nodo('div', 'results search-results'); lista.id = 'search-results';
  const resumen = nodo('p', 'search-summary'); resumen.setAttribute('role', 'status');
  function filtrar() {
    const consulta = normalizarTexto(entrada.value.trim()); lista.replaceChildren();
    for (const [id, item] of Object.entries(catalogo)) {
      const texto = normalizarTexto([item.nombre, item.genero, item.plataforma, ...(item.alias || [])].join(' '));
      if (!texto.includes(consulta)) continue;
      const fila = boton('', 'result-row', () => item.cover ? mostrarJuego(id, mostrarBusqueda) : ficha(id));
      const nombre = nodo('span', '', item.nombre); nombre.append(nodo('small', '', item.plataforma + ' · ' + item.genero));
      fila.append(portada(id), nombre, icono('right', 'row-next')); lista.append(fila);
    }
    resumen.textContent = lista.children.length + ' resultados';
    if (!lista.children.length) lista.append(nodo('p', 'empty', 'No hay resultados. Prueba otro título.'));
  }
  entrada.addEventListener('input', filtrar);
  entrada.addEventListener('keydown', event => {
    if (event.key === 'Enter') lista.querySelector('button')?.click();
    if (event.key === 'ArrowDown') { event.preventDefault(); lista.querySelector('button')?.focus(); }
  });
  panelBody.append(entrada, resumen, lista); filtrar(); entrada.focus();
}

function mostrarPerfil() {
  abrirPanel('perfil', 'Perfil');
  const cabecera = nodo('div', 'profile-summary');
  const cara = nodo('span', 'avatar avatar-' + avatarActual); cara.id = 'current-avatar';
  const datos = nodo('div'); datos.append(nodo('p', 'eyebrow', 'PERFIL LOCAL'), nodo('h3', '', coleccionLocal.nombre));
  cabecera.append(cara, datos); panelBody.append(cabecera);
  const formulario = nodo('form', 'profile-form');
  const label = nodo('label', 'field-label', 'Nombre de jugador'); label.htmlFor = 'profile-name';
  const nombre = nodo('input', 'text-input'); nombre.id = 'profile-name'; nombre.value = coleccionLocal.nombre;
  nombre.maxLength = 24; nombre.required = true; nombre.autocomplete = 'off';
  const estadoLabel = nodo('label', 'field-label', 'Estado online'); estadoLabel.htmlFor = 'profile-status';
  const estado = nodo('select', 'text-input'); estado.id = 'profile-status';
  for (const [id, texto] of [['online', 'En línea'], ['busy', 'Ocupado'], ['offline', 'Aparecer desconectado']]) {
    const opcion = nodo('option', '', texto); opcion.value = id; estado.append(opcion);
  }
  estado.value = coleccionLocal.estado;
  const opciones = nodo('div', 'avatar-options');
  for (const [id, titulo] of Object.entries(avatares)) {
    const avatar = boton('', 'avatar-choice', () => { avatarActual = id; guardar('avatar', id); aplicarAvatar(); });
    avatar.dataset.avatar = id; avatar.setAttribute('aria-label', titulo); avatar.title = titulo;
    avatar.append(nodo('span', 'avatar avatar-' + id)); opciones.append(avatar);
  }
  const guardarBoton = nodo('button', 'panel-button primary', 'Guardar perfil'); guardarBoton.type = 'submit';
  formulario.append(label, nombre, estadoLabel, estado, nodo('span', 'field-label', 'Avatar'), opciones, guardarBoton);
  formulario.addEventListener('submit', event => {
    event.preventDefault(); const valor = nombre.value.trim();
    if (!valor) { nombre.setCustomValidity('Escribe un nombre.'); nombre.reportValidity(); return; }
    coleccionLocal.nombre = valor; coleccionLocal.estado = estado.value; guardarColeccion(); actualizarPerfilLocal();
    cabecera.querySelector('h3').textContent = valor; registrarAviso('Perfil actualizado');
  });
  nombre.addEventListener('input', () => nombre.setCustomValidity(''));
  const actividad = nodo('div', 'profile-stats');
  for (const [numero, titulo] of [[coleccionLocal.favoritos.length, 'Favoritos'], [coleccionLocal.recientes.length, 'Juegos vistos'], [capturasLocales.length, 'Imágenes guardadas']]) {
    const dato = nodo('div'); dato.append(nodo('strong', '', numero), nodo('span', '', titulo)); actividad.append(dato);
  }
  panelBody.append(formulario, actividad, nodo('p', 'local-note', 'Tu nombre, avatar y estado se guardan en este navegador.'));
  aplicarAvatar();
}

function mostrarGameBase() {
  abrirPanel('amigos', 'Game Base');
  const intro = nodo('div', 'empty-state');
  intro.append(icono('controller'), nodo('h3', '', 'Tu próxima partida empieza aquí'),
    nodo('p', '', 'La lista de amigos y los grupos online se gestionan con tu cuenta de PlayStation en la consola.'));
  panelBody.append(intro, filaMenu('Ver mi perfil', 'user', abrirPerfil), filaMenu('Explorar mi colección', 'grid', abrirBiblioteca));
}

function guardarImagenEnCapturas(foto) {
  if (capturasLocales.some(item => item.imagen === foto.imagen)) return notificar('Esta imagen ya está en tus capturas');
  capturasLocales.unshift({ titulo: foto.titulo, imagen: foto.imagen, fecha: Date.now() });
  capturasLocales = capturasLocales.slice(0, 30); guardar('capturas', JSON.stringify(capturasLocales));
  registrarAviso('Imagen guardada en Capturas');
}

async function descargarImagen(ruta, titulo) {
  const formato = typeof preferenciasAjustes !== 'undefined' ? preferenciasAjustes.formatoCapturas : 'png';
  const extension = formato === 'jpeg' ? 'jpg' : 'png';
  const enlace = document.createElement('a');
  const nombre = normalizarTexto(titulo).replace(/[^a-z0-9]+/g, '-');
  try {
    const foto = new Image(); foto.src = ruta; await foto.decode();
    const canvas = document.createElement('canvas'); canvas.width = foto.naturalWidth; canvas.height = foto.naturalHeight;
    canvas.getContext('2d').drawImage(foto, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, formato === 'jpeg' ? 'image/jpeg' : 'image/png', .92));
    if (!blob) throw new Error('No se pudo exportar');
    const url = URL.createObjectURL(blob); enlace.href = url; enlace.download = nombre + '.' + extension; enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch {
    enlace.href = ruta; enlace.download = nombre + '.' + ruta.split('.').pop(); enlace.click();
    notificar('Se descargará la imagen en su formato original');
  }
}

function mostrarGaleria() {
  abrirPanel('galeria', 'Galería multimedia');
  indiceGaleria = 0;
  const pestañas = nodo('div', 'view-tabs');
  pestañas.append(boton('Ilustraciones', 'view-tab', mostrarGaleria), boton('Mis capturas', 'view-tab', abrirCapturas));
  pestañas.firstElementChild.setAttribute('aria-pressed', 'true'); panelBody.append(pestañas);
  const figura = nodo('figure', 'gallery-figure');
  const foto = nodo('img', 'gallery-image'); foto.id = 'gallery-image';
  const pie = nodo('figcaption', 'gallery-footer');
  const titulo = nodo('div', 'gallery-caption'); titulo.setAttribute('aria-live', 'polite');
  const nombre = nodo('strong'); nombre.id = 'gallery-name';
  const numero = nodo('small'); numero.id = 'gallery-index'; titulo.append(nombre, numero);
  const controles = nodo('div', 'gallery-controls');
  for (const [paso, icon, label] of [[-1, 'left', 'Imagen anterior'], [1, 'right', 'Imagen siguiente']]) {
    const b = boton('', '', () => actualizarGaleria(paso)); b.setAttribute('aria-label', label); b.append(icono(icon)); controles.append(b);
  }
  pie.append(titulo, controles); figura.append(foto, pie);
  const acciones = nodo('div', 'form-actions');
  acciones.append(boton('Guardar en capturas', 'panel-button primary', () => guardarImagenEnCapturas(galeria[indiceGaleria])),
    boton('Descargar imagen', 'panel-button', () => descargarImagen(galeria[indiceGaleria].imagen, galeria[indiceGaleria].titulo)));
  panelBody.append(figura, acciones); actualizarGaleria(0);
}

function actualizarGaleria(paso) {
  indiceGaleria = (indiceGaleria + paso + galeria.length) % galeria.length;
  const item = galeria[indiceGaleria];
  $('#gallery-image').src = item.imagen; $('#gallery-image').alt = item.alt;
  $('#gallery-name').textContent = item.titulo; $('#gallery-index').textContent = (indiceGaleria + 1) + ' / ' + galeria.length;
}

function abrirCapturas() {
  abrirPanel('capturas', 'Capturas y galería');
  panelBody.append(botonVolver('Ver ilustraciones', abrirGaleria), nodo('p', '', 'Las imágenes que guardas desde la galería aparecen aquí.'));
  const grid = nodo('div', 'captures-grid');
  for (const item of capturasLocales) {
    const card = nodo('article', 'capture-card');
    card.append(imagen(item.imagen, '', item.titulo), nodo('h3', '', item.titulo));
    const acciones = nodo('div', 'form-actions');
    acciones.append(boton('Descargar', 'panel-button', () => descargarImagen(item.imagen, item.titulo)),
      boton('Quitar', 'panel-button', () => { capturasLocales = capturasLocales.filter(otro => otro !== item); guardar('capturas', JSON.stringify(capturasLocales)); abrirCapturas(); }));
    card.append(acciones); grid.append(card);
  }
  if (!capturasLocales.length) {
    const vacio = nodo('div', 'empty-state'); vacio.append(icono('capture'), nodo('h3', '', 'Tu galería está por empezar'),
      nodo('p', '', 'Abre una ilustración y selecciona «Guardar en capturas».'), boton('Explorar ilustraciones', 'panel-button primary', abrirGaleria)); grid.append(vacio);
  }
  panelBody.append(grid);
}

function abrirNotificaciones() {
  abrirPanel('notificaciones', 'Notificaciones');
  if (!avisosLocales.length) {
    const vacio = nodo('div', 'empty-state'); vacio.append(icono('bell'), nodo('h3', '', 'Estás al día'), nodo('p', '', 'Aquí verás las novedades de tu colección y tu perfil.')); panelBody.append(vacio);
  } else {
    const lista = nodo('div', 'notification-list');
    for (const aviso of avisosLocales) {
      const item = nodo('article', 'notification-item'); const texto = nodo('div');
      texto.append(nodo('p', '', aviso.texto), nodo('time', '', new Date(aviso.fecha).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })));
      item.append(icono('bell'), texto); lista.append(item);
    }
    panelBody.append(lista, boton('Borrar notificaciones', 'panel-button', () => { avisosLocales = []; guardar('avisos', '[]'); abrirNotificaciones(); }));
  }
}

function abrirCentroControl() {
  abrirPanel('control', 'Centro de control');
  const tarjetas = nodo('div', 'control-cards');
  const actual = boton('', 'activity-card', () => catalogo[elegido].cover ? mostrarJuego(elegido) : abrirGaleria());
  const item = catalogo[elegido];
  actual.style.backgroundImage = 'linear-gradient(0deg,#080a12f0,transparent),url("' + (item.fondo || item.cover || 'assets/vice-city.webp') + '")';
  actual.append(nodo('span', 'eyebrow', 'SELECCIONADO'), nodo('strong', '', item.nombre),
    nodo('span', '', elegido === 'gta-vi' ? tiempoRestante(Date.now()) : 'Ver detalles'));
  const biblioteca = boton('', 'activity-card collection-activity', abrirBiblioteca);
  biblioteca.append(icono('grid'), nodo('strong', '', 'Tu colección'), nodo('span', '', juegosDisponibles().length + ' juegos · ' + coleccionLocal.favoritos.length + ' favoritos'));
  tarjetas.append(actual, biblioteca);
  const controles = nodo('div', 'control-dock'); controles.setAttribute('aria-label', 'Funciones del centro de control');
  const funciones = [
    ['home', 'Inicio', () => panel.close()], ['bell', 'Notificaciones', abrirNotificaciones],
    ['controller', 'Game Base', mostrarGameBase], ['photo', 'Galería', abrirGaleria],
    ['speaker', 'Sonido', () => abrirAjustes('sonido')], ['controller', 'Accesorios', () => abrirAjustes('accesorios')],
    ['user', 'Perfil', abrirPerfil], ['settings', 'Ajustes', () => abrirAjustes()], ['power', 'Alimentación', abrirAlimentacion]
  ];
  for (const [simbolo, titulo, accion] of funciones) {
    const control = boton('', 'control-item', accion); control.title = titulo; control.setAttribute('aria-label', titulo);
    control.append(icono(simbolo), nodo('span', '', titulo)); controles.append(control);
  }
  panelBody.append(tarjetas, controles); controles.firstElementChild.focus();
}

function abrirAlimentacion() {
  abrirPanel('alimentacion', 'Alimentación');
  panelBody.append(nodo('p', '', 'Controla esta interfaz. Tu dispositivo seguirá encendido.'),
    filaMenu('Entrar en modo reposo', 'moon', () => {
      panel.close(); const reposo = nodo('div', 'rest-screen'); reposo.id = 'rest-screen';
      $('#console').inert = true;
      reposo.append(icono('moon'), nodo('h2', '', 'En modo reposo'), nodo('p', '', 'La interfaz está en pausa.'));
      const volver = boton('Volver a jugar', 'panel-button primary', () => { reposo.remove(); $('#console').inert = false; $('#control-center-button').focus(); });
      reposo.append(volver); document.body.append(reposo); volver.focus();
    }), filaMenu('Reiniciar interfaz', 'power', () => location.reload()));
}

function mostrarOpcionesJuego() {
  abrirPanel('opciones', 'Opciones');
  const lista = nodo('div', 'menu-list');
  lista.append(filaMenu('Ver información', 'info', () => ficha(elegido)));
  if (catalogo[elegido].cover) lista.append(filaMenu(coleccionLocal.favoritos.includes(elegido) ? 'Quitar de favoritos' : 'Añadir a favoritos', 'heart', () => { alternarFavorito(elegido); panel.close(); }));
  if (elegido === 'gta-vi') lista.append(filaMenu('Configurar cuenta regresiva', 'clock', abrirContador));
  lista.append(filaMenu('Biblioteca de juegos', 'grid', abrirBiblioteca), filaMenu('Centro de control', 'controller', abrirCentroControl));
  panelBody.append(lista);
}

function manejarTecladoConsola(event) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
  const esCampo = event.target.matches('input,select,textarea,[contenteditable="true"]');
  if (event.key.toLowerCase() === 'p' && !esCampo && !$('#rest-screen')) {
    event.preventDefault(); abrirCentroControl(); return;
  }
  if (!panel.open || esCampo || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  if (panel.dataset.view === 'galeria' || panel.dataset.view === 'ajustes') return;
  const elementos = [...panel.querySelectorAll('button,a,input,select')].filter(el => !el.disabled && el.offsetParent !== null);
  const indice = elementos.indexOf(document.activeElement);
  if (indice < 0 || !elementos.length) return;
  event.preventDefault(); const paso = ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 1;
  elementos[(indice + paso + elementos.length) % elementos.length].focus();
}

let animacionMando = 0;
let ultimaAccionMando = 0;
let botonesMandoPrevios = [];
function direccionMando(tecla) {
  const foco = document.activeElement || document.body;
  const horizontal = ['ArrowLeft', 'ArrowRight'].includes(tecla);
  if (panel.open && horizontal && foco.matches('select, input[type="range"]')) {
    const paso = tecla === 'ArrowLeft' ? -1 : 1;
    if (foco.matches('select')) foco.selectedIndex = Math.max(0, Math.min(foco.options.length - 1, foco.selectedIndex + paso));
    else if (paso > 0) foco.stepUp();
    else foco.stepDown();
    foco.dispatchEvent(new Event('input', { bubbles: true }));
    foco.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }
  if (panel.open && !horizontal && foco.matches('input,select')) {
    const controles = [...panel.querySelectorAll('button,a,input,select')].filter(control => !control.disabled && control.offsetParent !== null);
    const indice = controles.indexOf(foco);
    controles[(indice + (tecla === 'ArrowUp' ? -1 : 1) + controles.length) % controles.length]?.focus();
    return;
  }
  foco.dispatchEvent(new KeyboardEvent('keydown', { key: tecla, bubbles: true, cancelable: true }));
}

function iniciarMando() {
  if (animacionMando) return;
  function leerMando(ahora) {
    let mando;
    try { mando = [...navigator.getGamepads()].find(item => item && item.mapping === 'standard'); }
    catch { animacionMando = 0; return; }
    if (!mando) { animacionMando = 0; botonesMandoPrevios = []; return; }
    const botones = mando.buttons.map(b => b.pressed);
    if (!document.hidden && ahora - ultimaAccionMando > 170) {
      const direcciones = [[12, 'ArrowUp'], [13, 'ArrowDown'], [14, 'ArrowLeft'], [15, 'ArrowRight']];
      let tecla = direcciones.find(([indice]) => botones[indice])?.[1];
      if (!tecla && Math.abs(mando.axes[0]) > .65) tecla = mando.axes[0] < 0 ? 'ArrowLeft' : 'ArrowRight';
      if (!tecla && Math.abs(mando.axes[1]) > .65) tecla = mando.axes[1] < 0 ? 'ArrowUp' : 'ArrowDown';
      if (tecla) { direccionMando(tecla); ultimaAccionMando = ahora; }
      else if (botones[0] && !botonesMandoPrevios[0]) { document.activeElement?.click(); ultimaAccionMando = ahora; }
      else if (botones[1] && !botonesMandoPrevios[1] && panel.open) {
        const cancelar = new Event('cancel', { cancelable: true }); if (panel.dispatchEvent(cancelar)) panel.close(); ultimaAccionMando = ahora;
      } else if (botones[16] && !botonesMandoPrevios[16]) { abrirCentroControl(); ultimaAccionMando = ahora; }
    }
    botonesMandoPrevios = botones; animacionMando = requestAnimationFrame(leerMando);
  }
  animacionMando = requestAnimationFrame(leerMando);
}
