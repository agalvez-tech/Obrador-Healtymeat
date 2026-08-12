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
   tengas a mano. Se guarda tal cual, sin ningún procesamiento automático:
   quien prepare el pedido lo lee directamente ahí.
2. Al subirlo, la app calcula sola el próximo día de reparto de ese cliente
   (según los "días habituales" que tenga guardados) y el pedido entra en
   **"En elaboración"**.
3. Quien prepara el pedido lo abre, rellena **nº de lote** y **cantidad**
   (número o kg), y pulsa **"OK reparto"**. A partir de ahí pasa a
   **"Lista para repartir"**.
4. Si el cliente es de **reparto propio**, ese pedido aparecerá en la pestaña
   Reparto, en el día que le toque. Si es de **agencia de envío**, se queda
   aquí mismo como terminado — no hace falta agendarlo en ningún sitio, ya
   que la agencia se encarga por su cuenta.

## Pestaña Producción

Registro diario de lo que va sacando el obrador: fecha, producto (de una
lista desplegable), lote y cantidad (kg o unidades). De momento es solo un
archivo/listado — no está conectado con Pedidos ni con el stock.

**El desplegable viene con tus 33 productos ya cargados**, con su formato de
envasado (bandeja, caja, bolsa, al peso) — al elegir uno, la unidad
(kg/uds) se autocompleta según el formato, aunque puedes cambiarla si hace
falta. Añade o quita productos con "Gestionar productos".

## Pestaña Reparto

Aquí ya no seleccionas clientes a mano: la lista que ves son los **pedidos
en "Lista para repartir" para el día que elijas**, de clientes de reparto
propio. Vienen todos marcados por defecto — desmarca si alguno se pospone.

1. **Punto de partida**: la dirección del almacén, se guarda una vez.
2. Por cada pedido puedes **"+ Añadir albarán (PDF)"** — el PDF que firmará
   el cliente al recibir el pedido.
3. **"Optimizar y guardar ruta"**: calcula el orden más corto por carretera
   y lo manda al móvil del repartidor.
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
  álbaranes en PDF muy pesados (escaneados a alta resolución, muchas
  páginas) — con un PDF de una página tipo albarán normal no hay problema,
  pero archivos de varios MB podrían fallar al subir por límites del propio
  Vercel. Si con el tiempo esto da problemas, se puede migrar a un servicio
  de almacenamiento de archivos (p. ej. Vercel Blob) sin tocar el resto de
  la app.
- **Catálogo de productos**: precargado con los 33 que me pasaste; se
  gestiona (añadir/quitar) desde la pestaña Producción.
- **Pedidos y producción no están conectados con stock**: de momento son
  solo un registro/archivo, tal como se pidió.
