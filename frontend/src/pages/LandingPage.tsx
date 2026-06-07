import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArchitectureView } from "../components/landing/ArchitectureView";
import { FaqSection } from "../components/landing/FaqSection";
import { DemoModal } from "../components/landing/DemoModal";
import { FloatingDemoButton } from "../components/landing/FloatingDemoButton";
import { HackathonModeToggle } from "../components/landing/HackathonModeToggle";
import { HeroSection } from "../components/landing/HeroSection";
import { LiveDemoSection } from "../components/landing/LiveDemoSection";
import { MagicSection } from "../components/landing/MagicSection";
import { TestimonialGrid } from "../components/landing/TestimonialGrid";
import { PainSection } from "../components/landing/PainSection";
import { TechStackSection } from "../components/landing/TechStackSection";
import { CompassIcon } from "../components/ui/CompassIcon";

interface Props {
  onStartDemo: () => void;
}

export function LandingPage({ onStartDemo }: Props) {
  const [hackathonMode, setHackathonMode] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);


  return (
    <div className="min-h-screen bg-rito-night text-rito-frost">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-rito-deep/50 bg-rito-night/90 backdrop-blur-md px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CompassIcon size={32} variant="dark" className="shrink-0" />
            <div className="min-w-0">
              <p className="font-display font-semibold text-sm text-rito-frost truncate">
                Rito
              </p>
              <p className="text-[10px] text-rito-compass truncate hidden sm:block">
                Retiro Inteligente LATAM
              </p>
            </div>
          </div>
          <HackathonModeToggle enabled={hackathonMode} onChange={setHackathonMode} />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {hackathonMode ? (
          <motion.div
            key="arch"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
          >
            <ArchitectureView />
            <FaqSection />
            <div className="px-4 pb-16 text-center">
              <button
                type="button"
                onClick={onStartDemo}
                className="bg-rito-ocean hover:bg-rito-compass text-rito-slate font-display font-semibold px-8 py-3 rounded-xl"
              >
                Ir al demo completo
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="marketing"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.35 }}
          >
            <HeroSection onStartDemo={onStartDemo} />
            <PainSection />
            <MagicSection />
            <TestimonialGrid />
            <LiveDemoSection />
            <TechStackSection />

            <section className="px-4 py-12 sm:py-16 border-t border-rito-deep/40">
              <div className="max-w-5xl mx-auto text-center space-y-6">
                <p className="font-display font-semibold text-xl text-rito-frost">
                  ¿Listo para ver tu norte?
                </p>
                <button
                  type="button"
                  onClick={onStartDemo}
                  className="w-full sm:w-auto bg-rito-amber hover:bg-rito-amber-d text-rito-night font-display font-semibold px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-rito-amber/20"
                >
                  Probar el demo
                </button>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {!hackathonMode && (
        <FloatingDemoButton onClick={() => setDemoModalOpen(true)} />
      )}
      <DemoModal open={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  );
}
