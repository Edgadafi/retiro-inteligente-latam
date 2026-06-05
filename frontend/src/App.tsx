import { AppShell } from "./components/layout/AppShell";
import { AgentChat } from "./pages/AgentChat";
import { Onboarding } from "./pages/Onboarding";
import { ProjectionCalculator } from "./pages/ProjectionCalculator";

export default function App() {
  return (
    <AppShell>
      <div className="space-y-12">
        <section className="space-y-4">
          <p className="text-neutral-400 max-w-2xl leading-relaxed">
            Micro-ahorro automático vía SPEI → MXNB (Bitso/Juno) → CETES tokenizados
            (Etherfuse/Arbitrum). Tu agente de IA gestiona el enrutamiento con claves
            protegidas en TEE.
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            {["Bitso Business", "Arbitrum", "Etherfuse", "CDP AgentKit"].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full border border-border text-neutral-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
        <Onboarding />
        <ProjectionCalculator />
        <AgentChat />
      </div>
    </AppShell>
  );
}
