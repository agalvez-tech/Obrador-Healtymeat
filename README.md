# HealthyMeat · Obrador

App con todo el flujo desde que entra un pedido hasta que llega al cliente,
más el registro de producción del obrador. Dos modos de acceso:

- **Oficina**: cuatro pestañas — Pedidos, Producción, Reparto, Clientes.
- **Repartidor**: desde su propio móvil, ve la ruta del día ya ordenada, su
  GPS en el mapa, y firma cada entrega con el dedo.

Todo se guarda en una base de datos compartida (Upstash Redis), así que
oficina y repartidor ven lo mismo en tiempo real desde dispositivos distintos.

## Pestaña Pedidos

1. **"+ Subir pedido"**: eliges qué cliente lo ha hecho (de tu lista de
   clientes) y pegas el pedido — como texto, como imagen o como PDF, lo que
   tengas a mano.
   - **Si es un PDF con una tabla de productos** (como los que genera
     gstock), la app intenta desglosarlo sola: detecta cada línea de
     producto y cantidad, y la cruza contra tu catálogo de productos. Lo que
     reconoce con confianza lo rellena automáticamente; lo que no, lo deja
     con el desplegable vacío para que la persona elija el producto a mano.
     Esto es aproximado por diseño — nombres como "hamburguesa" vs "burger"
     se reconocen, pero cuanto más distinto sea el texto del PDF del nombre
     real del producto, más líneas tocará rellenar a mano. Siempre se puede
     añadir o quitar líneas con "+ Añadir línea de producto" / 🗑.
   - Si es texto pegado o una imagen, no hay desglose automático (no leo
     imágenes): se guarda tal cual y se añade una línea en blanco para
     rellenar a mano.
2. Al subirlo, la app calcula sola el próximo día de reparto de ese cliente
   (según los "días habituales" que tenga guardados) y el pedido entra en
   **"En producción"** — y ya aparece en la pestaña Reparto de ese día,
   aunque todavía no esté preparado.
3. Quien prepara el pedido revisa cada línea (**producto**, **cantidad**,
   **lote**) y pulsa **"OK montado"** cuando todas las líneas están
   completas — el lote no se rellena solo, hay que escribirlo a mano; si
   falta en alguna línea, el botón "OK montado" se queda desactivado.
4. En "OK montado" aparece un botón **"+ Subir albarán y pasar a OK
   albarán"** — se puede hacer aquí mismo, en Pedidos, sin ir a la pestaña
   Reparto (aunque también se puede subir desde allí, funciona igual). En
   cuanto se adjunta el PDF, el pedido pasa solo a **"OK albarán"**. Así se
   puede ver de un vistazo, filtrando por la pestaña "OK montado", a qué
   pedidos les falta subir el albarán todavía.
5. Si el cliente es de **reparto propio**, ese pedido sigue viéndose en la
   pestaña Reparto del día que le toque. Si es de **agencia de envío**, se
   queda terminado en "OK montado" — no necesita albarán ni pasar por
   Reparto, ya que la agencia se encarga del envío por su cuenta.
6. Los pedidos de "En producción", "OK montado" y "OK albarán" aparecen
   plegados, mostrando solo el cliente y un resumen — toca la cabecera de
   cada uno para desplegarlo y ver/editar sus líneas.
7. **Nº de pedido**: si el PDF trae una referencia tipo "Pedido de compra Nº
   P-4-2026/000324", se detecta sola y se guarda; si no la detecta, o no es
   un PDF, el campo queda vacío y se puede escribir a mano — nunca es
   obligatorio. El **Nº de albarán** funciona igual pero se rellena siempre
   a mano, junto al PDF adjunto.
8. Las líneas de producto se pueden **reordenar con ▲▼** (junto al
   desplegable de cada línea) para que salgan en el orden que quieras.

### Alias de productos

Si el texto del pedido no se parece nada al nombre del producto en tu
catálogo (por ejemplo, "pollo empanado crunchy" → "Pollo Voltereta"), se
puede forzar la coincidencia añadiendo una entrada a `ALIAS_FRASE` en
`src/utils/pdfOrderParser.js`. Ya dejé metido ese caso; si aparecen más
así, dímelos y los añado igual.

## Pestaña Producción

Registro diario de lo que va sacando el obrador: fecha, producto (de una
lista desplegable), lote y cantidad (kg o unidades). El **lote se escribe a
mano** (no se autocompleta) y es obligatorio — sin él no se puede guardar el
registro. De momento este registro es solo un archivo/listado — no está
conectado con Pedidos ni con el stock.

**El desplegable viene con tus 33 productos ya cargados**, con su formato de
envasado (bandeja, caja, bolsa, al peso) — al elegir uno, la unidad
(kg/uds) se autocompleta según el formato, aunque puedes cambiarla si hace
falta. Añade o quita productos con "Gestionar productos".

## Pestaña Reparto

**Aquí aparecen todos los pedidos de reparto propio del día que elijas, desde
el momento en que entran** — estén o no preparados todavía. La idea es que
puedas organizar la ruta con antelación sin depender de que ya estén listos.
Cada uno muestra en qué punto está:

- **En producción** — el pedido ha entrado pero todavía no le han puesto
  "OK montado" en la pestaña Pedidos.
- **OK montado** — ya está preparado (lote y cantidad de cada línea
  puestos), pero todavía no se ha incluido en una ruta guardada.
- **En ruta — pendiente de albarán** — ya está dentro de una ruta guardada,
  pero le falta el PDF del albarán (se puede subir desde aquí o desde
  Pedidos).
- **OK albarán, pendiente de reparto** — ya tiene el albarán, pero todavía
  no se ha incluido en una ruta guardada.
- **OK reparto — con albarán** — todo listo: incluido en la ruta y con
  albarán, solo falta que el repartidor lo entregue y lo firmen.
- **✓ Enviado y firmado** — entregado, con la firma ya archivada.

Todos vienen marcados por defecto para la ruta — desmarca los que no toquen
todavía si quieres dejarlos para otro día.

1. **Punto de partida**: viene precargado con **Carrer Emperador 15,
   Museros** (vuestro almacén), así que no hace falta escribirlo cada vez.
   Si alguna vez cambia, se edita con "Cambiar".
2. Por cada pedido puedes **"+ Añadir albarán (PDF)"** en cualquier momento
   — no hace falta esperar a que esté "OK montado" (aunque si no lo está,
   este mismo botón existe también en Pedidos). Justo debajo hay un campo
   opcional para el **Nº de albarán** (la referencia del propio albarán, no
   la del pedido), que se ve luego desde Pedidos y desde el móvil del
   repartidor.
3. **"Optimizar y guardar ruta"**: calcula el orden más corto por carretera
   con los pedidos marcados (aunque no estén preparados todavía) y lo manda
   al móvil del repartidor. El estado de cada pedido sigue subiendo solo a
   medida que se completan los pasos (montado, albarán, entregado), sin
   tener que rehacer la ruta cada vez.
4. Aquí mismo ves cuántos van entregados, actualizado solo cada 12 segundos.

## Pestaña Clientes

Los mismos clientes de siempre, con un campo nuevo: **tipo de entrega**
("Reparto propio" o "Agencia de envío"). Los de agencia no necesitan
dirección ni días/horario, ya que no entran en la ruta.

**Ya están precargados los 36 de reparto propio + 18 de agencia** que me
pasaste. 4 de los 36 llevan un aviso (⚠) en "Notas" porque su ubicación en
el mapa es aproximada — repásalos cuando puedas:
- **BEGIN ALAMEDA** (calle confirmada, número 47 sin verificar)
- **BOTAPA** y **CATAMARAN** (zona correcta, no el edificio exacto)
- **NOE / KEKU CERVECERIA** (no localizada; el pin es solo el centro de Alcàsser)

## Ver toda la semana (modo Repartidor)

Justo debajo de la cabecera hay una fila con los 7 días de la semana (L a D).
Cada día muestra cuántos pedidos tiene programados y cuántos van entregados
(por ejemplo "3/5"), y se pone en verde cuando están todos entregados — así
se ve de un vistazo cómo se va llenando la semana a medida que oficina
planifica rutas. Con ‹ › se cambia de semana, y "Hoy" vuelve al día actual.

Solo se puede marcar como entregado o firmar en el día de **hoy**; al mirar
otro día (pasado o futuro) las paradas se ven en modo consulta, con una
etiqueta de "Entregado" o "Pendiente" en vez de los botones de acción.

## Cómo llegar a cada parada (modo Repartidor)

Cada parada tiene ahora un enlace **"🧭 Cómo llegar (Google Maps)"** justo
debajo de la dirección. Al tocarlo, se abre Google Maps (la app si está
instalada en el móvil, o la web si no) con la navegación real hasta ese
punto — con tráfico, voz, todo lo de Google Maps normal. El mapa propio de
la app sigue estando para ver de un vistazo toda la ruta y tu posición, pero
para que te lleve paso a paso usa este enlace.

## Cómo firma el cliente el albarán (modo Repartidor)

Si el pedido tiene un albarán PDF adjunto, la parada muestra **"Firmar y
entregar"** en vez de "Marcar entregado". Al pulsarlo, el cliente firma con
el dedo directamente en la pantalla; la firma se incrusta automáticamente en
el PDF del albarán y se archiva junto al pedido. En ese momento el pedido
pasa a **"Enviado"** y se puede consultar el albarán firmado desde la
pestaña Pedidos en cualquier momento (enlace "📄 Ver albarán").

Si un pedido no tiene albarán adjunto, el repartidor puede igualmente
"Marcar entregado" sin firma, para no bloquear la ruta por un olvido de
oficina.

## La primera vez que se abre en un dispositivo

Al entrar por primera vez, la app pregunta "¿Cómo vas a usar este
dispositivo?": **Oficina** o **Repartidor**. Se recuerda en ese dispositivo;
se cambia luego con "Cambiar modo" en la cabecera.

## Añadir a la pantalla de inicio del móvil (recomendado)

- **Android (Chrome):** abre la app → menú (⋮) → "Añadir a pantalla de inicio".
- **iPhone (Safari):** abre la app → botón compartir → "Añadir a pantalla de inicio".

## Desplegar en Vercel

1. Crea un repositorio en GitHub (por ejemplo `healthymeat-reparto`) y sube el
   contenido de esta carpeta (todo excepto `node_modules`).
2. En [vercel.com](https://vercel.com), "Add New… → Project" e importa ese
   repositorio. Vercel detecta Vite y despliega también las funciones de la
   carpeta `api/` automáticamente.
3. Añade estas dos variables de entorno (Settings → Environment Variables):
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

   Puedes reutilizar las mismas de la app de fichajes — todo se guarda bajo
   claves que empiezan por `reparto:`, sin pisar nada de fichajes.
4. Deploy (o redeploy si añadiste las variables después).

## Notas técnicas y limitaciones a tener en cuenta

- **Mapa y geocodificación**: OpenStreetMap + Nominatim, gratuitos.
- **Optimización de ruta**: OSRM público (gratuito, por carretera real). Si
  no responde, se usa distancia en línea recta como alternativa automática.
- **Albaranes y firmas**: se guardan como PDF/imagen dentro de la propia base
  de datos (Upstash Redis), sin necesidad de un servicio de almacenamiento
  aparte. Esto es sencillo pero tiene un límite práctico: evita subir
  albaranes en PDF muy pesados (escaneados a alta resolución, muchas
  páginas) — con un PDF de una página tipo albarán normal no hay problema,
  pero archivos de varios MB podrían fallar al subir por límites del propio
  Vercel. Si con el tiempo esto da problemas, se puede migrar a un servicio
  de almacenamiento de archivos (p. ej. Vercel Blob) sin tocar el resto de
  la app.
- **Catálogo de productos**: precargado con los 33 que me pasaste; se
  gestiona (añadir/quitar) desde la pestaña Producción.
- **Pedidos y producción no están conectados con stock**: de momento son
  solo un registro/archivo, tal como se pidió.
- **Ver PDFs e imágenes subidos**: se abren en pestaña nueva convirtiéndolos
  en un archivo real en el momento de pulsar el enlace (Chrome bloquea abrir
  directamente un PDF guardado como texto/base64, y se quedaba en blanco).
