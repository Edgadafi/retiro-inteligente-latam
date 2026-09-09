# Autenticar `retirobtc.mx` en Brevo

## 1. El error del formulario

Brevo **no está rechazando el dominio**. El campo "Nombre de dominio" pide un dominio, no un buzón:

| Valor | Resultado |
|-------|-----------|
| `hola@retirobtc.mx` | ❌ `Introduce un dominio válido (por ejemplo: company.com)` |
| `retirobtc.mx` | ✅ pasa al paso 2 |

El remitente `hola@retirobtc.mx` **no se da de alta aquí**. Primero se autentica el dominio
(Remitentes, dominio, IP → *Añadir un dominio*) y después se crea el remitente
(*Añadir un remitente*), que ya hereda la autenticación del dominio.

Nota: la URL del wizard traía `?domain=gmail.com`, señal de que el flujo se inició desde el alta
de un remitente Gmail. Gmail no se puede autenticar (no es un dominio propio); hay que empezar
desde el dominio.

## 2. Estado DNS actual (verificado)

`retirobtc.mx` está en Namecheap (`dns1/dns2.registrar-servers.com`), el correo humano vive en
PrivateEmail y el sitio en Vercel:

| Registro | Valor actual | Implicación para Brevo |
|----------|--------------|------------------------|
| `A` raíz | `216.198.79.1` (Vercel) | sin impacto |
| `www` | `cname.vercel-dns.com` | sin impacto |
| `MX` | `mx1/mx2.privateemail.com` | se conserva; Brevo no toca MX en envío compartido |
| `TXT` raíz | `v=spf1 include:spf.privateemail.com ~all` | **SPF ya existe: editar, nunca añadir un segundo** |
| `_dmarc` | *ausente* | Brevo lo creará sin sobrescribir nada |
| DKIM | *ausente* | falta agregar el de Brevo |
| `brevo-code` | *ausente* | falta agregar |
| `mail.retirobtc.mx` | `CNAME → privateemail.com` | **conflicto potencial**, ver §4 |

Nada bloquea la autenticación: el dominio es tuyo, resuelve y tienes control total de la zona.

## 3. Pasos

1. **Settings → Remitentes, dominio, IP → Añadir un dominio.**
2. Dominio: `retirobtc.mx` (sin `hola@`, sin `https://`, sin `www`).
3. **Subdominio con marca:** usa `email.retirobtc.mx` o `send.retirobtc.mx`.
   No uses `mail.retirobtc.mx`: ya apunta a PrivateEmail.
4. **Método de configuración:** *Autenticar el dominio manualmente*.
   El modo automático pide credenciales de Namecheap y puede reescribir el SPF existente.
5. Copia los 3–4 registros que muestre Brevo a Namecheap → *Advanced DNS*:
   - `brevo-code` → TXT
   - DKIM → 1 TXT o 2 CNAME (ver §4)
   - DMARC → TXT
6. Vuelve a Brevo → **Authenticate this email domain**.
7. Crea el remitente `hola@retirobtc.mx`.

## 4. Trampas específicas de este dominio

**El campo Host de Namecheap no lleva el dominio.** Namecheap concatena la zona sola. Si pegas el
nombre completo terminas creando `_dmarc.retirobtc.mx.retirobtc.mx`, que es la causa más común de
"autenticación pendiente" indefinida.

| Brevo muestra | En Namecheap escribes |
|---------------|-----------------------|
| `retirobtc.mx` | `@` |
| `_dmarc.retirobtc.mx` | `_dmarc` |
| `brevo1._domainkey.retirobtc.mx` | `brevo1._domainkey` |

**Prefiere el DKIM de 2 CNAME.** `mail.retirobtc.mx` ya es un CNAME hacia PrivateEmail, y un nodo
CNAME no debería tener hijos. Si Brevo te ofrece el DKIM de un solo TXT en `mail._domainkey`,
Namecheap puede rechazarlo o servirlo de forma inconsistente. La variante de dos CNAME
(`brevo1._domainkey` / `brevo2._domainkey`) evita el nodo `mail` por completo y además usa clave
de 2048 bits en vez de 1024.

**SPF: editar, no duplicar.** Solo puede existir un registro SPF por dominio; dos invalidan ambos.
El envío compartido de Brevo no requiere SPF (la alineación la da DKIM), así que lo más seguro es
dejarlo como está. Si más adelante quieres alineación SPF, modifica el registro existente:

```
v=spf1 include:spf.privateemail.com include:spf.brevo.com ~all
```

**DMARC:** al no existir uno previo, empieza con la política permisiva de Brevo
(`v=DMARC1; p=none; rua=mailto:...`), revisa los reportes agregados y endurece a `quarantine`
solo cuando PrivateEmail y Brevo pasen alineados.

## 5. Verificación desde terminal

```bash
D=retirobtc.mx
dig +short $D TXT                      # brevo-code + SPF (un solo v=spf1)
dig +short _dmarc.$D TXT               # v=DMARC1
dig +short brevo1._domainkey.$D CNAME  # DKIM 1
dig +short brevo2._domainkey.$D CNAME  # DKIM 2
```

Propagación típica en Namecheap: 30 minutos, hasta 24 h. Si los valores están publicados y Brevo
sigue marcando error, casi siempre es un host duplicado o con el dominio concatenado (§4).
