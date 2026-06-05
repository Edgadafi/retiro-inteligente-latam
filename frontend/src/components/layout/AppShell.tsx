import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Ethereum México 2026
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              Retiro Inteligente LATAM
            </h1>
          </div>
          <span className="text-xs px-3 py-1 rounded-full border border-brand-500/30 text-brand-500">
            MVP · Fase 1
          </span>
        </div>
      </header>
      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
