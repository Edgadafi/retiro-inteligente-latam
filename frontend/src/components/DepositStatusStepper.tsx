import { useEffect, useRef, useState } from "react";
import type { DepositUiState } from "../lib/deposits";
import { InvestmentWowMoment } from "./InvestmentWowMoment";

const STEPS = [
  { phase: 1 as const, label: "Recibiendo" },
  { phase: 2 as const, label: "Validando con Banco" },
  { phase: 3 as const, label: "Invertido" },
];

interface Props {
  ui: DepositUiState | null;
  fid?: string;
  amountMxn?: number;
}

export function DepositStatusStepper({ ui, fid, amountMxn }: Props) {
  const [showWow, setShowWow] = useState(false);
  const celebratedFid = useRef<string | null>(null);

  useEffect(() => {
    if (!fid) return;
    if (fid !== celebratedFid.current) {
      setShowWow(false);
    }
  }, [fid]);

  useEffect(() => {
    if (!ui?.isComplete || !fid || celebratedFid.current === fid) return;
    celebratedFid.current = fid;
    setShowWow(true);
  }, [ui?.isComplete, fid]);

  if (!ui) return null;

  const currentPhase = ui.isFailed ? "error" : ui.phase;

  return (
    <>
      <div
        className={`bg-surface-elevated border rounded-xl p-5 space-y-4 transition-all duration-700 ${
          ui.isComplete
            ? "border-brand-500/60 wow-glow"
            : "border-border"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-500 uppercase">Estado del depósito</p>
          <div className="flex items-center gap-2">
            {ui.isComplete && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-brand-500/50 text-brand-500 wow-pop">
                Activo on-chain
              </span>
            )}
            {fid && <p className="text-xs font-mono text-neutral-600">{fid}</p>}
          </div>
        </div>

        <ol className="flex flex-col sm:flex-row gap-4 sm:gap-2">
          {STEPS.map((step, index) => {
            const done =
              typeof currentPhase === "number" && currentPhase > step.phase;
            const active =
              typeof currentPhase === "number" && currentPhase === step.phase;
            const isFinalStep = step.phase === 3;
            const finalComplete = isFinalStep && ui.isComplete;
            const failed = ui.isFailed && index === STEPS.length - 1 && !ui.isComplete;

            return (
              <li key={step.phase} className="flex-1 flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm transition-all duration-500 ${
                    failed
                      ? "border-red-500/50 text-red-400"
                      : finalComplete
                        ? "border-brand-500 bg-brand-500 text-black scale-110 wow-pop"
                        : done
                          ? "border-brand-500 bg-brand-500/20 text-brand-500"
                          : active
                            ? "border-brand-500 text-brand-500"
                            : "border-border text-neutral-600"
                  }`}
                >
                  {done || finalComplete ? "✓" : active && !ui.isComplete ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  ) : (
                    step.phase
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      active || done || finalComplete
                        ? "text-neutral-100"
                        : "text-neutral-500"
                    }`}
                  >
                    {failed ? "Error" : step.label}
                  </p>
                  {(active || finalComplete) && (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {finalComplete
                        ? "CETES comprados — tu capital ya genera rendimiento"
                        : ui.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {ui.isComplete && (
          <div className="border-t border-brand-500/30 pt-3 space-y-1 wow-slide-up">
            <p className="text-sm font-medium text-brand-500">
              De SPEI pasivo a CETES activo — el agente cerró el ciclo.
            </p>
            <p className="text-xs text-neutral-500">
              MXNB acreditado · purchase_stablebond confirmado en Arbitrum
            </p>
          </div>
        )}
        {ui.isFailed && (
          <p className="text-sm text-red-400 border-t border-border pt-3">{ui.description}</p>
        )}
      </div>

      {showWow && (
        <InvestmentWowMoment
          amountMxn={amountMxn}
          onDismiss={() => setShowWow(false)}
        />
      )}
    </>
  );
}
