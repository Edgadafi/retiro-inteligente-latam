/** Socio de la reserva Bitcoin. Ver docs/rita-soul.md §2 "Ruta Aureo". */
export const AUREO = {
  name: "Aureo",
  siteUrl: import.meta.env.VITE_AUREO_URL ?? "https://www.aureobitcoin.com",
  appUrl: import.meta.env.VITE_AUREO_APP_URL ?? "https://app.aureobitcoin.com",
  refCode: import.meta.env.VITE_AUREO_REF ?? "retirobtc",
} as const;

export type ProjectionCurrency = "MXN" | "BTC";

/**
 * Único enlace de entrada a Aureo (docs/rita-soul.md §2).
 * Lleva atribución para que la referencia quede acreditada a la calculadora;
 * si el enlace se comparte por otro canal, la atribución se pierde.
 */
export function buildAureoUrl(source: "calculadora-brecha"): string {
  const url = new URL(AUREO.appUrl);
  url.searchParams.set("ref", AUREO.refCode);
  url.searchParams.set("utm_source", "retirobtc");
  url.searchParams.set("utm_medium", source);
  url.searchParams.set("utm_campaign", "rita");
  return url.toString();
}
