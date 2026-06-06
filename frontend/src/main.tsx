import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { Web3Providers } from "./providers/Web3Providers";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Web3Providers>
      <App />
    </Web3Providers>
  </StrictMode>,
);
