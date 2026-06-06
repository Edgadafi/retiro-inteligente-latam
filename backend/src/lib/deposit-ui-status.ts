import type { DepositStatus } from "../types/deposit.types.js";

export type DepositUiPhase = 1 | 2 | 3 | "error";

export interface DepositUiState {
  phase: DepositUiPhase;
  label: string;
  description: string;
  isComplete: boolean;
  isFailed: boolean;
}

const UI_MAP: Record<DepositStatus, DepositUiState> = {
  pending: {
    phase: 1,
    label: "Recibiendo",
    description: "SPEI recibido — esperando confirmación",
    isComplete: false,
    isFailed: false,
  },
  processing: {
    phase: 2,
    label: "Validando con Banco",
    description: "Polling Juno/Bitso — mint MXNB en curso",
    isComplete: false,
    isFailed: false,
  },
  settled: {
    phase: 2,
    label: "Validando con Banco",
    description: "MXNB acreditado — preparando inversión CETES",
    isComplete: false,
    isFailed: false,
  },
  investing: {
    phase: 2,
    label: "Validando con Banco",
    description: "Agente ejecutando purchase_stablebond",
    isComplete: false,
    isFailed: false,
  },
  invested: {
    phase: 3,
    label: "Invertido",
    description: "MXNB en wallet — CETES confirmado por el agente",
    isComplete: true,
    isFailed: false,
  },
  failed: {
    phase: "error",
    label: "Error",
    description: "El depósito no pudo completarse",
    isComplete: false,
    isFailed: true,
  },
};

export function mapDepositToUi(status: DepositStatus): DepositUiState {
  return UI_MAP[status];
}
