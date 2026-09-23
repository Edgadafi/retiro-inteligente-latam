import { useEffect, useState } from "react";
import { DemoDashboard } from "./pages/DemoDashboard";
import { LandingPage } from "./pages/LandingPage";
import { RitaPage } from "./pages/RitaPage";

type View = "landing" | "demo" | "rita";

function viewFromUrl(): View {
  if (typeof window === "undefined") return "landing";
  const view = new URLSearchParams(window.location.search).get("view");
  if (view === "rita" || view === "demo") return view;
  return "landing";
}

function pushView(view: View) {
  const url = new URL(window.location.href);
  if (view === "landing") {
    url.searchParams.delete("view");
  } else {
    url.searchParams.set("view", view);
  }
  window.history.pushState({ view }, "", url);
}

export default function App() {
  const [view, setView] = useState<View>(viewFromUrl);

  useEffect(() => {
    const onPop = () => setView(viewFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function go(next: View) {
    pushView(next);
    setView(next);
  }

  if (view === "demo") {
    return <DemoDashboard onBack={() => go("landing")} />;
  }

  if (view === "rita") {
    return <RitaPage onBack={() => go("landing")} />;
  }

  return (
    <LandingPage onStartDemo={() => go("demo")} onOpenRita={() => go("rita")} />
  );
}
