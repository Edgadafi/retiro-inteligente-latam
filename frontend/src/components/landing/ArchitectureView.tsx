import { motion } from "framer-motion";
import { CompassIcon } from "../ui/CompassIcon";
import { BodyText, DisplayH1, RitoLabel } from "../ui/RitoTypography";

const NODES = [
  { id: "user", label: "Usuario gig", sub: "SPEI / CLABE", layer: "edge" },
  { id: "webhook", label: "Juno Webhook", sub: "Bitso Business", layer: "payin" },
  { id: "db", label: "Supabase", sub: "deposits + logs", layer: "data" },
  { id: "recon", label: "Reconciliador", sub: "polling 60s", layer: "backend" },
  { id: "agent", label: "Rito + MCP", sub: "CDP AgentKit", layer: "ai" },
  { id: "chain", label: "Arbitrum", sub: "MXNB → CETES", layer: "onchain" },
] as const;

const EDGES = [
  ["user", "webhook"],
  ["webhook", "db"],
  ["db", "recon"],
  ["recon", "agent"],
  ["agent", "chain"],
] as const;

export function ArchitectureView() {
  return (
    <div className="space-y-0">
      <section className="px-4 pt-8 pb-6 sm:pt-12">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <CompassIcon size={48} variant="dark" pulse />
          <div>
            <RitoLabel className="text-rito-amber block">Hackathon mode</RitoLabel>
            <DisplayH1 as="h1" className="text-rito-frost !text-[1.5rem] sm:!text-[2rem]">
              Arquitectura del sistema
            </DisplayH1>
            <BodyText className="text-rito-mist !text-sm mt-1">
              Flujo de datos end-to-end · ETHMX 2026
            </BodyText>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:py-12 bg-rito-deep/25">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {NODES.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
                className="relative bg-rito-night border border-rito-ocean/35 rounded-xl p-3 sm:p-4 text-center"
              >
                <p className="text-[10px] uppercase tracking-wider text-rito-compass font-display">
                  {node.layer}
                </p>
                <p className="font-display font-semibold text-sm text-rito-frost mt-1">
                  {node.label}
                </p>
                <p className="text-[10px] text-rito-mist mt-0.5 font-mono">{node.sub}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-rito-elevated border border-rito-deep/50 rounded-2xl p-5 sm:p-6 font-mono text-xs sm:text-sm text-rito-mist overflow-x-auto"
          >
            <p className="text-rito-compass mb-3">// pipeline.ts</p>
            <pre className="whitespace-pre leading-relaxed">
{`SPEI → POST /api/webhooks/bitso/funding
     → deposits.status: pending → processing
     → settlement-processor (exponential backoff + jitter)
     → onDepositSettled() → purchase_stablebond (MCP)
     → deposits.status: invested
     → GET /api/deposits/:fid (ui.phase: 3 "Invertido")`}
            </pre>
          </motion.div>

          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {EDGES.map(([from, to]) => (
              <span
                key={`${from}-${to}`}
                className="text-[10px] font-mono px-2 py-1 rounded-full border border-rito-deep/60 text-rito-mist"
              >
                {from} → {to}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4">
          {[
            { k: "Idempotencia", v: "fid único por depósito SPEI" },
            { k: "Observabilidad", v: "deposit_state_logs + providerAudit" },
            { k: "Sandbox", v: "ONCHAIN_SANDBOX_MODE para demo sin CDP" },
          ].map((item, i) => (
            <motion.div
              key={item.k}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="border border-rito-ocean/25 rounded-xl p-4"
            >
              <p className="font-display font-semibold text-rito-frost text-sm">{item.k}</p>
              <p className="text-xs text-rito-mist mt-1">{item.v}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
