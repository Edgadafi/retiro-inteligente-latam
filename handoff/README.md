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
- SHA-256: `468079f6339fe1dbe7694b8bd688404972c7082e7ba09a2f31a1a51af9e2db71`

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

## Después de desplegar

El loader pide `/widget/rito.js?v=texto-1` y la respuesta se cachea una hora.
Sube el sufijo `v=` para que los navegadores tomen el texto nuevo sin esperar la
expiración.
