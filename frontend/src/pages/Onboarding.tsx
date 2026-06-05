import { useState } from "react";
import {
  onboardUser,
  simulateSpeiDeposit,
  fetchHealth,
  type OnboardingResponse,
  type DemoDepositResponse,
} from "../lib/onboarding";

const DEMO_USER = "demo-gig-worker-001";

export function Onboarding() {
  const [plan, setPlan] = useState<OnboardingResponse | null>(null);
  const [demo, setDemo] = useState<DemoDepositResponse | null>(null);
  const [integrations, setIntegrations] = useState<Record<string, boolean | string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOnboard() {
    setLoading(true);
    setError(null);
    try {
      const [onboard, health] = await Promise.all([
        onboardUser(DEMO_USER),
        fetchHealth(),
      ]);
      setPlan(onboard);
      setIntegrations(health.integrations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulate() {
    setLoading(true);
    setError(null);
    try {
      if (!plan) await handleOnboard();
      const result = await simulateSpeiDeposit(DEMO_USER, 150);
      setDemo(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Onboarding SPEI → On-chain</h2>
        <p className="text-neutral-400 text-sm mt-1">
          CLABE virtual → MXNB → CETES (sandbox hasta configurar CDP/Juno/Etherfuse)
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleOnboard}
          disabled={loading}
          className="bg-brand-700 hover:bg-brand-500 px-5 py-3 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Procesando…" : "1. Crear plan + CLABE"}
        </button>
        <button
          onClick={handleSimulate}
          disabled={loading}
          className="border border-border hover:border-brand-500 px-5 py-3 rounded-lg text-sm disabled:opacity-50"
        >
          2. Simular depósito SPEI ($150)
        </button>
      </div>

      {integrations && (
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(integrations).map(([k, v]) => (
            <span
              key={k}
              className={`px-2 py-1 rounded-full border ${
                v === true || v === "arbitrum-sepolia"
                  ? "border-brand-500/40 text-brand-500"
                  : "border-border text-neutral-500"
              }`}
            >
              {k}: {String(v)}
            </span>
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {plan && (
        <div className="bg-surface-elevated border border-border rounded-xl p-5 space-y-3">
          <p className="text-xs text-neutral-500 uppercase">Tu CLABE SPEI</p>
          <p className="text-2xl font-mono tracking-wider">{plan.plan.clabe}</p>
          <p className="text-sm text-neutral-400">
            Referencia: {plan.speiInstructions.reference} · Wallet: {plan.walletStatus}
          </p>
        </div>
      )}

      {demo && (
        <div className="bg-surface-elevated border border-brand-500/30 rounded-xl p-5 space-y-2">
          <p className="text-xs text-brand-500 uppercase">Flujo on-chain completado</p>
          <p className="text-sm">
            Estado: <strong>{demo.deposit.status}</strong> · CETES:{" "}
            {demo.cetesInvested ? "✅ invertido" : "⏳ pendiente"}
          </p>
          <p className="text-xs text-neutral-500 font-mono">fid: {demo.deposit.fid}</p>
        </div>
      )}
    </section>
  );
}
