'use strict';

const $ = (selector) => document.querySelector(selector);
const rail = $('#rail');
const panel = $('#panel');
const panelBody = $('#panel-body');
const memoria = { games: 'gta-vi', media: 'galeria' };
const avatares = { lucia: 'Lucía', astro: 'Astro Bot', ratchet: 'Ratchet', cyber: 'V' };
let seccion = 'games';
let elegido = 'gta-vi';
let focoAlCerrar;

// Algunos navegadores limitan localStorage cuando se abre un archivo con doble clic.
// El estado en memoria mantiene operativo el menú en ese caso.
function leer(clave) {
  try { return localStorage.getItem('vice-console.' + clave); }
  catch { return null; }
}
function guardar(clave, valor) {
  try { localStorage.setItem('vice-console.' + clave, String(valor)); }
  catch { /* La preferencia sigue activa durante esta sesión. */ }
}

let doceHoras = leer('hora') === '12';
let avatarActual = leer('avatar');
if (!Object.hasOwn(avatares, avatarActual)) avatarActual = 'lucia';
let reducido = leer('movimiento') === 'reducido';
// No recuperar la fecha relativa de muestra que se guardaba en «objetivo».
let fechaObjetivo = Number(leer('objetivo-gta-vi'));
if (!Number.isFinite(fechaObjetivo) || fechaObjetivo <= 0 || fechaObjetivo > 8640000000000000) {
  fijarObjetivo(fechaLanzamiento);
}

function fijarObjetivo(fecha) {
  fechaObjetivo = fecha;
  guardar('objetivo-gta-vi', fecha);
}

function nodo(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function icono(nombre, clase) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  const use = document.createElementNS(ns, 'use');
  use.setAttribute('href', '#i-' + nombre);
  svg.setAttribute('aria-hidden', 'true');
  if (clase) svg.setAttribute('class', clase);
  svg.append(use);
  return svg;
}

function imagen(ruta, clase, alt = '') {
  const img = nodo('img', clase);
  img.src = ruta;
  img.alt = alt;
  img.draggable = false;
  return img;
}

function boton(texto, clase, accion) {
  const el = nodo('button', clase, texto);
  el.type = 'button';
  el.addEventListener('click', accion);
  return el;
}

function portada(id) {
  const item = catalogo[id];
  const el = nodo('span', 'cover cover-' + id);
  el.setAttribute('aria-hidden', 'true');
  el.style.setProperty('--cover-base', item.color);
  if (item.cover) {
    el.append(imagen(item.cover, 'cover-art'));

  } else {
    el.append(icono(['galeria', 'capturas'].includes(id) ? 'photo' : 'grid', 'cover-icon'));
  }
  return el;
}

function tiempoRestante(ahora) {
  const total = Math.max(0, Math.ceil((fechaObjetivo - ahora) / 1000));
  if (total === 0) return 'Cuenta finalizada';
  const dos = (n) => String(n).padStart(2, '0');
  const dias = Math.floor(total / 86400);
  const horas = Math.floor(total / 3600) % 24;
  const minutos = Math.floor(total / 60) % 60;
  return dias + 'd ' + dos(horas) + ':' + dos(minutos) + ':' + dos(total % 60);
}

function actualizarTiempo() {
  const ahora = new Date();
  const reloj = $('#system-clock');
  const opciones = { hour: '2-digit', minute: '2-digit', hourCycle: doceHoras ? 'h12' : 'h23' };
  const hora = ahora.toLocaleTimeString(doceHoras ? 'en-US' : 'es-EC', opciones);
  if (reloj.textContent !== hora) {
    reloj.textContent = hora;
    reloj.dateTime = ahora.toTimeString().slice(0, 5);
    reloj.setAttribute('aria-label', 'Hora local ' + hora);
  }
  const cuenta = tiempoRestante(ahora.getTime());
  if (elegido === 'gta-vi') $('#action-label').textContent = cuenta;
  const contadorAbierto = $('#panel-countdown');
  if (contadorAbierto) contadorAbierto.textContent = cuenta;
}

function dibujarCarrusel() {
  rail.replaceChildren();
  for (const id of secciones[seccion]) {
    const tile = boton('', 'tile', () => {
      if (id === elegido) accionPrincipal();
      else seleccionar(id, true);
    });
    tile.dataset.id = id;
    tile.title = catalogo[id].nombre;
    tile.setAttribute('aria-label', catalogo[id].nombre);
    tile.append(portada(id));
    rail.append(tile);
  }
}

function seleccionar(id, enfocar = false) {
  const lista = secciones[seccion];
  const indice = lista.indexOf(id);
  if (indice < 0) return;
  elegido = id;
  memoria[seccion] = id;
  const item = catalogo[id];
  $('#carousel').style.setProperty('--index', indice);
  let activo;
  for (const tile of rail.children) {
    const actual = tile.dataset.id === id;
    tile.classList.toggle('is-selected', actual);
    tile.setAttribute('aria-pressed', String(actual));
    tile.tabIndex = actual ? 0 : -1;
    if (actual) activo = tile;
  }
  $('#previous').setAttribute('aria-disabled', String(indice === 0));
  $('#next').setAttribute('aria-disabled', String(indice === lista.length - 1));
  $('#selected-name').textContent = item.nombre;
  $('#platform-badge').textContent = item.plataforma;
  $('#disc-icon').toggleAttribute('hidden', !item.cover);
  $('#hero-name').textContent = item.nombre;
  $('#hero-name').classList.toggle('sr-only', Boolean(item.logo));
  $('#hero-title').classList.toggle('has-logo', Boolean(item.logo));
  $('#hero-logo').hidden = !item.logo;
  $('#description').textContent = item.descripcion;
  $('#friends-card').hidden = !item.cover;

  const esViceCity = id === 'gta-vi' || id === 'galeria';
  const escena = $('#other-scene');
  if (!esViceCity) {
    const fondo = item.fondo || item.cover || (id === 'biblioteca' ? catalogo['gta-v'].cover : '');
    escena.style.setProperty('--scene-color', item.color);
    $('#other-art').style.backgroundImage = fondo ? 'url("' + fondo + '")' : 'none';
  }
  escena.classList.toggle('is-visible', !esViceCity);

  const acciones = { galeria: 'Abrir galería', capturas: 'Ver capturas', biblioteca: 'Ver biblioteca' };
  const accion = acciones[id] || 'Ver juego';
  $('#action-label').textContent = id === 'gta-vi' ? tiempoRestante(Date.now()) : accion;
  $('#primary').setAttribute('aria-label', id === 'gta-vi' ? 'Abrir cuenta regresiva de GTA VI' : accion + ' · ' + item.nombre);
  document.title = item.nombre + ' · Menú de consola';
  if (enfocar) activo.focus({ preventScroll: true });
}

function cambiarSeccion(destino) {
  if (destino === seccion) return;
  seccion = destino;
  document.querySelectorAll('[data-section]').forEach(tab => {
    tab.setAttribute('aria-pressed', String(tab.dataset.section === destino));
  });
  $('#carousel').setAttribute('aria-label', destino === 'games' ? 'Carrusel de juegos' : 'Carrusel multimedia');
  dibujarCarrusel();
  seleccionar(memoria[destino]);
}

function desplazar(paso) {
  const lista = secciones[seccion];
  const nuevo = lista[lista.indexOf(elegido) + paso];
  if (nuevo) seleccionar(nuevo, true);
}

function abrirPanel(vista, titulo) {
  if (!panel.open) focoAlCerrar = document.activeElement;
  panel.dataset.view = vista;
  $('#panel-title').textContent = titulo;
  panelBody.replaceChildren();
  if (!panel.open) panel.showModal();
  panel.scrollTop = 0;
  $('#close-panel').focus({ preventScroll: true });
}

function seleccionarDesdePanel(id) {
  if (!secciones[seccion].includes(id)) cambiarSeccion('games');
  seleccionar(id);
  focoAlCerrar = rail.querySelector('.is-selected');
  panel.close();
}

function filaMenu(texto, simbolo, accion) {
  const fila = boton('', 'menu-row', accion);
  fila.append(icono(simbolo), nodo('span', '', texto), icono('right', 'row-next'));
  return fila;
}

function ficha(id) { mostrarJuego(id); }

function fechaLocal(fecha) {
  const d = new Date(fecha);
  return new Date(fecha - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
}

function abrirContador() {
  abrirPanel('contador', 'Cuenta regresiva');
  const total = nodo('p', 'count-display', tiempoRestante(Date.now()));
  total.id = 'panel-countdown';
  panelBody.append(total, nodo('p', '', 'Cuenta hasta el 19 de noviembre de 2026 a las 00:00 de tu hora local. Puedes ajustar la fecha y la hora.'));
  const form = nodo('form');
  const label = nodo('label', 'field-label', 'Fecha y hora local');
  label.htmlFor = 'fecha-objetivo';
  const input = nodo('input', 'text-input');
  input.id = 'fecha-objetivo';
  input.type = 'datetime-local';
  input.step = '1';
  input.required = true;
  input.value = fechaLocal(fechaObjetivo);
  const error = nodo('p', 'form-error');
  error.setAttribute('role', 'alert');
  error.hidden = true;
  const acciones = nodo('div', 'form-actions');
  const aplicar = nodo('button', 'panel-button primary', 'Guardar fecha');
  aplicar.type = 'submit';
  const restaurar = boton('Usar fecha de lanzamiento', 'panel-button', () => {
    fijarObjetivo(fechaLanzamiento);
    actualizarTiempo();
    panel.close();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const fecha = new Date(input.value).getTime();
    if (!Number.isFinite(fecha) || fecha <= Date.now()) {
      error.textContent = 'Elige una fecha y una hora futuras.';
      error.hidden = false;
      input.focus();
      return;
    }
    fijarObjetivo(fecha);
    actualizarTiempo();
    panel.close();
  });
  acciones.append(aplicar, restaurar);
  form.append(label, input, error, acciones);
  panelBody.append(form);
}

function abrirBiblioteca() { mostrarBiblioteca(); }

function abrirBusqueda() { mostrarBusqueda(); }

function abrirAmigos() { mostrarGameBase(); }

function aplicarAvatar() {
  $('#profile-avatar').className = 'avatar avatar-' + avatarActual;
  const muestra = $('#current-avatar');
  if (muestra) muestra.className = 'avatar avatar-' + avatarActual;
  document.querySelectorAll('[data-avatar]').forEach(el => {
    el.setAttribute('aria-pressed', String(el.dataset.avatar === avatarActual));
  });
}

function abrirPerfil() { mostrarPerfil(); }

function abrirGaleria() { mostrarGaleria(); }

function cambiarFoto(paso) { actualizarGaleria(paso); }

function etiquetaPantalla() {
  return document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa';
}

async function pantallaCompleta() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
    panel.close();
  } catch {
    if (!$('#fullscreen-note')) {
      const nota = nodo('p', '', 'Tu navegador controla la pantalla completa desde su propio menú.');
      nota.id = 'fullscreen-note';
      panelBody.append(nota);
    }
  }
}


function masOpciones() { mostrarOpcionesJuego(); }

function accionPrincipal() {
  if (elegido === 'gta-vi') abrirContador();
  else if (elegido === 'galeria') abrirGaleria();
  else if (elegido === 'biblioteca') abrirBiblioteca();
  else if (elegido === 'capturas') abrirCapturas();
  else ficha(elegido);
}

document.querySelectorAll('[data-section]').forEach(tab => {
  tab.addEventListener('click', () => cambiarSeccion(tab.dataset.section));
});
$('#previous').addEventListener('click', () => desplazar(-1));
$('#next').addEventListener('click', () => desplazar(1));
$('#primary').addEventListener('click', accionPrincipal);
$('#more').addEventListener('click', masOpciones);
$('#friends-card').addEventListener('click', abrirAmigos);
$('#search-button').addEventListener('click', abrirBusqueda);
$('#settings-button').addEventListener('click', () => abrirAjustes());
$('#profile-button').addEventListener('click', abrirPerfil);
$('#close-panel').addEventListener('click', () => panel.close());
panel.addEventListener('click', event => {
  if (event.target !== panel) return;
  const r = panel.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) panel.close();
});
panel.addEventListener('close', () => {
  if (panel.open) return;
  panelBody.replaceChildren();
  if ($('#rest-screen')) { $('#rest-screen button').focus(); return; }
  if (focoAlCerrar?.isConnected && focoAlCerrar !== document.body) focoAlCerrar.focus({ preventScroll: true });
  else rail.querySelector('.is-selected')?.focus({ preventScroll: true });
});

document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if ($('#rest-screen')) return;
  const tecla = event.key;
  const horizontal = tecla === 'ArrowLeft' || tecla === 'ArrowRight';
  const paso = tecla === 'ArrowLeft' ? -1 : 1;
  if (event.defaultPrevented) return;
  if (panel.open) {
    if (horizontal && panel.dataset.view === 'galeria') {
      event.preventDefault();
      cambiarFoto(paso);
    }
    return;
  }
  const foco = document.activeElement;
  const enCarrusel = foco === document.body || Boolean(foco.closest('#carousel'));
  if (tecla === '/') {
    event.preventDefault();
    abrirBusqueda();
  } else if (horizontal && enCarrusel) {
    event.preventDefault();
    desplazar(paso);
  } else if (horizontal && foco.matches('[data-section]')) {
    event.preventDefault();
    cambiarSeccion(paso < 0 ? 'games' : 'media');
    document.querySelector('[data-section="' + seccion + '"]').focus();
  } else if (horizontal && foco.closest('.actions')) {
    event.preventDefault();
    $(paso < 0 ? '#primary' : '#more').focus();
  } else if (tecla === 'ArrowDown' || tecla === 'ArrowUp') {
    const niveles = [document.querySelector('[data-section="' + seccion + '"]'), rail.querySelector('.is-selected'), $('#primary')];
    if (!$('#friends-card').hidden) niveles.push($('#friends-card'));
    const nivel = foco.closest('.topbar') ? 0 : enCarrusel ? 1 : foco.closest('.actions') ? 2 : 3;
    const nuevo = niveles[nivel + (tecla === 'ArrowDown' ? 1 : -1)];
    if (nuevo) { event.preventDefault(); nuevo.focus({ preventScroll: true }); }
  } else if (tecla === 'Enter' && foco === document.body) {
    event.preventDefault();
    accionPrincipal();
  }
});

// Un deslizamiento cambia de portada. Un toque sigue siendo un clic normal.
const ventanaRail = $('.rail-window');
let inicioDeslizamiento;
let bloquearClicHasta = 0;
ventanaRail.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse') inicioDeslizamiento = { id: event.pointerId, x: event.clientX, y: event.clientY };
});
ventanaRail.addEventListener('pointercancel', () => { inicioDeslizamiento = null; });
ventanaRail.addEventListener('pointerup', event => {
  if (!inicioDeslizamiento || inicioDeslizamiento.id !== event.pointerId) return;
  const dx = event.clientX - inicioDeslizamiento.x;
  const dy = event.clientY - inicioDeslizamiento.y;
  inicioDeslizamiento = null;
  if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.3) {
    bloquearClicHasta = performance.now() + 350;
    desplazar(dx < 0 ? 1 : -1);
  }
});
ventanaRail.addEventListener('click', event => {
  if (performance.now() < bloquearClicHasta) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

inicializarConsola();
inicializarAjustes();
document.documentElement.classList.toggle('reduce-motion', reducido);
aplicarAvatar();
dibujarCarrusel();
seleccionar('gta-vi');
actualizarTiempo();
setInterval(actualizarTiempo, 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) actualizarTiempo();
});
