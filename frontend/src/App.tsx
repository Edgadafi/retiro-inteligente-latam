import { useState } from "react";
import { DemoDashboard } from "./pages/DemoDashboard";
import { LandingPage } from "./pages/LandingPage";

type View = "landing" | "demo";

export default function App() {
  const [view, setView] = useState<View>("landing");

  if (view === "demo") {
    return <DemoDashboard onBack={() => setView("landing")} />;
  }

  return <LandingPage onStartDemo={() => setView("demo")} />;
}
