# Traspaso: rename Rito → Rita en el sitio público

Este directorio **no forma parte de la aplicación**. Contiene un parche destinado
a otro repositorio, guardado aquí sólo porque es la vía disponible para
transportarlo entre agentes.

## Qué es

`rename-rito-a-rita-sitio-retirobtc.patch` es un commit generado con
`git format-patch` contra
[`Edgadafi/Calculadora-de-Retiro-Bitcoin-Fedi`](https://github.com/Edgadafi/Calculadora-de-Retiro-Bitcoin-Fedi),
el repositorio que sirve `retirobtc.mx`. Renombra la identidad visible de la
asistente y deja intacta la fontanería interna.

- 23 archivos, +62 / −59
- SHA-256: `926cecdb0146908bd4e4c8fb0b2473d0da456c2a764fbc8be31dc43c7c479b6f`

## Cómo aplicarlo

```sh
git clone https://github.com/Edgadafi/Calculadora-de-Retiro-Bitcoin-Fedi
cd Calculadora-de-Retiro-Bitcoin-Fedi
git checkout -b cursor/rename-rito-to-rita-eebe
curl -fsSL <URL-cruda-de-este-archivo> -o /tmp/rename.patch
git am /tmp/rename.patch
```

`git am` conserva el mensaje de commit original, que explica el criterio
aplicado. Si el repositorio avanzó y el parche no aplica limpio, usa
`git apply --3way /tmp/rename.patch` y resuelve los conflictos respetando la
lista de exclusiones de abajo.

## Criterio

Se renombra lo que el usuario final lee. Se conserva el namespace `rito` en todo
identificador que ya esté desplegado, porque cambiarlo rompe un contrato en vez
de actualizar una marca.

**No tocar:**

- `rito-loader.js` y la ruta `/widget/rito.js` — URLs cacheadas por el navegador
  y referenciadas por el sitio estático ya desplegado.
- `RITO_CHAT_MODEL` y demás variables `RITO_*` configuradas en Vercel.
- Ids del DOM `#rito-*`, clases `.rito-msg`, la clave de `localStorage`
  `rito_session`, el flag `RETIROBTC_RITO` y el parámetro `?rito=0`.
- El alias de correo `rito@retirobtc.mx`.

El widget mantiene `window.Rito` como alias de `window.Rita` para no romper
embeds externos.

## Verificación

`widget-alias.test.mjs` comprueba lo anterior sobre el widget ya parcheado:
que la identidad visible diga Rita, que `window.Rito` siga apuntando a
`window.Rita`, que `window.Rito.open()` abra el panel de verdad y que los ids
`#rito-*` y la clave `rito_session` sigan intactos.

```sh
npm install --no-save jsdom
node widget-alias.test.mjs <ruta-al-repo>/agents/public/widget/rito.js
```

Los ocho casos deben pasar. Este test detectó que una pasada de renombrado
sobre prosa había convertido `window.Rito = window.Rita` en una autoasignación,
eliminando el alias; conviene volver a correrlo si se reescribe el widget.

## Después de desplegar: `2-purga-cache-widget.patch`

El loader pide `/widget/rito.js?v=texto-1` y la respuesta llega con
`cache-control: public, max-age=3600`. Quien ya visitó el sitio conserva el
widget viejo hasta una hora después del despliegue y sigue leyendo «Rito».

`2-purga-cache-widget.patch` sube ese sufijo a `v=rita-1`.

- SHA-256: `e1d55364a25ae586d521f9e4dd209d1d9b7e13b6b2c078aba96b85efed537aa6`

**Va en un despliegue posterior, no junto al rename.** Medido contra producción,
una petición con un query string nunca usado devuelve `x-vercel-cache: HIT` con
el mismo `etag` y el mismo `age` que la URL canónica: el CDN no distingue el
query string, así que subir `v=` no purga nada ahí, sólo la caché del navegador.

Si ambos cambios viajan en el mismo push, el sitio estático y el servicio de
agentes se despliegan en paralelo y pueden cruzarse: el navegador pediría
`?v=rita-1` antes de que el widget nuevo esté publicado y cachearía el archivo
viejo bajo la clave nueva durante una hora, que es justo lo contrario de lo que
se busca.

Aplícalo cuando esto ya devuelva `Rita`:

```sh
curl -s https://retirobtc-agents.vercel.app/widget/rito.js | grep -o 'rito-toggle[^>]*>[A-Za-z]*'
```
