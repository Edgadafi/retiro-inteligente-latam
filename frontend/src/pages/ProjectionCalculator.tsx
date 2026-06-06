import { useState } from "react";
import { ClabeCard } from "../components/ClabeCard";
import { fetchProjection, type ProjectionResult } from "../lib/projection";
import { onboardUser, type OnboardingResponse } from "../lib/onboarding";

const DEMO_USER = "demo-gig-worker-001";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export function ProjectionCalculator() {
  const [daily, setDaily] = useState(50);
  const [years, setYears] = useState(20);
  const [result, setResult] = useState<ProjectionResult | null>(null);
  const [plan, setPlan] = useState<OnboardingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [clabeLoading, setClabeLoading] = useState(false);

  async function calculate() {
    setLoading(true);
    try {
      const data = await fetchProjection({
        contributionPerPeriod: daily,
        periods: years * 365,
        frequency: "daily",
      });
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateClabe() {
    setClabeLoading(true);
    try {
      const onboard = await onboardUser(DEMO_USER);
      setPlan(onboard);
    } catch {
      setPlan(null);
    } finally {
      setClabeLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Calculadora de Retiro</h2>
        <p className="text-neutral-400 mt-1 text-sm">
          CETES tokenizados (~11%) vs AFORE promedio (~7.84%)
        </p>
      </div>

      <ClabeCard plan={plan} loading={clabeLoading} onGenerate={handleGenerateClabe} />

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block space-y-2">
          <span className="text-sm text-neutral-400">Ahorro diario (MXN)</span>
          <input
            type="number"
            value={daily}
            onChange={(e) => setDaily(Number(e.target.value))}
            className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-3"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-neutral-400">Horizonte (años)</span>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-3"
          />
        </label>
      </div>

      <button
        onClick={calculate}
        disabled={loading}
        className="bg-brand-700 hover:bg-brand-500 transition-colors px-6 py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? "Calculando…" : "Proyectar fondo"}
      </button>

      {result && (
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-surface-elevated border border-border rounded-xl p-5">
            <p className="text-xs text-neutral-500 uppercase">CETES Stablebonds</p>
            <p className="text-2xl font-semibold mt-2">{fmt(result.cetes.finalFund)}</p>
          </div>
          <div className="bg-surface-elevated border border-border rounded-xl p-5">
            <p className="text-xs text-neutral-500 uppercase">AFORE promedio</p>
            <p className="text-2xl font-semibold mt-2">{fmt(result.afore.finalFund)}</p>
          </div>
          <div className="bg-surface-elevated border border-brand-500/30 rounded-xl p-5">
            <p className="text-xs text-brand-500 uppercase">Ventaja CETES</p>
            <p className="text-2xl font-semibold mt-2 text-brand-500">
              +{fmt(result.advantageMxnb)} ({result.advantagePercent}%)
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
