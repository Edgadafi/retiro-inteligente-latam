import { motion } from "framer-motion";
import { BodyText, DisplayH1, RitoLabel } from "../ui/RitoTypography";

const STACK = [
  {
    name: "Arbitrum",
    role: "Layer 2 · CETES on-chain",
    color: "#28A0F0",
    abbr: "ARB",
  },
  {
    name: "CDP AgentKit",
    role: "Wallet agéntica",
    color: "#0052FF",
    abbr: "CDP",
  },
  {
    name: "Juno / Bitso",
    role: "Pay-in SPEI → MXNB",
    color: "#0E7A8A",
    abbr: "JB",
  },
  {
    name: "Supabase",
    role: "Estado + auditoría",
    color: "#3ECF8E",
    abbr: "SB",
  },
  {
    name: "Etherfuse",
    role: "CETES Stablebonds",
    color: "#14A8BD",
    abbr: "EF",
  },
] as const;

export function TechStackSection() {
  return (
    <section className="px-4 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-3"
        >
          <RitoLabel className="text-rito-mist block">Tech stack & trust</RitoLabel>
          <DisplayH1 as="h2" className="text-rito-frost !text-[1.5rem] sm:!text-[2rem]">
            Infraestructura que aguanta el pitch
          </DisplayH1>
          <BodyText className="text-rito-mist max-w-lg mx-auto">
            Cada capa resuelve un problema real — no es un mockup, es un pipeline desplegado.
          </BodyText>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {STACK.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-rito-elevated border border-rito-deep/50 rounded-2xl p-4 flex flex-col items-center text-center gap-3 hover:border-rito-ocean/40 transition-colors"
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center font-mono font-medium text-sm text-rito-night"
                style={{ backgroundColor: tech.color }}
              >
                {tech.abbr}
              </div>
              <div>
                <p className="font-display font-semibold text-sm text-rito-frost">
                  {tech.name}
                </p>
                <p className="text-[11px] text-rito-mist mt-0.5">{tech.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
