import { useState } from "react";
import { CompassIcon } from "../components/ui/CompassIcon";
import {
  BodyText,
  DisplayH1,
  FinancialData,
  RitoLabel,
} from "../components/ui/RitoTypography";
import { fetchGenderGap, type GenderGapResult } from "../lib/projection";
import { AUREO, buildAureoUrl, type ProjectionCurrency } from "../lib/partners";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export function GenderGapCalculator() {
  const [age, setAge] = useState(32);
  const [weekly, setWeekly] = useState(200);
  const [pauseYears, setPauseYears] = useState(3);
  const [currency, setCurrency] = useState<ProjectionCurrency>("MXN");
  const [result, setResult] = useState<GenderGapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** docs/rita-soul.md §2: el CTA de Aureo se habilita al proyectar en MXN. */
  const aureoEnabled = currency === "MXN";

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

      <fieldset className="space-y-2">
        <legend className="rito-label text-rita-mist">
          Moneda de proyección para tu reserva Bitcoin
        </legend>
        <div className="flex gap-2" role="radiogroup" aria-label="Moneda de proyección">
          {(["MXN", "BTC"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={currency === c}
              onClick={() => setCurrency(c)}
              className={`cursor-pointer px-4 py-2 rounded-xl border text-sm font-display transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rita-amber ${
                currency === c
                  ? "border-rita-amber bg-rita-amber text-rita-night font-semibold"
                  : "border-rita-border text-rita-mist hover:border-rita-amber/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <BodyText className="text-rita-mist !text-xs">
          {aureoEnabled
            ? "Aportas en pesos por SPEI y recibes Bitcoin en tu propia wallet."
            : "No proyectamos el precio de Bitcoin. Tu reserva se mide por lo que acumulas, no por un rendimiento estimado."}
        </BodyText>
      </fieldset>

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

          <div className="bg-rita-card border border-rita-border rounded-xl p-4 sm:p-5 space-y-3">
            <div>
              <RitoLabel className="text-rita-mist block">Reserva de largo plazo</RitoLabel>
              <BodyText className="text-rita-mist !text-sm mt-1">
                Tu reserva en Bitcoin se construye con {AUREO.name}: aportas por SPEI y el Bitcoin
                llega a tu propia wallet (no custodial). Comisión escalonada según monto; consulta
                las tarifas vigentes en su sitio.
              </BodyText>
            </div>
            {aureoEnabled ? (
              <a
                href={buildAureoUrl("calculadora-brecha")}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer inline-flex items-center gap-2 bg-rita-amber hover:bg-rita-amber-d text-rita-night font-display font-semibold px-5 py-3 rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rita-gold"
              >
                Comprar Bitcoin con {AUREO.name}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M7 17 17 7M17 7H9M17 7v8" />
                </svg>
              </a>
            ) : (
              <p className="text-rita-mist text-xs">
                Selecciona <span className="text-rita-gold">MXN</span> como moneda de proyección
                para continuar con {AUREO.name}.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
