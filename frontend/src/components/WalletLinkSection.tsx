import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { BodyText, RitoLabel } from "./ui/RitoTypography";
import { linkWallet, requestWithdraw, truncateAddress } from "../lib/wallet";

interface Props {
  userId: string;
  linkedAddress?: string;
  onLinked?: (address: string) => void;
}

export function WalletLinkSection({ userId, linkedAddress: linkedProp, onLinked }: Props) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const [linkedAddress, setLinkedAddress] = useState(linkedProp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawMsg, setWithdrawMsg] = useState<string | null>(null);

  useEffect(() => {
    void import("../lib/wallet").then(({ fetchWallet }) =>
      fetchWallet(userId)
        .then((w) => {
          if (w.linkedWalletAddress) setLinkedAddress(w.linkedWalletAddress);
        })
        .catch(() => undefined),
    );
  }, [userId]);

  async function handleLink() {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Vincular wallet para retiros en Retiro Inteligente LATAM",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      }).prepareMessage();

      const signature = await signMessageAsync({ message });
      const result = await linkWallet({ userId, message, signature });
      setLinkedAddress(result.linkedWalletAddress);
      onLinked?.(result.linkedWalletAddress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al vincular");
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdrawStub() {
    setLoading(true);
    setError(null);
    setWithdrawMsg(null);
    try {
      const res = await requestWithdraw({ userId, amountMxnb: 10 });
      setWithdrawMsg(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-rito-elevated border border-rito-deep/50 rounded-xl p-4 sm:p-5 space-y-4">
      <div>
        <RitoLabel className="text-rito-compass">Tu wallet (retiros)</RitoLabel>
        <BodyText className="text-rito-mist !text-sm mt-1">
          Conecta MetaMask o WalletConnect para recibir retiros. Rito sigue invirtiendo
          desde el monedero agéntico.
        </BodyText>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ConnectButton
          chainStatus="icon"
          showBalance={false}
          accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
        />
        {isConnected && address && !linkedAddress && (
          <button
            type="button"
            onClick={() => void handleLink()}
            disabled={loading}
            className="text-sm bg-rito-ocean hover:bg-rito-compass text-rito-slate px-4 py-2 rounded-xl disabled:opacity-50"
          >
            {loading ? "Firmando…" : "Vincular con SIWE"}
          </button>
        )}
      </div>

      {linkedAddress && (
        <p className="text-sm text-rito-compass">
          Vinculada: <span className="font-mono">{truncateAddress(linkedAddress)}</span>
        </p>
      )}

      {linkedAddress && (
        <button
          type="button"
          onClick={() => void handleWithdrawStub()}
          disabled={loading}
          className="text-xs border border-rito-deep/60 text-rito-mist hover:border-rito-ocean/50 px-3 py-2 rounded-lg disabled:opacity-50"
        >
          Solicitar retiro demo (stub)
        </button>
      )}

      {withdrawMsg && <p className="text-xs text-rito-compass">{withdrawMsg}</p>}
      {error && <p className="text-xs text-rito-error">{error}</p>}
    </section>
  );
}
