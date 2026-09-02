/** Socio de la reserva Bitcoin. Ver docs/rita-soul.md §2 "Ruta Aureo". */
export const AUREO = {
  name: "Aureo",
  siteUrl: import.meta.env.VITE_AUREO_URL ?? "https://www.aureobitcoin.com",
  appUrl: import.meta.env.VITE_AUREO_APP_URL ?? "https://app.aureobitcoin.com",
} as const;

export type ProjectionCurrency = "MXN" | "BTC";
