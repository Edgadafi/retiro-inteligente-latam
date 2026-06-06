import { motion } from "framer-motion";
import { CompassIcon } from "../ui/CompassIcon";
import { BodyText, DisplayH1 } from "../ui/RitoTypography";

interface Props {
  onStartDemo: () => void;
}

export function HeroSection({ onStartDemo }: Props) {
  return (
    <section className="relative overflow-hidden px-4 pt-8 pb-12 sm:pt-14 sm:pb-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgb(14 122 138 / 0.35), transparent 70%)",
        }}
      />

      <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6 sm:gap-8">
        <motion.div
          initial={{ opacity: 0, rotate: -18, scale: 0.85 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={{ rotate: [0, 4, -4, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <CompassIcon
              size={96}
              variant="dark"
              pulse
              className="sm:hidden mx-auto"
            />
            <CompassIcon
              size={128}
              variant="dark"
              pulse
              className="hidden sm:block mx-auto"
            />
          </motion.div>
        </motion.div>

        <motion.div
          className="space-y-4 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          <DisplayH1 className="text-rito-frost text-[1.75rem] sm:text-[2.5rem] md:text-[2.75rem]">
            Tu futuro financiero, automático
          </DisplayH1>
          <BodyText className="text-rito-mist text-base sm:text-lg max-w-xl mx-auto">
            Rito es tu brújula de retiro: una IA que recibe tu SPEI, separa lo que puedes
            ahorrar y compra CETES on-chain — sin trámites, sin fricción, siempre al norte.
          </BodyText>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          <button
            type="button"
            onClick={onStartDemo}
            className="w-full sm:w-auto min-w-[220px] bg-rito-ocean hover:bg-rito-compass text-rito-slate font-display font-semibold text-base px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-rito-ocean/20"
          >
            Probar el demo
          </button>
        </motion.div>

        <motion.p
          className="text-xs text-rito-mist/80 font-display"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Sin registro · Demo en vivo · ~60 segundos
        </motion.p>
      </div>
    </section>
  );
}
