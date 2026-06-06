import { useEffect } from "react";
import { burstConfetti } from "../lib/confetti-burst";

interface Props {
  amountMxn?: number;
  onDismiss?: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export function InvestmentWowMoment({ amountMxn, onDismiss }: Props) {
  useEffect(() => {
    burstConfetti();

    const timer = window.setTimeout(() => {
      onDismiss?.();
    }, 5500);

    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[9999] w-[min(92vw,24rem)] -translate-x-1/2 wow-slide-up"
    >
      <div className="wow-glow rounded-2xl border border-brand-500/50 bg-surface-elevated/95 p-4 shadow-2xl backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-lg wow-pop">
            ⚡
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-brand-500">¡Capital activo!</p>
            <p className="text-sm text-neutral-200">
              Tu SPEI dejó de estar inactivo — el agente ya compró CETES on-chain.
            </p>
            {amountMxn != null && amountMxn > 0 && (
              <p className="text-xs text-neutral-500">
                {fmt(amountMxn)} · rendimiento ~11% anual vs ~7.8% AFORE
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
