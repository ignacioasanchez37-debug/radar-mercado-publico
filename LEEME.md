# Radar Mercado Público

App web instalable (PWA) que lee la API oficial de Mercado Público y muestra las licitaciones
activas ordenadas por cuánto falta para el cierre, filtradas por las palabras del rubro de cada
usuario. Funciona en Android, iOS y escritorio.

Fuente de los datos: Dirección ChileCompra, `api.mercadopublico.cl`. Esta app es independiente y
no tiene relación con ChileCompra.

---

## 1. Sobre el login con ClaveÚnica

**No se puede integrar.** ClaveÚnica está reservada por defecto a organismos de la Administración
del Estado. Las entidades privadas solo pueden integrarla si prestan un servicio público delegado
o si tienen un convenio y autorización legal específica del Ministerio Secretaría General de la
Presidencia. Las credenciales de integración se piden en la sección "Instituciones Públicas" de la
Secretaría de Gobierno Digital, con correo institucional y certificación previa.

Una SpA de telecomunicaciones no califica, y no existe un plan de pago o vía comercial para
obtenerlo.

**Lo que sí ocurre, y es lo que se ve en Mercado Público:** ChileCompra —que sí es organismo del
Estado— usa ClaveÚnica en su propio sitio para entregarle a cada persona su *ticket* de API. O sea,
la ClaveÚnica ya está en el flujo, solo que del lado de ChileCompra.

Por eso esta app está diseñada así:

- Cada usuario pide **su propio ticket** con **su ClaveÚnica** en el sitio oficial (la app lo lleva
  ahí con un botón).
- Lo pega una vez y queda guardado en su teléfono.
- La app consulta la API **directo desde el dispositivo**. No hay servidor intermedio, no hay base
  de datos con RUT de nadie, no hay cuentas que administrar.

Esto además cumple las condiciones de uso: ChileCompra entrega **un ticket por persona** con datos
reales, tope de **10.000 consultas diarias**, y hace validaciones por dirección IP. Si todos los
usuarios compartieran tu ticket, se agotaría la cuota y podrían suspenderte el acceso.

Si en el futuro quieres cuentas de verdad (perfiles guardados en la nube, alertas por correo,
equipos), lo realista es un backend propio con login por correo o Google, no ClaveÚnica.

---

## 2. Publicarla para que otros la usen

Necesitas HTTPS. Sin HTTPS, Android no permite instalarla ni registrar el service worker.

### Opción A — Tu propio servidor (nginx)

```bash
sudo mkdir -p /var/www/radar-mp
sudo cp -r index.html manifest.webmanifest sw.js icons /var/www/radar-mp/
sudo chown -R www-data:www-data /var/www/radar-mp
```

```nginx
server {
    listen 443 ssl http2;
    server_name radar.tudominio.cl;

    ssl_certificate     /etc/letsencrypt/live/radar.tudominio.cl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/radar.tudominio.cl/privkey.pem;

    root /var/www/radar-mp;
    index index.html;

    # el service worker no se debe cachear, o los usuarios quedan pegados en una versión vieja
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    location = /manifest.webmanifest {
        types { } default_type application/manifest+json;
    }
    location / { try_files $uri $uri/ /index.html; }
}
```

Certificado: `sudo certbot --nginx -d radar.tudominio.cl`

### Opción B — GitHub Pages (recomendada, y sin tocar la terminal)

Gratis, con HTTPS, y es lo que destraba el teléfono: los datos cargan, la app se instala en la
pantalla de inicio y puedes pasarle el enlace a quien quieras.

1. En **github.com** → botón **+** arriba a la derecha → **New repository**.
2. Nombre: `radar-mercado-publico`. Marca **Public**. No agregues README (ya viene uno). **Create**.
3. En el repo vacío: **uploading an existing file**.
4. Arrastra el contenido de `para-publicar.zip` **ya descomprimido** — los archivos y la carpeta
   `icons`, no el .zip. **Commit changes**.
5. **Settings** → **Pages** → en *Source* elige **Deploy from a branch**, rama `main`, carpeta
   `/ (root)` → **Save**.
6. En uno o dos minutos queda en `https://TU-USUARIO.github.io/radar-mercado-publico/`

El repo puede ser público sin problema: no hay ningún ticket adentro. Cada usuario pone el suyo y
queda en su propio dispositivo.

Para instalarla en el teléfono, abre ese enlace en el navegador: en iPhone, Compartir → *Agregar a
inicio*; en Android, el botón **INSTALAR** que aparece arriba.

### Al publicar una versión nueva

Sube `CACHE = 'radar-mp-v1'` a `v2` en `sw.js`. Si no, los teléfonos siguen mostrando la versión
cacheada.

---

## 3. Instalar en Android

Una vez publicada, quien abra el enlace en Chrome verá el botón **INSTALAR** arriba a la derecha
(o el aviso "Agregar a pantalla de inicio"). Queda con ícono propio, sin barra de navegador, y
abre offline mostrando lo último que leyó.

En iPhone es Compartir → "Agregar a inicio". Safari no muestra el botón automático.

---

## 4. Convertirla en APK para la Play Store

Si la quieres como app instalable desde la tienda, se empaqueta con Bubblewrap, que genera una
Trusted Web Activity: un APK que abre tu PWA a pantalla completa, sin barra de navegador.

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://radar.tudominio.cl/manifest.webmanifest
bubblewrap build
```

Te queda un `.apk` para instalar directo y un `.aab` para subir a Play Console. Bubblewrap crea una
clave de firma: guárdala, sin ella no puedes publicar actualizaciones.

Un detalle obligatorio: para que la app abra sin barra de direcciones tienes que subir el archivo
de verificación de dominio que Bubblewrap te entrega, en
`https://radar.tudominio.cl/.well-known/assetlinks.json`.

Para publicar en Play Store necesitas cuenta de desarrollador (pago único de USD 25), política de
privacidad publicada, y declarar en el formulario de datos que la app no recolecta información
(es cierto: todo queda en el dispositivo).

Alternativa sin Play Store: reparte el APK por WhatsApp o descarga directa. Cada persona activa
"instalar desde orígenes desconocidos" una vez.

---

## 5. Lo que queda pendiente

**Avisos con la app cerrada.** Hoy los avisos llegan solo con la app abierta o recién usada. Para
notificar de madrugada cuando aparece una licitación de tu rubro se necesita un servicio en tu
servidor que consulte la API con un cron y empuje la notificación (Web Push con VAPID, o un bot de
Telegram, que es bastante más simple y no depende del navegador).

**Filtro por región y organismo.** El listado diario de la API trae solo código, nombre, estado y
fecha de cierre. Región, organismo y monto llegan al abrir la ficha. Para filtrar por región desde
la lista habría que precargar fichas en un backend propio.

**Órdenes de compra.** La pestaña ya lee las del día. Sirve para ver a qué precio se está
adjudicando en tu rubro, que es buena información para cotizar.

---

## 6. Enlaces abiertos desde WhatsApp

WhatsApp, Instagram y Facebook abren los enlaces dentro de su propio navegador embebido. Ahí no se
puede instalar la app, no funcionan las notificaciones, y el filtro de ChileCompra suele responder
403 porque la visita no llega con un origen que reconozca.

La app detecta ese caso y muestra arriba una franja amarilla con dos botones:

- **Abrir en el navegador**: en Android usa un enlace `intent://`, que obliga al sistema a abrir
  Chrome o el navegador predeterminado. En iPhone copia el enlace, porque iOS no permite forzar la
  salida del WebView.
- **Copiar enlace**: para pegarlo donde quieras.

Además, todos los enlaces que salen hacia ChileCompra o Mercado Público se abren con `noreferrer`,
o sea sin decir desde qué sitio viene la visita. Eso es justamente lo que evita el 403.

Si aun así aparece el 403 al pedir el ticket, la salida segura es escribir **chilecompra.cl/api** a
mano en una pestaña nueva y usar ahí el botón "Pide tu ticket".

---

## 7. Compra Ágil: por qué necesita un proxy

Compra Ágil no vive en la misma API que las licitaciones. Usa una API v2 aparte,
`https://api2.mercadopublico.cl/v2/compra-agil`, y ahí **el ticket va en un encabezado HTTP**
(`ticket: XXXX`), no en la URL.

Eso rompe los dos caminos que usa el resto de la app:

- **JSONP no sirve**: una etiqueta `<script>` no puede mandar encabezados.
- **fetch tampoco**: al llevar un encabezado propio, el navegador manda primero un preflight
  OPTIONS, y api2 no devuelve cabeceras CORS. La llamada muere antes de salir.

Por eso el paquete incluye `proxy-compra-agil.js`: recibe el ticket como parámetro normal
(sin preflight), lo pasa al encabezado y agrega las cabeceras CORS que faltan. No guarda el ticket
ni lo escribe en el log — cada usuario manda el suyo.

```bash
node proxy-compra-agil.js          # puerto 8787
PORT=9000 node proxy-compra-agil.js
```

Detrás de nginx, en el mismo server block del sitio:

```nginx
location /compra-agil {
    proxy_pass http://127.0.0.1:8787;
    proxy_read_timeout 60s;        # la API v2 tarda 10-20 s por consulta
}
```

Como servicio permanente, con systemd:

```ini
[Unit]
Description=Proxy Compra Agil
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/radar-mp/proxy-compra-agil.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

Después, en la app: menú **···** → *Proxy para Compra Ágil* → `https://tudominio.cl/compra-agil`.

Sin proxy, la pestaña Compra Ágil intenta la llamada directa igual y muestra el motivo si falla.
Las otras tres pestañas funcionan sin nada de esto.

### Lo que hay que saber de esa API

- Es **beta y lenta**: 10 a 20 segundos por búsqueda, con errores 504 intermitentes.
- Exige **al menos un filtro**; sin ninguno responde 500. El `tamano_pagina` mínimo es 10.
- Busca por texto, así que las palabras van **completas**, no en raíz como en las licitaciones.
  La app consulta las primeras 6 palabras de tu lista y junta los resultados sin repetir.
- El 429 **no es bloqueo del día**: la cuota se recarga sola. Si lo recibes, reintenta en 10 o 15
  minutos antes de suponer que gastaste todo.
- Los adjuntos con las especificaciones no se pueden bajar por programa. El botón del detalle
  lleva a la ficha pública, que es donde sí se abren.
- La API no publica adjudicaciones: no hay forma de saber qué oferta ganó.

Los nombres exactos de los campos que devuelve esta API no están bien documentados, así que la app
los lee de forma tolerante: prueba varios nombres posibles para código, nombre, organismo, región,
monto y fecha de cierre. Si alguna tarjeta sale con datos en blanco, mándame lo que devuelve la
consulta y lo ajusto.

**Lo que no pude probar:** desde donde armé esto no hay salida a `api2.mercadopublico.cl`, así que
el proxy está verificado en todo lo suyo (validaciones, CORS, preflight, timeouts, manejo del
`Retry-After`) pero no contra el servicio real. La primera corrida con tu ticket es la prueba de
verdad.

---

## 8. Dos disposiciones: teléfono y computador

La app ahora cambia de forma según el ancho, no solo de tamaño.

| Ancho | Qué hace |
| --- | --- |
| menos de 700px | Una columna. Pestañas y filtros arriba, tarjetas apiladas, el detalle sube desde abajo. |
| 700 a 1039px | Igual arriba, pero las licitaciones se parten en dos columnas. |
| 1040px o más | Panel de control: barra lateral fija con pestañas, buscador, filtros y contadores; la lista ocupa el resto. El detalle entra por la derecha y deja la lista a la vista. |
| 1560px o más | Lo mismo, con tres columnas de tarjetas. |

Detalles del modo escritorio:

- **Atajos de teclado**: `/` enfoca el buscador, `R` actualiza, `1` a `4` cambian de pestaña, `Esc`
  cierra el detalle. Están listados abajo en la barra lateral.
- **El detalle no tapa la lista.** En el teléfono es una hoja que sube; en el computador es un cajón
  lateral de 430px con el fondo apenas atenuado, para poder comparar con lo que quedó a la izquierda.
- **Estados al pasar el mouse** en tarjetas, filtros y botones. En el teléfono no se aplican: van
  dentro de `@media (hover:hover)` para que no se queden pegados después de tocar.
- La barra lateral se mide sola: un script toma el alto real de la cabecera y lo deja en la variable
  CSS `--barra`, así la lateral queda justo debajo aunque cambie el tamaño de la letra.

Dos arreglos que salieron de revisar la maqueta en ambos tamaños:

- En el teléfono los botones de la cabecera tapaban la línea de estado. La cabecera pasó de
  posicionamiento absoluto a una rejilla, y ahora el texto se recorta con puntos suspensivos en vez
  de quedar debajo de los botones.
- Las tarjetas de una misma fila quedan del mismo alto, y la barra de urgencia flotaba a media
  tarjeta en las más cortas. Ahora la tarjeta es una columna flexible y la barra se empuja siempre
  al borde inferior.

La maqueta la revisé con capturas reales a 390, 1024, 1440 y 1680 píxeles, con datos de prueba
inyectados. Lo que no pude probar sigue siendo lo mismo: las llamadas a la API real.

---

## 9. El `&` en la ruta de la carpeta

Esta carpeta vive bajo `C:\Users\ignacio&Cristal\`. En la consola de Windows el `&` significa
"ejecuta también este otro comando", así que una ruta sin comillas se parte en dos:

```
cd C:\Users\ignacio&Cristal\Desktop        ← la consola lee dos comandos y falla
cd "C:\Users\ignacio&Cristal\Desktop"      ← correcto
```

**No renombres la carpeta de usuario.** Windows guarda esa ruta en el registro
(`ProfileImagePath`) y muchísimas aplicaciones la tienen escrita de forma absoluta en sus
configuraciones. Renombrarla rompe el perfil y arreglarlo después es bastante peor que convivir con
el `&`.

Lo que sí está resuelto, para que nunca tengas que escribir esa ruta:

- **`probar-en-el-pc.bat`** levanta el servidor local. Doble clic.
- **`levantar-proxy.bat`** levanta el proxy de Compra Ágil. Doble clic.
- Ambos usan `cd /d "%~dp0."` — entre comillas y con punto al final. El punto evita que la barra
  invertida final de `%~dp0` se coma la comilla de cierre.
- **`servidor-local.js`** reemplaza a `npx http-server`. Es Node puro, sin instalar nada. El cambio
  no es sólo por comodidad: npm invoca shells internamente, y ahí el `&` de la ruta puede romper el
  comando. Sirve los tipos MIME correctos (incluido `application/manifest+json`), responde sin caché
  para que cada F5 traiga lo recién editado, y bloquea las rutas que intentan salir de la carpeta.

Qué se ve afectado por el `&` y qué no:

| | ¿Le afecta? |
| --- | --- |
| Doble clic en los `.bat` | No |
| Navegador abriendo `http://localhost:8080` | No |
| Node y Python leyendo archivos | No |
| Comandos que escribes a mano en cmd o PowerShell | **Sí**, salvo que uses comillas |
| `npm` y `npx` corriendo dentro de esa carpeta | **Puede** |

Si algún día quieres el problema fuera por completo, mueve el proyecto a una ruta sin caracteres
raros — por ejemplo `C:\Users\Public\Claude\radar-mercado-publico`, que no necesita permisos de
administrador — y deja un acceso directo en el escritorio.

---

## 10. Cómo se decide si una licitación es de tu rubro

La primera versión buscaba cada palabra como subcadena, en cualquier parte del título. Eso traía
basura constante: `red` entraba en "**red**ucida" y en "c**red**encialización", `tecnolog` en
"**tecnólog**o médico", `cámara` en "**cámara** hiperbárica". Mezclado con lo real, el radar dejaba
de servir.

Ahora cada término se ancla al **comienzo de una palabra**, y hay tres formas de escribirlo:

| Escribes | Significa | Calza con | No calza con |
| --- | --- | --- | --- |
| `telefon` | inicio de palabra | telefonía, telefónica, telefónico | — |
| `=red` | palabra exacta | "red" | reducida, redes, credencial |
| `-oncolog` | **descarta** | — | bota la licitación completa |
| `mesa de ayuda` | frase | "mesa de ayuda" | "mesa", "ayuda" sueltas |

Un término con `-` adelante vetea: si aparece en el título, la licitación se descarta aunque otra
palabra haya calzado. Por eso "Mantención de **redes** del pabellón **oncológico**" no aparece,
aunque `redes` sí calzó.

### El descarte no es a ciegas

Dos cosas para que puedas revisar lo que el filtro decide, en vez de confiar:

- **Cada tarjeta muestra por qué calzó**, en chips bajo el título: `soporte informatic`,
  `red de datos`. Si una tarjeta calzó por un motivo tonto, lo ves al tiro y editas ese término.
- **El filtro "Descartadas"** lista lo que sí calzó con tu rubro pero una palabra de exclusión botó.
  Si ahí aparece trabajo que querías, sabes exactamente qué exclusión sacar.

El resaltado amarillo del título usa las mismas expresiones que el motor. No es un detalle estético:
antes marcaba "diagnós**tico**" cuando lo que había calzado era la sigla **TIC** en otra parte de la
frase, y eso hacía desconfiar del filtro entero con razón.

### Verificado contra lo que salió publicado

El motor está probado con 26 títulos reales de Mercado Público — los que aparecieron el 13 de
octubre de 2026, incluidos todos los falsos positivos que tenía la versión anterior. Pasa los 26.
Rendimiento: 42 ms para evaluar 4.577 títulos, y 1 ms en los repintados siguientes, porque el
resultado queda guardado en cada licitación hasta que cambies los términos.

### Las listas que vienen cargadas

Están pensadas para el giro TIC: asesoría, consultoría y asistencia técnica. Incluyen servicios
(soporte, mesa de ayuda, consultoría), redes y telecomunicaciones (telefonía, VoIP, enlaces, fibra,
WiFi, radiocomunicaciones), infraestructura (servidores, datacenter, UPS, nube) y seguridad (CCTV,
control de acceso, ciberseguridad).

Las exclusiones son todas del mundo clínico y de servicios generales, que es de donde venía el ruido:
tecnólogo, hiperbárica, oncología, medicamentos, pabellón, enfermería, licencias de conducir,
alimentación, vestuario, combustible.

Son un punto de partida. Úsalas una semana, mira qué entra que no debería y qué falta, y ajústalas
en el menú ···

---

## 11. "Sin datos · revisa el ticket" al abrir el index.html

Si abres `index.html` desde la vista previa de un archivo — la del chat de Claude, la de WhatsApp,
o haciendo doble clic sobre el archivo — la app carga pero **no trae datos**, aunque el ticket esté
bien pegado.

No es el ticket. Es el origen desde donde corre la página.

La app pide los datos con JSONP: inserta una etiqueta `<script>` apuntando a
`api.mercadopublico.cl`. Esa carga cruzada necesita un origen web de verdad (`http://` o
`https://`). Una vista previa de archivo corre en `file://` o dentro de un contenedor con reglas de
seguridad propias, y ahí el navegador bloquea la llamada antes de que salga. La app recibe el fallo
y muestra "Sin datos", que es lo único que puede decir desde su lado.

Lo mismo bloquea el service worker y la instalación: por eso con `file://` tampoco se puede agregar
a la pantalla de inicio.

**En el computador** está resuelto: doble clic en `probar-en-el-pc.bat` y se abre en
`http://localhost:8080`, que sí es un origen válido. Ahí los datos cargan.

**En el teléfono** no hay atajo: `localhost` apunta al propio teléfono, no a tu PC. Necesitas la
app publicada en una dirección con HTTPS (sección 2 de este documento: GitHub Pages sale gratis y
toma unos minutos). Una vez publicada, abres el enlace en Safari o Chrome, y recién ahí funcionan
los datos, la instalación y el ícono en la pantalla de inicio.

---

## 12. Acceso directo con ícono propio

`crear-acceso-directo.bat` deja en el Escritorio un acceso llamado **Radar Mercado Público**, con el
ícono del radar, para abrirlo sin entrar a la carpeta. Doble clic una vez y queda.

El acceso apunta a `probar-en-el-pc.bat` y arranca minimizado: levanta el servidor y abre la app en
el navegador, sin una consola estorbando al medio.

El ícono es `radar-mp.ico`, con siete resoluciones dentro (16 a 256 px). Los tamaños chicos van sin
las letras "MP" a propósito: a 16 píxeles el texto es una mancha, así que ahí queda solo el arco del
radar, que es lo que se reconoce de reojo en la barra de tareas.

Ese `.bat` crea el acceso sin pasar la ruta por la línea de comandos — la deja en una variable de
entorno y PowerShell la lee de ahí. Es la forma de que el `&` de la carpeta de usuario no rompa nada.

**En el teléfono** el equivalente es agregar la app a la pantalla de inicio desde el navegador
(Compartir → "Agregar a inicio" en iPhone, o el botón INSTALAR en Chrome). Toma el ícono de
`icons/icon-192.png`, que es el mismo diseño. Pero eso requiere que la app esté publicada con HTTPS:
desde una vista previa de archivo no se puede.
