# Rito: Retiro Inteligente LATAM 🧭

**Tu futuro financiero, automático.**

Proyecto para **Ethereum México 2026** (AI & Agentic Finance)

Rito es una infraestructura de ahorro automatizado diseñada para la gig economy. Mediante un agente de IA autónomo (**Rito**) y la integración con Etherfuse en Arbitrum, convertimos flujos de efectivo informales (SPEI) en bonos soberanos tokenizados (CETES) sin que el usuario toque cripto.

🚀 **Demo en vivo:** [retiro-inteligente-latam.vercel.app](https://retiro-inteligente-latam.vercel.app)

📐 **Arquitectura y diagramas:** [ARCHITECTURE.md](./ARCHITECTURE.md)  
📋 **FAQ hackathon:** [docs/FAQ.md](./docs/FAQ.md)

## 🧠 Arquitectura del Agente

- **Pay-in:** Procesamiento de SPEI mediante CLABE virtual.
- **Agentic Finance:** Uso de CDP AgentKit + MCP para orquestar la inversión.
- **Yield:** Etherfuse (Stablebonds) sobre Arbitrum.
- **Resiliencia:** Modos Sandbox (On-chain + Chat) para garantizar 100% Uptime en la demo.

## 🛠 Stack Tecnológico

- **IA:** OpenAI (Tool-use) + Sandbox Fallback.
- **Blockchain:** Arbitrum (L2) + Etherfuse API.
- **Infra:** Vercel (Frontend/API) + Supabase (Estado).
- **Design:** Rito Design System (DM Sans + Ambar Identity).

## 📡 API REST

Base URL producción: `https://retiro-inteligente-latam.vercel.app/api`  
Base URL local: `http://localhost:3001/api`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Estado del servicio + flags de integración |
| `GET` | `/test-db-connection` | Prueba conexión y schema Supabase |
| `POST` | `/test-db-connection` | Idem (usado por el demo UI) |
| `POST` | `/onboarding` | Crear plan, CLABE, wallet agéntico |
| `GET` | `/onboarding/:userId` | Consultar plan de ahorro |
| `POST` | `/demo/simulate-spei` | Simular depósito SPEI (hackathon demo) |
| `GET` | `/deposits/:fid` | Estado del depósito + fases UI |
| `POST` | `/deposits/:fid/retry` | Reintentar settlement manual |
| `GET` | `/wallet?userId=` | Monedero agéntico (dirección, balance, TEE) |
| `GET` | `/wallet/transactions?userId=` | Historial de depósitos del usuario |
| `POST` | `/wallet/link` | Vincular wallet usuario (SIWE) |
| `POST` | `/wallet/withdraw` | Solicitar retiro (stub) |
| `POST` | `/projection` | Proyección de retiro CETES vs AFORE |
| `GET` | `/agent/config` | Políticas TEE + metadata MCP (sin secretos) |
| `GET` | `/agent/tools` | Lista de herramientas MCP disponibles |
| `POST` | `/agent/chat` | Chat con Rito (OpenAI o sandbox) |
| `POST` | `/webhooks/bitso/funding` | Webhook SPEI Bitso/Juno (producción) |

## 💡 ¿Por qué Rito?

- **Fricción Cero:** El usuario vive en el sistema financiero tradicional (SPEI).
- **Transparencia Radical:** Cada inversión es un evento on-chain auditable.
- **Seguridad TEE:** El usuario no gestiona llaves, la gestión es custodial agéntica.
