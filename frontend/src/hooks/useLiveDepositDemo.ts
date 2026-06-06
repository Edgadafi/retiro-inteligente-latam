import { useEffect, useRef, useState } from "react";
import { simulateSpeiDeposit } from "../lib/onboarding";
import {
  pollDepositUntilSettled,
  testDbConnection,
  type DepositUiState,
} from "../lib/deposits";

const DEMO_USER = "demo-gig-worker-001";

export function useLiveDepositDemo() {
  const [ui, setUi] = useState<DepositUiState | null>(null);
  const [fid, setFid] = useState<string | null>(null);
  const [amountMxn, setAmountMxn] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stopPollRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    void testDbConnection()
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setBootstrapping(false);
      });
    return () => {
      cancelled = true;
      stopPollRef.current?.();
    };
  }, []);

  async function runSimulation(amount = 150) {
    setLoading(true);
    setError(null);
    stopPollRef.current?.();

    try {
      const result = await simulateSpeiDeposit(DEMO_USER, amount);
      const { fid: newFid, ui: newUi, deposit } = result.data;
      setFid(newFid);
      setUi(newUi);
      setAmountMxn(deposit.amountMxn);

      stopPollRef.current = pollDepositUntilSettled(newFid, (data) => {
        setUi(data.ui);
        setFid(data.deposit.fid);
        setAmountMxn(data.deposit.amountMxn);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en simulación");
    } finally {
      setLoading(false);
    }
  }

  return {
    ui,
    fid,
    amountMxn,
    loading,
    bootstrapping,
    error,
    runSimulation,
  };
}
