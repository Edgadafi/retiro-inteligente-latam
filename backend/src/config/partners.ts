/**
 * Socios de la capa de reserva Bitcoin.
 * Rita recomienda y guía; nunca ejecuta la compra (docs/rita-soul.md §2, §6.9).
 */
export const AUREO = {
  name: "Aureo",
  siteUrl: process.env.AUREO_SITE_URL ?? "https://www.aureobitcoin.com",
  appUrl: process.env.AUREO_APP_URL ?? "https://app.aureobitcoin.com",
  /** No custodial: el BTC se envía a la wallet de la usuaria, no queda en la plataforma. */
  custody: "no-custodial",
  /** Comisión escalonada por monto. No se fijan porcentajes aquí: cambian y se verifican en Aureo. */
  feeModel: "escalonada por monto de operación",
  requiresKyc: true,
} as const;

/** Pasos que Rita puede describir sin inventar funcionalidad. */
export const AUREO_STEPS = [
  "Creas tu cuenta en Aureo y completas la verificación de identidad (KYC).",
  "Registras tu dirección de Bitcoin — la reserva llega a tu wallet, no se queda en la plataforma.",
  "Aureo te asigna una CLABE permanente que guardas como beneficiario en tu banco.",
  "Cada aportación por SPEI se convierte en Bitcoin automáticamente y se envía a tu wallet.",
] as const;
