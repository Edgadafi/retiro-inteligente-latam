/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_AUREO_URL?: string;
  readonly VITE_AUREO_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
