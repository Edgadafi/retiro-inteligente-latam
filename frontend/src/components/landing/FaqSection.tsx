import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BodyText, DisplayH1, RitoLabel } from "../ui/RitoTypography";

export const HACKATHON_FAQ = [
  {
    id: "arbiscan",
    question:
      "¿Por qué Arbiscan muestra actividad limitada en el contrato de Etherfuse?",
    answer:
      "Como parte de nuestra estrategia de hackathon, desacoplamos el frontend de la ejecución on-chain en tiempo real para una demo fluida. Interactuamos contra endpoints de prueba de Etherfuse en Arbitrum Sepolia. El pipeline de inversión está listo y verificado; la integración a mainnet es configuración de endpoints tras validar la agilidad de Rito.",
  },
  {
    id: "custodia",
    question: "¿Es Rito un custodio de dinero de los usuarios?",
    answer:
      "No. Rito usa gestión custodial agéntica (CDP AgentKit). El usuario no maneja llaves privadas, ni hay un wallet maestro opaco. Cada usuario tiene identidad on-chain gestionada por el agente, con trazabilidad directa desde SPEI hasta Stablebond en Arbitrum.",
  },
  {
    id: "afore",
    question: "¿Cómo compiten contra AFOREs o bancos tradicionales?",
    answer:
      "No competimos — resolvemos la última milla del ahorro. El trabajador informal sigue usando el banco, pero sin herramientas de micro-ahorro eficiente. Rito captura excedentes del consumo diario y los orienta a CETES tokenizados, con retornos superiores al promedio bancario.",
  },
  {
    id: "resiliencia",
    question: "¿Qué pasa si falla OpenAI u otro servicio de terceros?",
    answer:
      "Rito es resiliente: modos Sandbox y fallbacks automáticos. Si la API de IA no responde, el agente pasa a reglas heurísticas + MCP, sin interrumpir inversión ni seguridad de fondos.",
  },
  {
    id: "monetizacion",
    question: "¿Cuál es el modelo de monetización a largo plazo?",
    answer:
      "Spread eficiente sobre gestión de rendimientos y servicios B2B para plataformas gig que quieran mejores beneficios para trabajadores. Sin comisión por depósito — participamos en el éxito del rendimiento generado.",
  },
] as const;

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-rito-deep/50 rounded-xl overflow-hidden bg-rito-elevated/80">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-3 px-4 py-4 sm:px-5 text-left hover:bg-rito-deep/20 transition-colors"
        aria-expanded={open}
      >
        <span className="font-display font-medium text-sm sm:text-base text-rito-frost">
          {question}
        </span>
        <span
          className={`shrink-0 text-rito-compass text-lg leading-none transition-transform ${
            open ? "rotate-45" : ""
          }`}
          aria-hidden
        >
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <BodyText className="text-rito-mist !text-sm px-4 pb-4 sm:px-5 sm:pb-5 border-t border-rito-deep/40 pt-3">
              {answer}
            </BodyText>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(HACKATHON_FAQ[0].id);

  return (
    <section className="px-4 py-12 sm:py-16 bg-rito-night border-t border-rito-deep/40">
      <div className="max-w-3xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-2 text-center sm:text-left"
        >
          <RitoLabel className="text-rito-amber block">Hackathon FAQ</RitoLabel>
          <DisplayH1 as="h2" className="text-rito-frost !text-xl sm:!text-2xl">
            Preguntas del jurado
          </DisplayH1>
          <BodyText className="text-rito-mist !text-sm">
            Respuestas técnicas y de producto para ETHMX 2026 · AI &amp; Agentic
            Finance
          </BodyText>
        </motion.div>

        <div className="space-y-3">
          {HACKATHON_FAQ.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <FaqItem
                question={item.question}
                answer={item.answer}
                open={openId === item.id}
                onToggle={() =>
                  setOpenId((prev) => (prev === item.id ? null : item.id))
                }
              />
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-rito-mist font-mono">
          docs/FAQ.md en GitHub · misma fuente para revisión de código
        </p>
      </div>
    </section>
  );
}
