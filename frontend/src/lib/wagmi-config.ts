import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "demo-retiro-latam";

export const wagmiConfig = getDefaultConfig({
  appName: "Retiro Inteligente LATAM",
  projectId,
  chains: [arbitrumSepolia, arbitrum],
  ssr: false,
});
