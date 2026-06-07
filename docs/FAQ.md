# FAQ — Hackathon ETHMX 2026

Preguntas frecuentes para jurado técnico y revisión de producto. Versión demo: [retiro-inteligente-latam.vercel.app](https://retiro-inteligente-latam.vercel.app)

---

## 1. ¿Por qué el explorador de bloques (Arbiscan) muestra actividad limitada o vacía en el contrato de Etherfuse?

Como parte de nuestra estrategia de hackathon, hemos desacoplado la lógica del frontend de la ejecución on-chain en tiempo real para garantizar una experiencia fluida al usuario demo. Estamos interactuando contra los endpoints de prueba del protocolo Etherfuse en Arbitrum Sepolia. Nuestra arquitectura es modular: el pipeline de inversión está listo y verificado, y la integración final a mainnet es un proceso de configuración de endpoints una vez superada la fase de validación de agilidad de Rito.

---

## 2. ¿Es Rito un custodio de dinero de los usuarios?

No. Rito utiliza un modelo de **gestión custodial agéntica** (CDP AgentKit). El usuario nunca maneja llaves privadas, pero tampoco existe un “wallet maestro” centralizado que concentre fondos de forma opaca. Cada usuario tiene su propia identidad on-chain gestionada por nuestro agente, lo que permite que la trazabilidad de los fondos sea directa desde el origen (SPEI) hasta el activo (Stablebond) en Arbitrum.

---

## 3. ¿Cómo compiten contra AFOREs o bancos tradicionales?

No competimos — resolvemos el problema de **la última milla del ahorro**. El trabajador informal no deja de usar el banco, pero el banco no le ofrece herramientas para micro-ahorro de alta eficiencia. Rito captura esos excedentes que hoy se pierden en el consumo diario y los pone a trabajar en activos de renta fija (CETES tokenizados), entregando retornos superiores al promedio de la banca tradicional.

---

## 4. ¿Qué sucede si la API de OpenAI o los servicios de terceros fallan?

Rito fue diseñado para ser **resiliente**. Implementamos un sistema de Modos Sandbox y fallbacks automáticos. Si el agente no puede comunicarse con la API de IA, el sistema cambia a un modo de reglas heurísticas predefinidas, garantizando que la ejecución de la inversión y la seguridad de los fondos no se interrumpan nunca.

Variables relevantes: `AGENT_CHAT_SANDBOX_MODE`, `ONCHAIN_SANDBOX_MODE`. Ver [ARCHITECTURE.md](../ARCHITECTURE.md).

---

## 5. ¿Cuál es el modelo de monetización a largo plazo?

Nuestro modelo se basa en un **spread eficiente** sobre la gestión de rendimientos y servicios de valor agregado para empresas de gig economy que quieran ofrecer mejores beneficios a sus trabajadores. No cobramos comisiones por depósito; participamos en el éxito del rendimiento generado.

---

## Documentación relacionada

| Recurso | Descripción |
|---------|-------------|
| [README.md](../README.md) | Pitch + tabla de API |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Diagramas, pipelines, MCP tools |
| [docs/FAQ.md](./FAQ.md) | Preguntas frecuentes hackathon (este documento) |
