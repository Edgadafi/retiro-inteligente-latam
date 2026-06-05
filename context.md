# Retiro Inteligente LATAM — Contexto Técnico y de Negocio

## 1. Reglas de Negocio e Impacto en LATAM

- **Sector informal excluido:** En México existen 16.3 millones de trabajadores independientes; el 99.5% no tiene acceso a la seguridad social ni cotiza para una pensión.
- **Contexto de Retención IMSS (Prueba Piloto):** Las reformas obligan a las plataformas de delivery a registrar en el IMSS a trabajadores que ganen un Salario Mínimo General (SMG) mensual (~$8,364 MXN). Quienes ganan menos son catalogados como "trabajadores independientes" y su seguridad social/retiro queda sujeto a su incorporación voluntaria.
- **Rendimiento de AFOREs:** El promedio ponderado de rendimiento de las Siefores para los trabajadores jóvenes (SB 90-94) ronda el **7.84%** nominal anual.
- **Alternativa del MVP:** Ofrecer ahorro voluntario automático en la stablecoin **MXNB** de Juno/Bitso y enrutar ese balance hacia **Stablebonds (CETES tokenizados)** de Etherfuse en Arbitrum One, que ofrecen rendimiento compuesto diario del **~11.00%** anual.

## 2. Fórmulas de Proyección Financiera

Para calcular el interés compuesto acumulado en CETES tokenizados a través del micro-ahorro diario:

$$V_f = A \times \frac{(1+r)^n - 1}{r}$$

Donde:
- $V_f$ = fondo final acumulado del plan de retiro
- $A$ = aportación periódica diaria/semanal automatizada
- $r$ = tasa de rendimiento compuesto diario (~11% anualizado en CETES)
- $n$ = número de periodos de ahorro

## 3. Stack de Integración

### Capa A: Rieles de Pago (Bitso Business & Juno API)

- CLABE virtual de depósito única por usuario (tipo `AUTO_PAYMENT`)
- **Pay-In:** SPEI → MXN → mint automático de MXNB en Arbitrum Sepolia (comisión cero)
- **Sandbox Juno:** `https://stage.buildwithjuno.com`

**MXNB Arbitrum Sepolia Testnet (6 decimales):**
- Proxy: `0x82B9e52b26A2954E113F94Ff26647754d5a4247D`
- Implementation: `0xb56E3E3769EfB85214Cb4fA42eBA198E9FDA92bf`

**MXNB Arbitrum One Mainnet:**
- Proxy: `0xF197FFC28c23E0309B5559e7a166f2c6164C80aA`

### Capa B: Rendimiento RWA (Etherfuse Stablebonds)

- Resolución CNBV P090/2024 — Stablebonds (CETES) exentos de registro de cotización pública
- Endpoints: Assets, Quotes, Orders (compra con MXNB)
- **CETES Arbitrum (6 decimales):** `0x834df4c1d8f51be24322e39e4766697be015512f`

### Capa C: IA y Agentic Wallet (Coinbase CDP AgentKit)

- Coinbase Agentic Wallet con claves en hardware TEE (Intel TDX-class)
- LLM interactúa vía JSON-RPC sobre MCP — nunca ve la frase semilla

**Políticas TEE:**
- **Spending Limits:** máx. $500 MXNB diarios
- **Address Whitelist:** solo MXNB Sepolia proxy y contratos Etherfuse

## 4. Sprint Inicial (Fase 1)

1. Monorepo `backend/` + `frontend/`
2. `backend/src/agent.ts` — inicializador con `@coinbase/cdp-agentkit-core`
3. `backend/src/controllers/payment.ts` — webhook Bitso Business → depósito CLABE → swap MXNB
