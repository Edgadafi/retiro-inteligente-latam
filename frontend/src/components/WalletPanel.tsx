import { useEffect, useState } from "react";
import { CompassIcon } from "./ui/CompassIcon";
import { BodyText, RitoLabel } from "./ui/RitoTypography";
import {
  fetchWallet,
  truncateAddress,
  type OnboardingWallet,
  type WalletResponse,
} from "../lib/wallet";

interface Props {
  userId: string;
  initialWallet?: OnboardingWallet;
}

export function WalletPanel({ userId, initialWallet }: Props) {
  const [wallet, setWallet] = useState<WalletResponse | null>(
    initialWallet
      ? {
          address: initialWallet.address,
          networkId: initialWallet.networkId,
          mode: initialWallet.mode,
          teeSpending: {
            dailyLimitMxnb: 500,
            spentTodayMxnb: 0,
            remainingMxnb: 500,
            resetWindowHours: 24,
          },
        }
      : null,
  );
  const [loading, setLoading] = useState(!initialWallet);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchWallet(userId)
      .then((w) => {
        if (!cancelled) setWallet(w);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function copyAddress() {
    if (!wallet?.address) return;
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading && !wallet) {
    return (
      <div className="bg-rito-elevated border border-rito-deep/50 rounded-xl p-4 animate-pulse">
        <p className="text-rito-mist text-sm">Cargando monedero…</p>
      </div>
    );
  }

  if (error && !wallet) {
    return (
      <div className="bg-rito-elevated border border-rito-error/30 rounded-xl p-4">
        <p className="text-rito-error text-sm">{error}</p>
      </div>
    );
  }

  if (!wallet) return null;

  const spendPct =
    wallet.teeSpending.dailyLimitMxnb > 0
      ? Math.min(
          100,
          (wallet.teeSpending.spentTodayMxnb / wallet.teeSpending.dailyLimitMxnb) * 100,
        )
      : 0;

  return (
    <div className="bg-rito-elevated border border-rito-deep/50 rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-start gap-3">
        <CompassIcon size={32} variant="dark" className="shrink-0" />
        <div className="flex-1 min-w-0">
          <RitoLabel className="text-rito-compass">Monedero agéntico</RitoLabel>
          <BodyText className="text-rito-frost !text-sm font-medium mt-0.5">
            {wallet.mode === "sandbox" ? "Sandbox demo" : "Agente Rito · TEE"}
          </BodyText>
          <p className="text-rito-mist text-xs mt-1">
            Rito opera on-chain por ti — sin seed ni claves en la app.
          </p>
        </div>
        <span
          className={`shrink-0 text-[10px] px-2 py-1 rounded-full border ${
            wallet.mode === "sandbox"
              ? "border-rito-amber/40 text-rito-amber"
              : "border-rito-ocean/40 text-rito-compass"
          }`}
        >
          {wallet.mode === "sandbox" ? "Demo" : "CDP"}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <code className="text-xs sm:text-sm text-rito-frost font-mono truncate">
            {truncateAddress(wallet.address, 6)}
          </code>
          <button
            type="button"
            onClick={() => void copyAddress()}
            className="text-xs text-rito-compass hover:text-rito-frost shrink-0"
          >
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        {wallet.explorerUrl && (
          <a
            href={wallet.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-rito-ocean hover:text-rito-compass"
          >
            Ver en Arbiscan →
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-rito-mist text-xs">Red</p>
          <p className="text-rito-frost">{wallet.networkId}</p>
        </div>
        <div>
          <p className="text-rito-mist text-xs">Balance MXNB</p>
          <p className="text-rito-frost">
            {wallet.balanceMxnb != null ? wallet.balanceMxnb.toFixed(2) : "—"}
          </p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-rito-mist mb-1">
          <span>Límite diario TEE</span>
          <span>
            {wallet.teeSpending.remainingMxnb.toFixed(0)} /{" "}
            {wallet.teeSpending.dailyLimitMxnb} MXNB
          </span>
        </div>
        <div className="h-1.5 bg-rito-deep rounded-full overflow-hidden">
          <div
            className="h-full bg-rito-ocean rounded-full transition-all"
            style={{ width: `${100 - spendPct}%` }}
          />
        </div>
      </div>

      {wallet.linkedWalletAddress && (
        <div className="pt-2 border-t border-rito-deep/40">
          <p className="text-rito-mist text-xs">Wallet vinculada (retiros)</p>
          <p className="text-rito-compass text-sm font-mono truncate">
            {truncateAddress(wallet.linkedWalletAddress)}
          </p>
        </div>
      )}
    </div>
  );
}
