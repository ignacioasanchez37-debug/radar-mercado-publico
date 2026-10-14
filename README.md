# Radar Mercado Público

Monitor de licitaciones, Compra Ágil y órdenes de compra de
[Mercado Público](https://www.mercadopublico.cl) (ChileCompra), para el computador y el teléfono.

Funciona en el navegador, se instala como app y lee la API oficial **directo desde tu dispositivo**:
no hay servidor intermedio ni base de datos con los datos de nadie.

## Para usarlo

Cada persona usa su propio ticket de la API, que ChileCompra entrega gratis — uno por persona, con
tope de 10.000 consultas diarias. Se pide con ClaveÚnica en
[chilecompra.cl/api](https://www.chilecompra.cl/api/) y llega al correo en minutos.

Lo pegas una vez en la app y queda guardado en tu dispositivo. No viaja a ninguna parte.

## Qué hace

- **Licitaciones activas** ordenadas por cuánto falta para el cierre, con cuenta regresiva en vivo.
- **Filtro por rubro** con términos anclados a palabra: `telefon` pesca telefonía, `=red` no entra
  en "reducida", `-oncolog` descarta. Cada tarjeta muestra por qué calzó.
- **Compra Ágil** (compras bajo 100 UTM), que es por donde entran los proveedores nuevos.
- **Órdenes de compra** del día, útiles para ver a qué precio se está adjudicando.
- Avisos de licitaciones nuevas del rubro, y seguimiento de las que te interesan.

## Documentación

Todo lo técnico está en **[LEEME.md](LEEME.md)**: cómo publicarlo, el proxy que necesita Compra
Ágil, cómo funciona el filtro, y los límites conocidos de las APIs de ChileCompra.

---

Fuente de los datos: Dirección ChileCompra, API de Mercado Público. Proyecto independiente, sin
relación con ChileCompra. Para ofertar, revisa siempre las bases en el portal oficial.
