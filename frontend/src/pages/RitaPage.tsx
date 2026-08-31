import { AppShell } from "../components/layout/AppShell";
import { AgentChat } from "./AgentChat";
import { GenderGapCalculator } from "../components/GenderGapCalculator";
import { CompassIcon } from "../components/ui/CompassIcon";
import { BodyText, DisplayH1, RitoLabel } from "../components/ui/RitoTypography";
import { Onboarding } from "./Onboarding";

interface Props {
  onBack: () => void;
}

const RITA_STARTERS = [
  "¿Cuál es mi brecha si tengo 32 años, ahorro $200 a la semana y 3 años de pausa?",
  "¿Qué pasa con mi retiro si pauso por cuidados?",
  "¿Qué son los CETES y por qué rinden más que mi AFORE?",
];

export function RitaPage({ onBack }: Props) {
  return (
    <div className="rita-root min-h-screen">
      <AppShell>
        <div className="space-y-10 sm:space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CompassIcon size={36} variant="dark" />
              <div>
                <RitoLabel className="text-rita-mist">Unlock Summit 2026 · Zacatlán</RitoLabel>
                <p className="font-display font-semibold text-rita-frost">Rita</p>
                <p className="text-xs text-rita-mist">Retiro complementario para mujeres</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer text-sm text-rita-amber hover:text-rita-gold border border-rita-border hover:border-rita-amber/50 px-4 py-2 rounded-xl transition-colors self-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rita-amber"
            >
              Volver
            </button>
          </div>

          <section className="space-y-3 max-w-2xl">
            <DisplayH1 className="text-rita-frost">
              El retiro también tiene brecha de género
            </DisplayH1>
            <BodyText className="text-rita-mist">
              Las mujeres viven más, cotizan menos y se pensionan con montos menores. Rita
              convierte un SPEI semanal en CETES tokenizados — ahorro voluntario, sin pedirte
              que aprendas cripto.
            </BodyText>
          </section>

          <GenderGapCalculator />
          <Onboarding userId="demo-rita-001" />
          <AgentChat
            persona="rita"
            userId="demo-rita-001"
            title="Rita — tu brújula"
            starters={RITA_STARTERS}
          />
        </div>
      </AppShell>
    </div>
  );
}
