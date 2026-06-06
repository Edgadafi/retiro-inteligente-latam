import type { DepositUiState } from "../lib/deposits";

const STEPS = [
  { phase: 1 as const, label: "Recibiendo" },
  { phase: 2 as const, label: "Validando con Banco" },
  { phase: 3 as const, label: "Invertido" },
];

interface Props {
  ui: DepositUiState | null;
  fid?: string;
}

export function DepositStatusStepper({ ui, fid }: Props) {
  if (!ui) return null;

  const currentPhase = ui.isFailed ? "error" : ui.phase;

  return (
    <div className="bg-surface-elevated border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500 uppercase">Estado del depósito</p>
        {fid && <p className="text-xs font-mono text-neutral-600">{fid}</p>}
      </div>

      <ol className="flex flex-col sm:flex-row gap-4 sm:gap-2">
        {STEPS.map((step, index) => {
          const done =
            typeof currentPhase === "number" && currentPhase > step.phase;
          const active =
            typeof currentPhase === "number" && currentPhase === step.phase;
          const failed = ui.isFailed && index === STEPS.length - 1 && !ui.isComplete;

          return (
            <li key={step.phase} className="flex-1 flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${
                  failed
                    ? "border-red-500/50 text-red-400"
                    : done
                      ? "border-brand-500 bg-brand-500/20 text-brand-500"
                      : active
                        ? "border-brand-500 text-brand-500"
                        : "border-border text-neutral-600"
                }`}
              >
                {done ? "✓" : active && !ui.isComplete ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                ) : (
                  step.phase
                )}
              </span>
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    active || done ? "text-neutral-100" : "text-neutral-500"
                  }`}
                >
                  {failed ? "Error" : step.label}
                </p>
                {active && (
                  <p className="text-xs text-neutral-500 mt-0.5">{ui.description}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {ui.isComplete && (
        <p className="text-sm text-brand-500 border-t border-border pt-3">
          MXNB acreditado y CETES confirmado por el agente.
        </p>
      )}
      {ui.isFailed && (
        <p className="text-sm text-red-400 border-t border-border pt-3">{ui.description}</p>
      )}
    </div>
  );
}
