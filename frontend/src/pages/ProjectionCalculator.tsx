import { useState } from "react";
import { ClabeCard } from "../components/ClabeCard";
import { CompassIcon } from "../components/ui/CompassIcon";
import {
  BodyText,
  DisplayH1,
  FinancialData,
  RitoLabel,
} from "../components/ui/RitoTypography";
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
    <section className="space-y-5 sm:space-y-6">
      <div className="flex items-start gap-3">
        <CompassIcon
          size={36}
          variant="dark"
          pulse={loading}
          className="shrink-0 mt-1 sm:hidden"
        />
        <div className="min-w-0 flex-1">
          <DisplayH1 className="text-rito-frost">Calculadora de retiro</DisplayH1>
          <BodyText className="text-rito-mist mt-1 sm:mt-2">
            CETES tokenizados (~11%) vs AFORE promedio (~7.84%). Tu norte financiero,
            con números reales.
          </BodyText>
        </div>
        <CompassIcon
          size={44}
          variant="dark"
          pulse={loading}
          className="shrink-0 mt-1 hidden sm:block"
        />
      </div>

      <ClabeCard plan={plan} loading={clabeLoading} onGenerate={handleGenerateClabe} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block space-y-2">
          <RitoLabel className="text-rito-mist">Ahorro diario (MXN)</RitoLabel>
          <input
            type="number"
            value={daily}
            onChange={(e) => setDaily(Number(e.target.value))}
            className="w-full bg-rito-elevated border border-rito-deep/60 rounded-xl px-4 py-3 text-rito-frost font-mono text-base focus:outline-none focus:border-rito-compass transition-colors"
          />
        </label>
        <label className="block space-y-2">
          <RitoLabel className="text-rito-mist">Horizonte (años)</RitoLabel>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full bg-rito-elevated border border-rito-deep/60 rounded-xl px-4 py-3 text-rito-frost font-mono text-base focus:outline-none focus:border-rito-compass transition-colors"
          />
        </label>
      </div>

      <button
        onClick={calculate}
        disabled={loading}
        className="w-full sm:w-auto bg-rito-ocean hover:bg-rito-compass text-rito-slate font-display font-medium transition-colors px-6 py-3 rounded-xl disabled:opacity-50"
      >
        {loading ? "Calculando…" : "Proyectar fondo"}
      </button>

      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 sm:mt-6">
          <div className="bg-rito-elevated border border-rito-deep/50 rounded-xl p-4 sm:p-5">
            <RitoLabel className="text-rito-mist block">CETES Stablebonds</RitoLabel>
            <FinancialData className="text-xl sm:text-2xl text-rito-ocean mt-2 block">
              {fmt(result.cetes.finalFund)}
            </FinancialData>
          </div>
          <div className="bg-rito-elevated border border-rito-deep/50 rounded-xl p-4 sm:p-5">
            <RitoLabel className="text-rito-mist block">AFORE promedio</RitoLabel>
            <FinancialData className="text-xl sm:text-2xl text-rito-frost mt-2 block">
              {fmt(result.afore.finalFund)}
            </FinancialData>
          </div>
          <div className="bg-rito-elevated border border-rito-amber/40 rounded-xl p-4 sm:p-5">
            <RitoLabel className="text-rito-amber block">Ventaja CETES</RitoLabel>
            <FinancialData className="text-xl sm:text-2xl text-rito-amber mt-2 block">
              +{fmt(result.advantageMxnb)} ({result.advantagePercent}%)
            </FinancialData>
            <BodyText className="text-rito-mist !text-xs mt-1">
              Más retiro al mismo ritmo de ahorro
            </BodyText>
          </div>
        </div>
      )}
    </section>
  );
}
