import { useEffect, useRef, useState } from "react";
import { ClabeCard } from "../components/ClabeCard";
import { DepositStatusStepper } from "../components/DepositStatusStepper";
import {
  onboardUser,
  simulateSpeiDeposit,
  fetchHealth,
  type OnboardingResponse,
} from "../lib/onboarding";
import {
  testDbConnection,
  pollDepositUntilSettled,
  type DepositUiState,
  type DbConnectionResponse,
} from "../lib/deposits";

const DEMO_USER = "demo-gig-worker-001";

export function Onboarding() {
  const [plan, setPlan] = useState<OnboardingResponse | null>(null);
  const [depositUi, setDepositUi] = useState<DepositUiState | null>(null);
  const [activeFid, setActiveFid] = useState<string | null>(null);
  const [dbTest, setDbTest] = useState<DbConnectionResponse | null>(null);
  const [integrations, setIntegrations] = useState<Record<string, boolean | string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopPollRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      stopPollRef.current?.();
    };
  }, []);

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

  async function handleTestDb() {
    setLoading(true);
    setError(null);
    try {
      const result = await testDbConnection();
      setDbTest(result);
      if (result.status !== "success") {
        setError(result.error ?? "Conexión DB fallida");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulate() {
    setLoading(true);
    setError(null);
    stopPollRef.current?.();

    try {
      if (!plan) await handleOnboard();
      const result = await simulateSpeiDeposit(DEMO_USER, 150);
      const { fid, ui } = result.data;

      setActiveFid(fid);
      setDepositUi(ui);

      stopPollRef.current = pollDepositUntilSettled(fid, (data) => {
        setDepositUi(data.ui);
        setActiveFid(data.deposit.fid);
      });
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
          onClick={handleTestDb}
          disabled={loading}
          className="border border-border hover:border-brand-500 px-5 py-3 rounded-lg text-sm disabled:opacity-50"
        >
          Test DB
        </button>
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

      {dbTest && (
        <div
          className={`text-sm px-4 py-3 rounded-lg border ${
            dbTest.status === "success"
              ? "border-brand-500/30 text-brand-500"
              : "border-red-500/30 text-red-400"
          }`}
        >
          DB: {dbTest.data.connection} · schema: {dbTest.data.db_schema} ·{" "}
          {dbTest.data.timestamp}
        </div>
      )}

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

      <ClabeCard plan={plan} loading={loading} onGenerate={handleOnboard} />

      <DepositStatusStepper ui={depositUi} fid={activeFid ?? undefined} />
    </section>
  );
}
