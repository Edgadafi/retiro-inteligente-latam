import { useState } from "react";
import type { OnboardingResponse } from "../lib/onboarding";

interface Props {
  plan: OnboardingResponse | null;
  loading?: boolean;
  onGenerate?: () => void;
}

export function ClabeCard({ plan, loading, onGenerate }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyClabe() {
    if (!plan?.plan.clabe) return;
    await navigator.clipboard.writeText(plan.plan.clabe);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-surface-elevated border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-neutral-500 uppercase">CLABE SPEI (Juno mock)</p>
        {!plan && onGenerate && (
          <button
            onClick={onGenerate}
            disabled={loading}
            className="text-xs bg-brand-700 hover:bg-brand-500 px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {loading ? "Generando…" : "Generar CLABE"}
          </button>
        )}
      </div>

      {plan ? (
        <>
          <p className="text-2xl font-mono tracking-wider break-all">{plan.plan.clabe}</p>
          <div className="flex flex-wrap gap-2 text-sm text-neutral-400">
            <span>Beneficiario: {plan.speiInstructions.beneficiary}</span>
            <span>·</span>
            <span>Ref: {plan.speiInstructions.reference}</span>
          </div>
          <button
            onClick={copyClabe}
            className="text-xs border border-border hover:border-brand-500 px-3 py-1.5 rounded-md"
          >
            {copied ? "Copiado ✓" : "Copiar CLABE"}
          </button>
          <p className="text-xs text-neutral-500">
            Envía tu SPEI a esta cuenta. El reconciliador detectará el depósito y el agente
            invertirá en CETES automáticamente.
          </p>
        </>
      ) : (
        <p className="text-sm text-neutral-500">
          Genera tu CLABE virtual para saber a dónde enviar tu dinero.
        </p>
      )}
    </div>
  );
}
