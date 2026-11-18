'use strict';

// Los ajustes de esta recreación solo afectan a la interfaz y al perfil local.
const categoriasAjustes = [
  { id: 'accesibilidad', nombre: 'Accesibilidad', icono: 'accessibility', detalle: 'Visualización, texto y movimiento' },
  { id: 'red', nombre: 'Red', icono: 'network', detalle: 'Estado de conexión' },
  { id: 'usuarios', nombre: 'Usuarios y cuentas', icono: 'user', detalle: 'Tu perfil en esta consola' },
  { id: 'familia', nombre: 'Familia y control parental', icono: 'shield', detalle: 'Perfiles y acceso a servicios' },
  { id: 'sistema', nombre: 'Sistema', icono: 'settings', detalle: 'Fecha, hora y ahorro de energía' },
  { id: 'almacenamiento', nombre: 'Almacenamiento', icono: 'download', detalle: 'Datos guardados en el navegador' },
  { id: 'sonido', nombre: 'Sonido', icono: 'speaker', detalle: 'Volumen y efectos del menú' },
  { id: 'pantalla', nombre: 'Pantalla y vídeo', icono: 'screen', detalle: 'Brillo y área de visualización' },
  { id: 'accesorios', nombre: 'Accesorios', icono: 'controller', detalle: 'Mandos y teclado' },
  { id: 'datos', nombre: 'Datos guardados y ajustes de juegos/aplicaciones', icono: 'grid', detalle: 'Preferencias de tu colección' },
  { id: 'notificaciones', nombre: 'Notificaciones', icono: 'bell', detalle: 'Avisos en pantalla' },
  { id: 'capturas', nombre: 'Capturas y transmisiones', icono: 'capture', detalle: 'Galería y formato de captura' }
];
let preferenciasAjustes;
let categoriaAjustesActual = '';
let contextoSonido;
let ultimoSonido = 0;
let ultimoUsoInterfaz = Date.now();
let temporizadorAviso;

function numeroAjuste(valor, minimo, maximo, respaldo) {
  return typeof valor === 'number' && Number.isFinite(valor)
    ? Math.min(maximo, Math.max(minimo, valor)) : respaldo;
}

function cargarPreferenciasAjustes() {
  let guardado = {};
  try {
    const valor = JSON.parse(leer('ajustes') || '{}');
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) guardado = valor;
  } catch { /* Se usan los valores iniciales si los datos no son válidos. */ }
  return {
    contraste: guardado.contraste === true,
    texto: ['normal', 'grande', 'muy-grande'].includes(guardado.texto) ? guardado.texto : 'normal',
    volumen: numeroAjuste(guardado.volumen, 0, 100, 25),
    efectos: guardado.efectos === true,
    brillo: numeroAjuste(guardado.brillo, 40, 100, 100),
    reposo: [0, 5, 15, 30].includes(guardado.reposo) ? guardado.reposo : 0,
    notificaciones: guardado.notificaciones !== false,
    formatoCapturas: guardado.formatoCapturas === 'jpeg' ? 'jpeg' : 'png'
  };
}

function guardarAjustes() {
  guardar('ajustes', JSON.stringify(preferenciasAjustes));
}

function aplicarPreferenciasAjustes() {
  const raiz = document.documentElement;
  raiz.classList.toggle('high-contrast', preferenciasAjustes.contraste);
  raiz.dataset.textSize = preferenciasAjustes.texto;
  raiz.style.setProperty('--screen-dimming', String((100 - preferenciasAjustes.brillo) / 100));
  raiz.classList.toggle('reduce-motion', reducido);
}

function notificar(texto, forzar = false) {
  if (!forzar && preferenciasAjustes && !preferenciasAjustes.notificaciones) return;
  let aviso = document.querySelector('#system-toast');
  if (!aviso) {
    aviso = nodo('div', 'system-toast');
    aviso.id = 'system-toast';
    aviso.setAttribute('role', 'status');
    aviso.setAttribute('aria-live', 'polite');
  }
  // Dentro del diálogo, el aviso también queda en la capa superior del navegador.
  (panel.open ? panel : document.body).append(aviso);
  aviso.replaceChildren(icono('bell'), nodo('span', '', texto));
  aviso.classList.add('is-visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove('is-visible'), 3600);
}

function sonidoInterfaz() {
  if (!preferenciasAjustes?.efectos || preferenciasAjustes.volumen === 0) return;
  if (Date.now() - ultimoSonido < 90) return;
  ultimoSonido = Date.now();
  try {
    const MotorAudio = window.AudioContext || window.webkitAudioContext;
    if (!MotorAudio) return;
    contextoSonido ||= new MotorAudio();
    if (contextoSonido.state === 'suspended') contextoSonido.resume().catch(() => {});
    const oscilador = contextoSonido.createOscillator();
    const ganancia = contextoSonido.createGain();
    const ahora = contextoSonido.currentTime;
    oscilador.type = 'sine';
    oscilador.frequency.setValueAtTime(620, ahora);
    oscilador.frequency.exponentialRampToValueAtTime(420, ahora + .075);
    ganancia.gain.setValueAtTime(.0001, ahora);
    ganancia.gain.exponentialRampToValueAtTime(Math.max(.0001, preferenciasAjustes.volumen / 100 * .055), ahora + .008);
    ganancia.gain.exponentialRampToValueAtTime(.0001, ahora + .09);
    oscilador.connect(ganancia);
    ganancia.connect(contextoSonido.destination);
    oscilador.start(ahora);
    oscilador.stop(ahora + .1);
  } catch { /* Un dispositivo sin salida de audio conserva el resto de ajustes. */ }
}

function inicializarAjustes() {
  preferenciasAjustes = cargarPreferenciasAjustes();
  aplicarPreferenciasAjustes();
  for (const contenedor of [document.body, panel]) {
    const capa = nodo('div', 'screen-dimming');
    capa.setAttribute('aria-hidden', 'true');
    contenedor.append(capa);
  }
  const reposo = nodo('div', 'idle-screen');
  reposo.id = 'idle-screen';
  reposo.hidden = true;
  reposo.append(icono('moon'), nodo('p', '', 'Pulsa cualquier botón para continuar'));
  document.body.append(reposo);
  const despertar = () => {
    ultimoUsoInterfaz = Date.now();
    reposo.hidden = true;
  };
  for (const evento of ['pointerdown', 'pointermove', 'keydown', 'touchstart']) {
    document.addEventListener(evento, despertar, { passive: true });
  }
  setInterval(() => {
    const minutos = preferenciasAjustes.reposo;
    if (minutos && !panel.open && Date.now() - ultimoUsoInterfaz >= minutos * 60000) reposo.hidden = false;
  }, 1000);
  document.addEventListener('click', event => {
    if (event.target.closest('button, input[type="checkbox"], select')) sonidoInterfaz();
  });
  for (const evento of ['online', 'offline']) {
    window.addEventListener(evento, () => {
      notificar(navigator.onLine ? 'Conexión a Internet restablecida' : 'Sin conexión a Internet');
      if (panel.open && panel.dataset.view === 'ajustes' && categoriaAjustesActual === 'red') abrirAjustes('red');
    });
  }
  for (const evento of ['gamepadconnected', 'gamepaddisconnected']) {
    window.addEventListener(evento, () => {
      if (panel.open && panel.dataset.view === 'ajustes' && categoriaAjustesActual === 'accesorios') abrirAjustes('accesorios');
    });
  }
  panel.addEventListener('cancel', event => {
    if (panel.dataset.view === 'ajustes' && categoriaAjustesActual) {
      event.preventDefault();
      abrirAjustes();
    }
  });
  document.addEventListener('keydown', tecladoAjustes);
}

function tecladoAjustes(event) {
  if (!panel.open || panel.dataset.view !== 'ajustes' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  const objetivo = event.target;
  if (objetivo.matches('input, select, textarea')) return;
  const categoria = objetivo.closest('[data-settings-category]');
  if (categoria && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    const botones = [...panel.querySelectorAll('[data-settings-category]')];
    const indice = botones.indexOf(categoria);
    const siguiente = botones[(indice + (event.key === 'ArrowUp' ? -1 : 1) + botones.length) % botones.length];
    siguiente.focus();
    siguiente.scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'ArrowRight' && categoria) {
    event.preventDefault();
    categoria.click();
    panel.querySelector('.settings-content input:not(:disabled), .settings-content select:not(:disabled), .settings-content button:not(:disabled), .settings-content a[href]')?.focus();
  } else if (['ArrowUp', 'ArrowDown'].includes(event.key) && objetivo.closest('.settings-content')) {
    const controles = [...panel.querySelectorAll('.settings-content button, .settings-content a[href], .settings-content input, .settings-content select, .settings-content textarea')]
      .filter(control => !control.disabled && control.getClientRects().length > 0);
    const indice = controles.indexOf(objetivo);
    if (indice >= 0 && controles.length) {
      event.preventDefault();
      const siguiente = controles[(indice + (event.key === 'ArrowUp' ? -1 : 1) + controles.length) % controles.length];
      siguiente.focus();
      siguiente.scrollIntoView({ block: 'nearest' });
    }
  } else if (event.key === 'ArrowLeft' && categoriaAjustesActual) {
    event.preventDefault();
    abrirAjustes();
  }
}

function abrirAjustes(categoria = '') {
  if (typeof categoria !== 'string' || !categoriasAjustes.some(item => item.id === categoria)) categoria = '';
  categoriaAjustesActual = categoria;
  abrirPanel('ajustes', 'Ajustes');
  const superior = nodo('div', 'settings-toolbar');
  const volver = boton('', 'settings-back', () => categoriaAjustesActual ? abrirAjustes() : panel.close());
  volver.dataset.settingsBack = '';
  volver.setAttribute('aria-label', categoria ? 'Volver a Ajustes' : 'Volver al inicio');
  volver.append(icono('left'), nodo('span', '', categoria ? 'Ajustes' : 'Volver al inicio'));
  superior.append(volver, nodo('span', 'settings-caption', 'Personaliza tu experiencia'));
  panelBody.append(superior);
  const estructura = nodo('div', 'settings-layout' + (categoria ? ' has-category' : ''));
  const nav = nodo('nav', 'settings-nav');
  nav.setAttribute('aria-label', 'Categorías de ajustes');
  for (const item of categoriasAjustes) {
    const opcion = boton('', 'settings-category', () => abrirAjustes(item.id));
    opcion.dataset.settingsCategory = item.id;
    opcion.setAttribute('aria-current', String(item.id === categoria));
    opcion.append(icono(item.icono), nodo('span', '', item.nombre), icono('right', 'settings-chevron'));
    nav.append(opcion);
  }
  const contenido = nodo('section', 'settings-content');
  contenido.setAttribute('aria-label', categoria ? categoriasAjustes.find(item => item.id === categoria).nombre : 'Resumen de ajustes');
  estructura.append(nav, contenido);
  panelBody.append(estructura);
  if (!categoria) resumenAjustes(contenido);
  else {
    const item = categoriasAjustes.find(opcion => opcion.id === categoria);
    const cabecera = nodo('div', 'settings-section-heading');
    cabecera.append(nodo('h3', '', item.nombre), nodo('p', '', item.detalle));
    contenido.append(cabecera);
    renderizarCategoriaAjustes(categoria, contenido);
  }
  const pie = nodo('div', 'settings-footer');
  pie.append(nodo('span', '', '✕ Seleccionar'), nodo('span', '', '○ / Esc Atrás'), nodo('span', '', '↑ ↓ Navegar'));
  panelBody.append(pie);
  const esDetalleMovil = categoria && matchMedia('(max-width: 650px)').matches;
  const destino = esDetalleMovil
    ? panel.querySelector('.settings-content input:not(:disabled), .settings-content select:not(:disabled), .settings-content button:not(:disabled), .settings-content a[href]') || volver
    : panel.querySelector(categoria ? '[data-settings-category="' + categoria + '"]' : '[data-settings-category]');
  destino?.focus({ preventScroll: true });
}

function resumenAjustes(contenido) {
  const bienvenida = nodo('div', 'settings-welcome');
  bienvenida.append(icono('settings'), nodo('span', 'settings-eyebrow', 'TU CONSOLA, A TU MANERA'), nodo('h3', '', 'Hazla tuya.'), nodo('p', '', 'Ajusta la imagen, el sonido y los controles. Tus preferencias se guardan en este navegador.'));
  const resumen = nodo('div', 'settings-summary');
  const datos = typeof leerColeccion === 'function' ? leerColeccion() : {};
  const perfil = boton('', 'settings-summary-card', () => abrirAjustes('usuarios'));
  perfil.append(icono('user'), nodo('small', '', 'Perfil local'), nodo('strong', '', datos.nombre || 'Jugador local'));
  const conexion = boton('', 'settings-summary-card', () => abrirAjustes('red'));
  conexion.append(icono('network'), nodo('small', '', 'Red'), nodo('strong', '', navigator.onLine ? 'Conectado' : 'Sin conexión'));
  resumen.append(perfil, conexion);
  bienvenida.append(resumen);
  contenido.append(bienvenida);
}

function filaAjuste(titulo, descripcion, control) {
  const fila = nodo('div', 'ps-setting-row');
  const texto = nodo('div', 'ps-setting-copy');
  const nombre = nodo(control ? 'label' : 'strong', 'ps-setting-label', titulo);
  if (control) {
    if (!control.id) control.id = 'setting-' + (control.dataset.setting || Math.random().toString(36).slice(2));
    nombre.htmlFor = control.id;
    control.setAttribute('aria-label', titulo);
  }
  texto.append(nombre);
  if (descripcion) texto.append(nodo('small', '', descripcion));
  fila.append(texto);
  if (control) fila.append(control);
  return fila;
}

function interruptorAjuste(titulo, clave, descripcion, cambio) {
  const control = nodo('input', 'ps-switch');
  control.type = 'checkbox';
  control.dataset.setting = clave;
  control.setAttribute('role', 'switch');
  control.checked = Boolean(preferenciasAjustes[clave]);
  control.setAttribute('aria-checked', String(control.checked));
  control.addEventListener('change', () => {
    preferenciasAjustes[clave] = control.checked;
    control.setAttribute('aria-checked', String(control.checked));
    guardarAjustes();
    aplicarPreferenciasAjustes();
    if (cambio) cambio(control.checked);
  });
  return filaAjuste(titulo, descripcion, control);
}

function selectorAjuste(titulo, clave, opciones, descripcion, cambio, idControl) {
  const control = nodo('select', 'ps-select');
  control.dataset.setting = idControl || clave;
  for (const [valor, texto] of opciones) {
    const opcion = nodo('option', '', texto);
    opcion.value = String(valor);
    control.append(opcion);
  }
  control.value = String(preferenciasAjustes[clave]);
  control.addEventListener('change', () => {
    preferenciasAjustes[clave] = clave === 'reposo' ? Number(control.value) : control.value;
    guardarAjustes();
    aplicarPreferenciasAjustes();
    if (cambio) cambio(control.value);
  });
  return filaAjuste(titulo, descripcion, control);
}

function deslizadorAjuste(titulo, clave, minimo, maximo, descripcion) {
  const control = nodo('input', 'ps-range');
  control.type = 'range';
  control.min = String(minimo);
  control.max = String(maximo);
  control.step = '1';
  control.value = String(preferenciasAjustes[clave]);
  control.dataset.setting = clave;
  const fila = filaAjuste(titulo, descripcion, control);
  const valor = nodo('output', 'ps-setting-value', control.value + '%');
  valor.htmlFor = control.id;
  fila.append(valor);
  control.addEventListener('input', () => {
    preferenciasAjustes[clave] = Number(control.value);
    valor.textContent = control.value + '%';
    guardarAjustes();
    aplicarPreferenciasAjustes();
  });
  return fila;
}

function datoAjuste(titulo, valor, descripcion) {
  const fila = filaAjuste(titulo, descripcion);
  fila.append(nodo('span', 'ps-data-value', valor));
  return fila;
}

function notaAjuste(contenedor, texto) {
  const nota = nodo('p', 'settings-note');
  nota.append(icono('info'), nodo('span', '', texto));
  contenedor.append(nota);
}

function accionAjuste(contenedor, titulo, icon, accion) {
  const control = filaMenu(titulo, icon, accion);
  control.classList.add('settings-action');
  contenedor.append(control);
  return control;
}

function renderizarCategoriaAjustes(categoria, contenido) {
  switch (categoria) {
    case 'accesibilidad': {
      contenido.append(interruptorAjuste('Contraste alto', 'contraste', 'Fondos oscuros y bordes más visibles.'));
      contenido.append(selectorAjuste('Tamaño del texto', 'texto', [['normal', 'Normal'], ['grande', 'Grande'], ['muy-grande', 'Muy grande']], 'Aumenta el texto de los paneles y las listas.'));
      const movimiento = nodo('input', 'ps-switch');
      movimiento.type = 'checkbox';
      movimiento.dataset.setting = 'movimiento';
      movimiento.setAttribute('role', 'switch');
      const movimientoSistema = matchMedia('(prefers-reduced-motion: reduce)').matches;
      movimiento.checked = reducido || movimientoSistema;
      movimiento.disabled = movimientoSistema;
      movimiento.setAttribute('aria-checked', String(movimiento.checked));
      movimiento.addEventListener('change', () => {
        reducido = movimiento.checked;
        guardar('movimiento', reducido ? 'reducido' : 'normal');
        movimiento.setAttribute('aria-checked', String(reducido));
        aplicarPreferenciasAjustes();
      });
      contenido.append(filaAjuste('Reducir movimiento', movimientoSistema ? 'Activado por la preferencia de accesibilidad de tu dispositivo.' : 'Reduce las transiciones y las animaciones del menú.', movimiento));
      const muestra = nodo('div', 'settings-text-preview');
      muestra.append(nodo('strong', '', 'Vista previa del texto'), nodo('p', '', 'Elige la configuración con la que te resulte más cómodo explorar tus juegos.'));
      contenido.append(muestra);
      break;
    }
    case 'red': {
      contenido.append(datoAjuste('Conexión a Internet', navigator.onLine ? 'Conectado' : 'Sin conexión', 'Estado de conexión que informa tu navegador.'));
      contenido.append(datoAjuste('PlayStation Network', 'No vinculado', 'Esta recreación utiliza un perfil local.'));
      accionAjuste(contenido, 'Comprobar estado de conexión', 'network', () => {
        abrirAjustes('red');
        notificar(navigator.onLine ? 'El navegador informa que hay conexión a Internet' : 'El navegador informa que no hay conexión', true);
      });
      notaAjuste(contenido, 'El Wi-Fi, el cable de red y las credenciales se configuran en tu dispositivo. El menú y las imágenes descargadas funcionan sin conexión.');
      break;
    }
    case 'usuarios': {
      const datos = typeof leerColeccion === 'function' ? leerColeccion() : {};
      const perfil = nodo('div', 'settings-user-card');
      perfil.append(nodo('span', 'avatar avatar-' + avatarActual), nodo('div', '', datos.nombre || 'Jugador local'));
      contenido.append(perfil, datoAjuste('Tipo de perfil', 'Local', 'Las preferencias se guardan solo en este navegador.'));
      accionAjuste(contenido, 'Editar perfil y avatar', 'user', abrirPerfil);
      notaAjuste(contenido, 'No se solicitan contraseñas ni se inicia sesión en PlayStation Network.');
      break;
    }
    case 'familia': {
      contenido.append(datoAjuste('Perfil activo', 'Perfil local'), datoAjuste('Controles de cuenta PlayStation', 'En tu consola o en la web de PlayStation'));
      accionAjuste(contenido, 'Revisar juegos de la biblioteca', 'grid', abrirBiblioteca);
      const enlace = nodo('a', 'settings-external-link', 'Consultar el control parental de PlayStation ↗');
      enlace.href = 'https://www.playstation.com/es-es/support/account/ps5-parental-controls-spending-limits/';
      enlace.target = '_blank';
      enlace.rel = 'noopener noreferrer';
      contenido.append(enlace);
      notaAjuste(contenido, 'Este menú no administra cuentas infantiles, compras ni límites de una consola. Los controles familiares reales se gestionan con PlayStation.');
      break;
    }
    case 'sistema': {
      const reloj = nodo('select', 'ps-select');
      reloj.dataset.setting = 'hora';
      for (const [valor, texto] of [['24', '24 horas'], ['12', '12 horas']]) {
        const opcion = nodo('option', '', texto);
        opcion.value = valor;
        reloj.append(opcion);
      }
      reloj.value = doceHoras ? '12' : '24';
      reloj.addEventListener('change', () => {
        doceHoras = reloj.value === '12';
        guardar('hora', reloj.value);
        actualizarTiempo();
      });
      contenido.append(filaAjuste('Formato de hora', 'Se aplica al reloj del inicio.', reloj));
      contenido.append(datoAjuste('Fecha y hora', new Date().toLocaleString('es-EC'), 'Sincronizadas con el reloj del dispositivo.'));
      let zona = 'Hora local';
      try { zona = Intl.DateTimeFormat().resolvedOptions().timeZone || zona; } catch {}
      contenido.append(datoAjuste('Zona horaria', zona), datoAjuste('Idioma de la interfaz', 'Español'));
      contenido.append(selectorAjuste('Atenuar por inactividad', 'reposo', [[0, 'No atenuar'], [5, '5 minutos'], [15, '15 minutos'], [30, '30 minutos']], 'Oscurece el inicio hasta que vuelvas a usar el ratón o el teclado. No suspende el dispositivo.'));
      accionAjuste(contenido, 'Ajustar cuenta regresiva de GTA VI', 'clock', abrirContador);
      break;
    }
    case 'almacenamiento': {
      const local = nodo('div');
      let bytes = 0;
      try {
        for (let indice = 0; indice < localStorage.length; indice++) {
          const clave = localStorage.key(indice);
          if (clave?.startsWith('vice-console.')) bytes += (clave.length + (localStorage.getItem(clave) || '').length) * 2;
        }
        local.append(datoAjuste('Preferencias y perfil', formatearBytesAjustes(bytes), 'Tamaño aproximado de los datos locales de este menú.'));
      } catch {
        local.append(datoAjuste('Almacenamiento local', 'No disponible', 'Tus cambios se mantienen durante esta sesión.'));
      }
      contenido.append(local);
      const estimacion = nodo('div');
      contenido.append(estimacion);
      if (navigator.storage?.estimate) {
        navigator.storage.estimate().then(datos => {
          if (!estimacion.isConnected) return;
          estimacion.append(datoAjuste('Uso del sitio en este navegador', formatearBytesAjustes(datos.usage || 0)));
          if (datos.quota) estimacion.append(datoAjuste('Cuota disponible para el sitio', formatearBytesAjustes(datos.quota), 'La cuota la asigna el navegador y puede cambiar.'));
        }).catch(() => {
          if (estimacion.isConnected) estimacion.append(datoAjuste('Estimación del navegador', 'No disponible'));
        });
      }
      accionAjuste(contenido, 'Ver biblioteca de juegos', 'grid', abrirBiblioteca);
      notaAjuste(contenido, 'Las portadas son archivos del proyecto. Esta pantalla no representa el SSD de una PS5 ni el espacio ocupado por juegos instalados.');
      break;
    }
    case 'sonido': {
      contenido.append(deslizadorAjuste('Volumen de los efectos', 'volumen', 0, 100, 'Volumen de los sonidos de navegación de este menú.'));
      contenido.append(interruptorAjuste('Efectos de sonido', 'efectos', 'Reproduce un tono suave al seleccionar botones.'));
      const probar = accionAjuste(contenido, 'Probar sonido del menú', 'speaker', () => {
        if (!preferenciasAjustes.efectos || preferenciasAjustes.volumen === 0) notificar('Activa los efectos y sube el volumen para escucharlos', true);
        else sonidoInterfaz();
      });
      probar.dataset.soundTest = '';
      notaAjuste(contenido, 'La salida HDMI, los auriculares y el volumen del dispositivo se controlan desde sus propios ajustes.');
      break;
    }
    case 'pantalla': {
      contenido.append(deslizadorAjuste('Brillo del menú', 'brillo', 40, 100, 'Atenúa esta interfaz sin modificar el brillo de tu pantalla.'));
      contenido.append(datoAjuste('Área de visualización', window.innerWidth + ' × ' + window.innerHeight, 'Píxeles disponibles para el menú en esta ventana.'));
      contenido.append(datoAjuste('Densidad de pantalla', (window.devicePixelRatio || 1) + '×'));
      if (document.fullscreenEnabled) accionAjuste(contenido, etiquetaPantalla(), 'screen', pantallaCompleta);
      notaAjuste(contenido, 'El menú se adapta automáticamente a la ventana. La resolución HDMI, HDR y la frecuencia de refresco dependen de tu pantalla y de tu dispositivo.');
      break;
    }
    case 'accesorios': {
      let mandos = [];
      try { mandos = [...(navigator.getGamepads?.() || [])].filter(Boolean); } catch {}
      contenido.append(datoAjuste('Mandos conectados', String(mandos.length), 'Conecta un mando y pulsa un botón para que el navegador lo detecte.'));
      for (const mando of mandos) {
        contenido.append(datoAjuste(mando.id, mando.connected ? 'Conectado' : 'Desconectado'));
        if (mando.vibrationActuator?.playEffect) {
          accionAjuste(contenido, 'Probar vibración del mando', 'controller', async () => {
            try {
              await mando.vibrationActuator.playEffect('dual-rumble', { duration: 220, strongMagnitude: .3, weakMagnitude: .2 });
              notificar('Prueba de vibración enviada');
            } catch { notificar('Este navegador no permite la vibración del mando', true); }
          });
        }
      }
      const teclas = nodo('div', 'settings-key-guide');
      for (const [tecla, accion] of [['← →', 'Cambiar juego'], ['↑ ↓', 'Mover el foco'], ['Enter', 'Seleccionar'], ['Esc', 'Volver'], ['/', 'Buscar']]) {
        const fila = nodo('div');
        fila.append(nodo('kbd', '', tecla), nodo('span', '', accion));
        teclas.append(fila);
      }
      contenido.append(nodo('h4', '', 'Teclado'), teclas);
      notaAjuste(contenido, 'La conexión Bluetooth y las actualizaciones del mando se gestionan desde tu dispositivo.');
      break;
    }
    case 'datos': {
      const datos = typeof leerColeccion === 'function' ? leerColeccion() : {};
      contenido.append(datoAjuste('Juegos favoritos', String(datos.favoritos?.length || 0)), datoAjuste('Juegos ocultos en la biblioteca', String(datos.ocultos?.length || 0)), datoAjuste('Juegos recientes', String(datos.recientes?.length || 0)));
      accionAjuste(contenido, 'Gestionar biblioteca de juegos', 'grid', abrirBiblioteca);
      accionAjuste(contenido, 'Cambiar cuenta regresiva de GTA VI', 'clock', abrirContador);
      notaAjuste(contenido, 'Se guardan las preferencias de la colección. Esta interfaz no contiene partidas de los juegos ni sincronización en la nube de PlayStation Plus.');
      break;
    }
    case 'notificaciones': {
      let prueba;
      contenido.append(interruptorAjuste('Permitir notificaciones emergentes', 'notificaciones', 'Muestra avisos de las acciones y de la conexión.', activa => { prueba.disabled = !activa; }));
      prueba = accionAjuste(contenido, 'Mostrar una notificación de prueba', 'bell', () => notificar('Todo listo. Disfruta de tus juegos.'));
      prueba.disabled = !preferenciasAjustes.notificaciones;
      notaAjuste(contenido, 'Los avisos aparecen dentro del menú. No se solicitan permisos para enviarte notificaciones fuera de esta página.');
      break;
    }
    case 'capturas': {
      contenido.append(selectorAjuste('Formato de descarga de imágenes', 'formatoCapturas', [['png', 'PNG'], ['jpeg', 'JPEG']], 'Formato utilizado al descargar las imágenes de la galería.', null, 'capturas-formato'));
      accionAjuste(contenido, 'Abrir galería multimedia', 'photo', abrirGaleria);
      if (typeof abrirCapturas === 'function') accionAjuste(contenido, 'Ver capturas guardadas', 'capture', abrirCapturas);
      contenido.append(datoAjuste('Transmisiones', 'No vinculadas'));
      notaAjuste(contenido, 'Puedes guardar y descargar el arte de la galería. Para capturar vídeo o transmitir partidas necesitas una consola o una aplicación de grabación.');
      break;
    }
  }
}

function formatearBytesAjustes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return (bytes / 1024).toLocaleString('es-EC', { maximumFractionDigits: 1 }) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toLocaleString('es-EC', { maximumFractionDigits: 1 }) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toLocaleString('es-EC', { maximumFractionDigits: 1 }) + ' GB';
}
