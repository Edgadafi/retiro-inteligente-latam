import type { ReactNode } from "react";
import { CompassIcon } from "../ui/CompassIcon";
import { BodyText, DisplayH1, RitoLabel } from "../ui/RitoTypography";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-rito-night">
      <header className="border-b border-rito-deep/50 px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CompassIcon size={40} variant="dark" className="shrink-0 sm:hidden" />
            <CompassIcon
              size={48}
              variant="dark"
              className="shrink-0 hidden sm:block"
            />
            <div className="min-w-0">
              <RitoLabel className="text-rito-mist block">
                Ethereum México 2026
              </RitoLabel>
              <DisplayH1
                as="p"
                className="text-xl sm:text-2xl text-rito-frost !text-[1.25rem] sm:!text-[1.5rem] !leading-tight"
              >
                Rito
              </DisplayH1>
              <BodyText
                as="p"
                className="rito-subtitle text-rito-compass !text-xs sm:!text-sm !leading-snug truncate"
              >
                Retiro Inteligente LATAM
              </BodyText>
            </div>
          </div>
          <span className="shrink-0 text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full border border-rito-ocean/40 text-rito-compass font-display font-medium">
            MVP · Fase 1
          </span>
        </div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
