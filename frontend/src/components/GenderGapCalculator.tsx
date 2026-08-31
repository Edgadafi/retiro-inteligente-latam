import { useState } from "react";
import { CompassIcon } from "../components/ui/CompassIcon";
import {
  BodyText,
  DisplayH1,
  FinancialData,
  RitoLabel,
} from "../components/ui/RitoTypography";
import { fetchGenderGap, type GenderGapResult } from "../lib/projection";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export function GenderGapCalculator() {
  const [age, setAge] = useState(32);
  const [weekly, setWeekly] = useState(200);
  const [pauseYears, setPauseYears] = useState(3);
  const [result, setResult] = useState<GenderGapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function calculate() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGenderGap({
        currentAge: age,
        weeklyContribution: weekly,
        carePauseYears: pauseYears,
      });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "No se pudo calcular");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="flex items-start gap-3">
        <CompassIcon size={36} variant="dark" pulse={loading} className="shrink-0 mt-1" />
        <div className="min-w-0 flex-1">
          <DisplayH1 as="h2" className="text-rita-frost !text-xl sm:!text-2xl">
            Calculadora de brecha pensional
          </DisplayH1>
          <BodyText className="text-rita-mist mt-1 sm:mt-2">
            Modela pausas por cuidados, brecha salarial (~16%) y 6 años extra de retiro.
            Es una estimación educativa — no una pensión.
          </BodyText>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block space-y-2">
          <RitoLabel className="text-rita-mist">Edad actual</RitoLabel>
          <input
            type="number"
            min={18}
            max={80}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="w-full bg-rita-card border border-rita-border rounded-xl px-4 py-3 text-rita-frost font-mono text-base focus:outline-none focus-visible:border-rita-amber transition-colors"
          />
        </label>
        <label className="block space-y-2">
          <RitoLabel className="text-rita-mist">Ahorro semanal (MXN)</RitoLabel>
          <input
            type="number"
            min={1}
            value={weekly}
            onChange={(e) => setWeekly(Number(e.target.value))}
            className="w-full bg-rita-card border border-rita-border rounded-xl px-4 py-3 text-rita-frost font-mono text-base focus:outline-none focus-visible:border-rita-amber transition-colors"
          />
        </label>
        <label className="block space-y-2">
          <RitoLabel className="text-rita-mist">Años de pausa por cuidados</RitoLabel>
          <input
            type="number"
            min={0}
            max={20}
            value={pauseYears}
            onChange={(e) => setPauseYears(Number(e.target.value))}
            className="w-full bg-rita-card border border-rita-border rounded-xl px-4 py-3 text-rita-frost font-mono text-base focus:outline-none focus-visible:border-rita-amber transition-colors"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void calculate()}
        disabled={loading}
        className="cursor-pointer w-full sm:w-auto bg-rita-amber hover:bg-rita-amber-d text-rita-night font-display font-semibold transition-colors px-6 py-3 rounded-xl disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rita-gold"
      >
        {loading ? "Calculando…" : "Ver mi brecha"}
      </button>

      {error && <p className="text-rita-error text-sm">{error}</p>}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-rita-card border border-rita-border rounded-xl p-4 sm:p-5">
              <RitoLabel className="text-rita-mist block">Tu fondo CETES</RitoLabel>
              <FinancialData className="text-xl sm:text-2xl text-rita-gold mt-2 block">
                {fmt(result.ritaCetes.finalFund)}
              </FinancialData>
              <BodyText className="text-rita-mist !text-xs mt-1">
                {result.inputs.contributingYears} años cotizando
              </BodyText>
            </div>
            <div className="bg-rita-card border border-rita-border rounded-xl p-4 sm:p-5">
              <RitoLabel className="text-rita-mist block">Carrera continua</RitoLabel>
              <FinancialData className="text-xl sm:text-2xl text-rita-frost mt-2 block">
                {fmt(result.counterfactual.finalFund)}
              </FinancialData>
              <BodyText className="text-rita-mist !text-xs mt-1">
                Sin pausa, sin brecha salarial
              </BodyText>
            </div>
            <div className="bg-rita-card border border-rita-amber/40 rounded-xl p-4 sm:p-5">
              <RitoLabel className="text-rita-amber block">Brecha de acumulación</RitoLabel>
              <FinancialData className="text-xl sm:text-2xl text-rita-amber mt-2 block">
                {fmt(result.gapMxn)}
              </FinancialData>
              <BodyText className="text-rita-mist !text-xs mt-1">
                {result.weeklyToCloseGap !== null
                  ? `${fmt(result.weeklyToCloseGap)} extra / semana para cerrarla`
                  : "Horizonte de aportación insuficiente"}
              </BodyText>
            </div>
          </div>
          <p className="text-rita-mist text-xs leading-relaxed">
            {result.extraRetirementYears} años extra de retiro a financiar. Retiro anual estimado:{" "}
            {fmt(result.annualDrawdownRita)} vs {fmt(result.annualDrawdownCounterfactual)}{" "}
            (brecha de ingreso {fmt(result.incomeGapMxn)}/año). {result.disclaimer}
          </p>
        </div>
      )}
    </section>
  );
}
