# HealthyMeat · Obrador

App con todo el flujo desde que entra un pedido hasta que llega al cliente,
más el registro de producción y la trazabilidad del obrador. Tres modos de
acceso, elegidos la primera vez que se abre en cada dispositivo:

- **OBRADOR**: cinco pestañas — Pedidos, Producción, Reparto, Clientes, Exportar.
- **Repartidor**: desde su propio móvil, ve la ruta del día ya ordenada, su
  GPS en el mapa, y firma cada entrega con el dedo.
- **TRAZABILIDAD**: dos pestañas — Proveedores (entradas de materia prima) y
  Producción para trazabilidad (qué materias primas se usaron en cada
  producto fabricado).

Todo se guarda en una base de datos compartida (Upstash Redis), así que los
tres modos ven lo mismo en tiempo real desde dispositivos distintos.

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
   - Si el pedido **no lleva albarán** (a veces no hace falta), hay un
     enlace justo debajo: **"Pasar a OK albarán sin subir nada"** — avanza
     igual de estado, pero sin exigir ningún PDF. En la pestaña Reparto y en
     el móvil del repartidor se distingue claramente que ese pedido no tiene
     archivo adjunto.
5. Si el cliente es de **reparto propio**, ese pedido sigue viéndose en la
   pestaña Reparto del día que le toque. Si es de **agencia de envío**, no
   pasa por Reparto (la agencia se encarga del envío por su cuenta) — pero
   puede seguir el mismo camino de albarán si te interesa: subir el PDF, o
   pulsar "Pasar a OK albarán sin subir nada" si no lo necesita. Cuando la
   agencia recoja o confirme el envío, un botón **"OK enviado"** (aparece en
   cuanto el pedido está en "OK albarán") lo marca como terminado, sin
   necesidad de ninguna firma — eso solo aplica al reparto propio.
6. Los pedidos de "En producción", "OK montado" y "OK albarán" aparecen
   plegados, mostrando solo el cliente y un resumen — toca la cabecera de
   cada uno para desplegarlo y ver/editar sus líneas.
7. **Nº de pedido**: si el PDF trae una referencia tipo "Pedido de compra Nº
   P-4-2026/000324", se detecta sola y se guarda; si no la detecta, o no es
   un PDF, el campo queda vacío y se puede escribir a mano — nunca es
   obligatorio. El **Nº de albarán** funciona igual: se detecta solo al
   subir el PDF del albarán (por ejemplo "Albarán nº ALB2026-482"), y si no
   se detecta se puede escribir a mano.
8. Las líneas de producto se pueden **reordenar arrastrando el icono ⠿**
   (mantén pulsado y muévela hacia arriba o abajo) para que salgan en el
   orden que quieras.
9. **Productos que se miden en kg y en unidades a la vez** (como Solomillo,
   Chuletón, T-Bone, Pollo Voltereta...): al elegir uno de estos productos en
   una línea, aparece un botón **"+ Este producto también se mide en
   [kg/uds] — añadir línea"** justo debajo. Solo hace falta pulsarlo si ese
   pedido en concreto necesita el producto en los dos formatos; si no, con
   una línea basta.

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

**El desplegable viene con tus 34 productos ya cargados**, con su formato de
envasado (bandeja, caja, bolsa, al peso) y si se miden en kg, en unidades, o
en ambas — al elegir uno, la unidad se autocompleta según eso, aunque puedes
cambiarla si hace falta. Añade, quita o revisa productos con "Gestionar
productos" — ahí también hay un botón **"Actualizar formatos desde el
listado base"** por si en el futuro cambias qué productos se miden en kg,
en uds o en ambas: fusiona el listado base con lo que ya tienes guardado,
sin borrar productos que hayas añadido a mano.

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
todavía si quieres dejarlos para otro día. Los botones **"Marcar todos"** /
**"Desmarcar todos"** hacen el cambio de golpe, sin ir pedido por pedido.

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
4. **"Orden de la ruta"**: en cuanto hay una ruta guardada para el día,
   aparece esta lista aparte con el orden real de las paradas. Se puede
   **arrastrar cada una por el ⠿** para cambiarla de sitio manualmente — útil
   si hay algún cambio de última hora y prefieres decidir tú el orden en vez
   del calculado automáticamente. Se guarda solo, al momento, y se ve
   reflejado en el móvil del repartidor.
5. Aquí mismo ves cuántos van entregados, actualizado solo cada 12 segundos.

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

### Vista semanal (calendario)

Dentro de Clientes, la pestaña **"Vista semanal"** muestra un calendario de
7 columnas (lunes a domingo, con ‹ › y "Hoy" para moverte de semana). Cada
cliente aparece en la columna del día que le toque, según sus **días
habituales** (el campo "Dias" del ficha del cliente) — si un cliente tiene
"LJ", aparece tanto en la columna del lunes como en la del jueves.

Color de cada ficha, por ese día concreto:

- 🔴 **Rojo** — todavía no tiene pedido con reparto ese día.
- 🟠 **Naranja** — el pedido ha entrado pero aún no está "OK montado".
- 🟢 **Verde** — el pedido ya está montado (o más adelante en el proceso).
- ⚪ **Gris** (con texto tachado) — se marcó que esta semana no quiere
  pedido; se hace con el icono ⊘ en la propia ficha roja, y se deshace con
  el icono ↺.

Se basa en la **fecha de reparto** de cada pedido, no en cuándo se subió —
así que si un cliente pide los lunes para que le llegue el jueves, la ficha
que se pone en verde es la del jueves.

Los clientes **sin días habituales asignados** (típicamente los de agencia,
que no tienen un día fijo) no aparecen en el calendario — se avisa con una
nota debajo, y se siguen consultando desde la vista "Lista" normal.

## Ver toda la semana (modo Repartidor)

Justo debajo de la cabecera hay una fila con los 7 días de la semana (L a D).
Cada día muestra cuántos pedidos tiene programados y cuántos van entregados
(por ejemplo "3/5"), y se pone en verde cuando están todos entregados — así
se ve de un vistazo cómo se va llenando la semana a medida que oficina
planifica rutas. Con ‹ › se cambia de semana, y "Hoy" vuelve al día actual.

Se puede marcar como entregado o firmar en **cualquier día** de la semana, no
solo hoy — por si un pedido no se reparte el día que tocaba y hay que
volver atrás para cerrarlo, o adelantarte a un día siguiente.

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

## Pestaña Exportar

Descarga un Excel con todo lo registrado, con un botón — sin esperar a nada
automático. Trae 4 hojas:

- **Pedidos**: uno por fila, con cliente, estado, fechas, números de pedido
  y albarán.
- **Líneas de pedido**: una fila por producto (para poder sumar cantidades
  por producto o por cliente fácilmente en Excel).
- **Producción**: el registro diario del obrador.
- **Clientes**: el listado completo, siempre entero (no se filtra por fecha).

El rango de fechas (con accesos rápidos "Última semana" / "Este mes" /
"Último año", o eligiendo las fechas a mano) se aplica a Pedidos —por fecha
de subida— y a Producción. Los PDF de los albaranes, las firmas y las
imágenes de los pedidos no se incluyen en el Excel — solo los datos
(números, fechas, cantidades, estados); esos archivos se siguen consultando
desde la propia app.

**Envío automático semanal por email**: no está montado todavía porque hace
falta configurar un servicio de envío de correo (por ejemplo Resend), que no
tenías dado de alta. Si lo quieres, dímelo y lo añado — mientras tanto, este
botón cubre lo mismo, solo que a demanda en vez de automático.

## Modo Trazabilidad

Tercer modo, junto a OBRADOR y Repartidor en la pantalla de inicio. Pensado
para cumplir con Sanidad: dejar constancia de qué materia prima entra, y con
qué materia prima (y qué lote) se ha fabricado cada producto.

### Pestaña Proveedores

Registra cada entrega de materia prima que os llega de vuestros proveedores
(magro, grasa, cerdo, secreto, envases...).

1. **"+ Subir albarán"**: eliges cómo lo tienes — **foto**, **PDF** o
   **texto pegado**.
   - **Con PDF**, intento sacar solo el proveedor (si ya está en tu lista),
     el número de albarán, la fecha, el producto/materia prima, la
     cantidad y el lote — probé esto con un albarán real y detectó los dos
     campos de lote a la vez. Como cada proveedor tiene su propio formato
     de albarán (a diferencia de los pedidos de clientes, que casi siempre
     vienen del mismo generador), esto es de "mejor esfuerzo": cuanto más
     distinto sea el formato del proveedor, más tocará revisar y completar
     a mano antes de guardar.
   - **Con foto**, no hay forma de leer el texto automáticamente (no hay
     motor de reconocimiento de imágenes en la app) — se rellenan todos los
     campos a mano, pero la foto se guarda igualmente como justificante.
   - **Con texto pegado**, se aplica el mismo intento de detección que con
     el PDF.
2. La **fecha de recepción** se marca sola con la de hoy en cuanto abres el
   formulario — la puedes cambiar si hace falta, pero no tienes que tocarla
   normalmente.
3. La **materia prima** se elige de una lista fija (magro, grasa, longasol,
   fibracel, agua, sal, pimienta, papel, bandeja, plástico separador,
   salchichal, cerdo, bolsa, secreto) — si detecto una coincidencia en el
   texto del albarán, se preselecciona sola.
4. Si el proveedor no está en tu lista, puedes escribirlo directamente en el
   formulario (se da de alta solo) o gestionarlos aparte con "Gestionar
   proveedores". **Todavía no me has pasado el listado de proveedores
   habituales** — en cuanto lo tengas, mándamelo y te lo dejo precargado
   como hice con clientes y productos.

### Pestaña Producción para trazabilidad

Aquí conectas lo que ya anotaste en la pestaña Producción (del modo
OBRADOR) con las materias primas que se usaron para fabricarlo:

1. Marca uno o varios productos de la lista (los que ya tengas registrados
   en Producción). Los que ya tengan una trazabilidad guardada llevan un
   aviso "✓ ya trazado", aunque se puede volver a añadir otra si hace falta.
2. Añade una línea por cada materia prima usada, con cantidad (kg, uds, o
   "solo lote" si no aplica una cantidad) y el lote correspondiente. Se
   pueden añadir tantas líneas como materias primas intervengan — no todos
   los productos usan todas.
3. "Guardar trazabilidad" archiva el vínculo entre el producto fabricado y
   sus materias primas, con fecha, para poder consultarlo cuando haga falta.

**Sobre la fórmula automática que mencionaste**: de momento esto es
completamente manual, tal como pediste. En cuanto me pases la fórmula de
cantidades por producto, la añado para que las líneas de materia prima se
rellenen solas al elegir el producto (dejando igualmente la opción de
corregirlas a mano).

## Notas técnicas y limitaciones a tener en cuenta

- **Límite de funciones serverless (plan gratuito de Vercel)**: el plan
  Hobby permite un máximo de 12 funciones en `api/` por despliegue. Ahora
  mismo hay 9 (varias se fusionaron internamente — por ejemplo, marcar
  entregado y firmar viven dentro de `pedidos.js`; proveedores y materias
  primas comparten `catalogos.js`), así que hay margen para 3 más antes de
  volver a tocar este límite. Si en el futuro se añade una función nueva y
  aparece el error "No more than 12 Serverless Functions...", hay que
  fusionar alguna existente de la misma manera antes de desplegar.

- **Mapa y geocodificación**: OpenStreetMap + Nominatim, gratuitos.
- **Optimización de ruta**: OSRM público (gratuito, por carretera real). Si
  no responde, se usa distancia en línea recta como alternativa automática.
- **Albaranes, firmas y fotos de proveedor**: se guardan como PDF/imagen
  dentro de la propia base de datos (Upstash Redis), sin necesidad de un
  servicio de almacenamiento aparte. Esto es sencillo pero tiene un límite
  práctico: evita subir archivos muy pesados (fotos a máxima resolución,
  PDFs escaneados de muchas páginas) — con un PDF o foto de tamaño normal no
  hay problema, pero archivos de varios MB podrían fallar al subir por
  límites del propio Vercel. Si con el tiempo esto da problemas, se puede
  migrar a un servicio de almacenamiento de archivos (p. ej. Vercel Blob)
  sin tocar el resto de la app.
- **Catálogo de productos**: precargado con los 34 que me pasaste (con su
  clasificación kg/uds/ambas); se gestiona desde la pestaña Producción.
- **Catálogo de materias primas**: precargado con la lista fija que diste
  (magro, grasa, longasol, fibracel, agua, sal, pimienta, papel, bandeja,
  plástico separador, salchichal, cerdo, bolsa, secreto) — se puede ampliar
  desde el código (`lib/data/materias-primas-seed.json`) si hace falta
  añadir alguna más adelante.
- **Proveedores**: todavía no hay ninguno precargado — se dan de alta sobre
  la marcha al subir el primer albarán, o desde "Gestionar proveedores".
- **Pedidos, producción y trazabilidad no están conectados con stock**: de
  momento son solo un registro/archivo, tal como se pidió.
- **Ver PDFs e imágenes subidos**: se abren en pestaña nueva convirtiéndolos
  en un archivo real en el momento de pulsar el enlace (Chrome bloquea abrir
  directamente un PDF guardado como texto/base64, y se quedaba en blanco).
