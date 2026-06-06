import { AppShell } from "../components/layout/AppShell";
import { AgentChat } from "./AgentChat";
import { Onboarding } from "./Onboarding";
import { ProjectionCalculator } from "./ProjectionCalculator";
import { CompassIcon } from "../components/ui/CompassIcon";
import { WalletLinkSection } from "../components/WalletLinkSection";

interface Props {
  onBack: () => void;
}

export function DemoDashboard({ onBack }: Props) {
  return (
    <AppShell>
      <div className="space-y-10 sm:space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <CompassIcon size={36} variant="dark" />
            <div>
              <p className="font-display font-semibold text-rito-frost">Demo en vivo</p>
              <p className="text-xs text-rito-mist">
                Onboarding → proyección → agente Rito
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-rito-compass hover:text-rito-frost border border-rito-deep/60 hover:border-rito-ocean/50 px-4 py-2 rounded-xl transition-colors self-start"
          >
            ← Volver a landing
          </button>
        </div>

        <Onboarding />
        <WalletLinkSection userId="demo-gig-worker-001" />
        <ProjectionCalculator />
        <AgentChat />
      </div>
    </AppShell>
  );
}
