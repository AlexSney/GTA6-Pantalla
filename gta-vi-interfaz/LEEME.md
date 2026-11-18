# Menú de consola · GTA VI

Una recreación interactiva del inicio y los ajustes de PS5, hecha con HTML, CSS y JavaScript. Al abrirla, Grand Theft Auto VI aparece seleccionado frente a la bahía de Vice City. Incluye NieR:Automata, biblioteca, perfil local, galería y centro de control.

## Abrir el proyecto

1. Descomprime el ZIP.
2. En VS Code, ve a **Archivo → Abrir carpeta** y selecciona la carpeta que contiene `index.html`.
3. En **Ejecutar y depurar**, elige **Menú GTA VI en Chrome** o **Menú GTA VI en Edge**, según el navegador que tengas instalado. Pulsa **F5**.

También puedes abrir `index.html` con doble clic desde el explorador de archivos. Las imágenes y el código están en la carpeta del proyecto, así que el menú funciona sin conexión.

## Usar el menú

| Control | Acción |
| --- | --- |
| Clic en una portada | Seleccionarla y cambiar el fondo |
| Clic en la portada seleccionada o **Enter** | Abrir su contador, ficha o colección |
| **←** y **→** en el carrusel | Cambiar de título |
| **↑**, **↓** o **Tab** | Mover el foco entre controles |
| Deslizar el carrusel en una pantalla táctil | Recorrer las portadas |
| Lupa o **/** | Buscar un juego o una aplicación |
| **Esc** | Cerrar el panel abierto |
| **⋯** | Ver las opciones del título |
| **P** o botón **Centro de control** | Abrir los accesos rápidos |
| Flecha **→** sobre una categoría de Ajustes | Entrar en sus controles |
| **Esc** en una categoría de Ajustes | Volver a la lista de categorías |
| Mando compatible, distribución estándar | Cruceta o joystick para navegar, ✕ para seleccionar, ◯ para volver y botón PS para el centro de control, si el navegador lo permite |

El contador de GTA VI termina el **19 de noviembre de 2026 a las 00:00 de la hora local del navegador**. Pulsa el contador para ajustar la fecha y hora. **Usar fecha de lanzamiento** restaura esa fecha fija. La fecha de muestra guardada por versiones anteriores se sustituye al actualizar; las nuevas fechas personalizadas se conservan cuando el navegador permite el almacenamiento local, al igual que el avatar y el formato del reloj.

**Juegos** muestra el carrusel de inicio. **Contenido multimedia** reúne las ilustraciones y las imágenes guardadas. NieR:Automata ocupa el espacio del catálogo que se sustituyó y aparece como juego de PS4.

## Ajustes y apartados

El engranaje abre una pantalla completa con doce categorías: Accesibilidad, Red, Usuarios y cuentas, Familia y control parental, Sistema, Almacenamiento, Sonido, Pantalla y vídeo, Accesorios, Datos guardados y ajustes de juegos/aplicaciones, Notificaciones y Capturas y transmisiones.

Los controles de contraste, tamaño de texto, movimiento reducido, brillo del menú, efectos de sonido, volumen, formato horario, atenuación por inactividad, avisos y formato de descarga se aplican a la interfaz y se guardan en este navegador. Los sonidos empiezan desactivados. Red, almacenamiento y mandos muestran los datos que permite consultar el navegador.

- **Biblioteca:** busca por título o alias, filtra por PS4/PS5, ordena los juegos y consulta favoritos o títulos vistos recientemente. Los corazones añaden y quitan favoritos.
- **Perfil:** cambia el nombre, el avatar y el estado local. Los cambios también se ven en el botón de perfil del inicio.
- **Galería y capturas:** recorre las ilustraciones, guárdalas en Capturas y descárgalas como PNG o JPEG. Si el navegador bloquea la conversión al abrir el proyecto como archivo, se ofrece el archivo original.
- **Centro de control:** accesos a inicio, notificaciones, Game Base, galería, sonido, accesorios, perfil, ajustes y alimentación. El modo reposo pausa visualmente esta interfaz y puede reanudarse con su botón.
- **Game Base:** acceso al perfil y la colección; los amigos y grupos de PlayStation se gestionan en la consola.

Esta recreación no ejecuta juegos ni modifica el dispositivo. Las cuentas de PlayStation Network, los controles familiares de la consola, las partidas en la nube, HDMI y las transmisiones requieren los servicios o el hardware correspondientes. No solicita credenciales. Si el almacenamiento local está bloqueado, las preferencias siguen funcionando durante la sesión.

## Personalizar

| Archivo | Qué puedes cambiar |
| --- | --- |
| `catalogo.js` | Juegos, descripciones, imágenes, orden del carrusel y fecha de lanzamiento del contador |
| `estilos.css` | Tamaños, colores, sombras y distribución en ordenador o móvil |
| `interfaz.js` | Navegación, búsqueda, perfiles y cuenta regresiva |
| `consola.js` y `consola.css` | Biblioteca, favoritos, perfil, galería y centro de control |
| `ajustes.js` y `ajustes.css` | Categorías, preferencias y presentación de los ajustes |
| `index.html` | Estructura del menú e iconos de los controles |
| `assets/` | Imágenes que usa la interfaz |

## Imágenes

El fondo de Vice City es una ilustración recreada a partir de la foto de referencia. El logotipo de GTA VI se obtuvo de [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Grand_Theft_Auto_VI_logo_(with_gradient).svg).

Las portadas y los fondos de los demás títulos proceden de sus fichas en PlayStation Store.

- [Grand Theft Auto VI](https://store.playstation.com/en-us/product/EP1004-PPSA01547_00-GTAVISTANDARD001/)
- [Grand Theft Auto V](https://store.playstation.com/en-us/product/UP1004-PPSA03420_00-GTAVCROSSGENBUND/)
- [Cyberpunk 2077](https://store.playstation.com/en-us/concept/234567/)
- [Red Dead Redemption 2](https://store.playstation.com/en-us/product/UP1004-CUSA03041_00-REDEMPTIONFULL02)
- [Elden Ring](https://store.playstation.com/en-us/product/UP0700-PPSA04610_00-ELDENRING0000000)
- [Astro Bot](https://store.playstation.com/en-us/product/UP9000-PPSA21564_00-0000000000000000/)
- [Ratchet & Clank: Rift Apart](https://store.playstation.com/en-us/product/UP9000-PPSA01473_00-RATCHETCLANKRIFT)
- [Ghost of Tsushima](https://store.playstation.com/en-us/product/UP9000-PPSA02225_00-GHOSTDIRECTORPS5/)
- [NieR:Automata](https://store.playstation.com/en-us/concept/217551/) — portada y fondo oficiales de PlayStation Store.

La organización de los ajustes toma como referencia la documentación oficial de [accesibilidad de PS5](https://www.playstation.com/es-es/support/hardware/ps5-accessibility-settings/) y del [centro de control](https://www.playstation.com/es-es/support/games/customize-ps5-control-center/).
