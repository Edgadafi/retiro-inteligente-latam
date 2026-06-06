import { motion } from "framer-motion";
import { DepositStatusStepper } from "../DepositStatusStepper";
import { CompassIcon } from "../ui/CompassIcon";
import { SkeletonCard, SkeletonStepper } from "../ui/Skeleton";
import { BodyText, DisplayH1, RitoLabel } from "../ui/RitoTypography";
import { useLiveDepositDemo } from "../../hooks/useLiveDepositDemo";

export function LiveDemoSection() {
  const { ui, fid, amountMxn, loading, bootstrapping, error, runSimulation } =
    useLiveDepositDemo();

  return (
    <section id="live-demo" className="px-4 py-12 sm:py-16 bg-rito-deep/20 scroll-mt-20">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div className="space-y-3">
            <RitoLabel className="text-rito-compass block">Proof of work</RitoLabel>
            <DisplayH1 as="h2" className="text-rito-frost !text-[1.5rem] sm:!text-[2rem]">
              No es vaporware — míralo en vivo
            </DisplayH1>
            <BodyText className="text-rito-mist max-w-xl">
              Simula un depósito SPEI y observa el pipeline real: pending → validación →
              CETES invertido. Misma API que usa producción.
            </BodyText>
          </div>
          <CompassIcon size={48} variant="dark" pulse={loading} className="hidden sm:block" />
        </motion.div>

        {bootstrapping ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonStepper />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => void runSimulation(150)}
                disabled={loading}
                className="flex-1 sm:flex-none bg-rito-ocean hover:bg-rito-compass disabled:opacity-50 text-rito-slate font-display font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                {loading ? "Procesando SPEI…" : "Simular depósito SPEI ($150)"}
              </button>
              {ui?.isComplete && (
                <span className="flex items-center justify-center gap-2 text-sm text-rito-amber font-display font-medium px-4 py-2 rounded-xl border border-rito-amber/40 bg-rito-amber/10">
                  <CompassIcon size={18} variant="dark" />
                  Capital activo on-chain
                </span>
              )}
            </div>

            {error && <p className="text-sm text-rito-error">{error}</p>}

            {ui ? (
              <DepositStatusStepper ui={ui} fid={fid ?? undefined} amountMxn={amountMxn} />
            ) : (
              <div className="bg-rito-elevated border border-dashed border-rito-deep/60 rounded-xl p-8 text-center">
                <CompassIcon size={40} variant="dark" className="mx-auto opacity-60" />
                <BodyText className="text-rito-mist mt-4 !text-sm">
                  Pulsa simular para ver el flujo completo en tiempo real.
                </BodyText>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
