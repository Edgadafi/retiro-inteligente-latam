import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CompassIcon } from "../ui/CompassIcon";
import { BodyText, DisplayH1, RitoLabel } from "../ui/RitoTypography";

const FLOW_STEPS = [
  { id: "spei", label: "SPEI", sub: "Tu depósito entra" },
  { id: "rito", label: "Rito", sub: "IA analiza y separa" },
  { id: "cetes", label: "CETES on-chain", sub: "Inversión automática" },
] as const;

const PILLARS = [
  {
    title: "Tu CLABE, tu libertad.",
    body: "Olvida los trámites bancarios complejos. Con Rito, recibes una CLABE única en segundos. Es el puente directo entre tu esfuerzo diario en las apps de delivery y tu cuenta de ahorro personal.",
    step: 0,
  },
  {
    title: "Rito: Tu copiloto financiero.",
    body: "Rito no es solo una app, es una IA que analiza tus ingresos variables y separa lo que te permite ahorrar sin que sientas el impacto. Siempre orientada a tu norte, nunca a la urgencia.",
    step: 1,
  },
  {
    title: "Tu dinero en CETES, al instante.",
    body: "Automatizamos la compra de bonos gubernamentales (CETES) mediante tecnología blockchain. Tu dinero deja de estar ocioso en una cuenta de débito para empezar a generar rendimiento real desde el primer día.",
    step: 2,
  },
  {
    title: "Siempre sabrás dónde estás.",
    body: "La brújula no miente. Desde que recibimos tu pago SPEI hasta que se refleja tu inversión, tienes visibilidad total en tiempo real. Seguridad bancaria, agilidad tecnológica.",
    step: 2,
  },
];

export function MagicSection() {
  const [activePillar, setActivePillar] = useState(0);
  const activeStep = PILLARS[activePillar]!.step;

  return (
    <section className="px-4 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-3"
        >
          <RitoLabel className="text-rito-amber block">La magia detrás del norte</RitoLabel>
          <DisplayH1 as="h2" className="text-rito-frost !text-[1.5rem] sm:!text-[2rem]">
            SPEI → Rito → CETES on-chain
          </DisplayH1>
          <BodyText className="text-rito-mist max-w-xl mx-auto">
            Cuatro pilares, un solo rumbo. Toca cada paso y sigue la brújula.
          </BodyText>
        </motion.div>

        {/* Flow stepper */}
        <div className="relative flex items-center justify-between max-w-lg mx-auto px-2">
          <div className="absolute left-8 right-8 top-4 h-px bg-rito-deep" />
          {FLOW_STEPS.map((step, i) => {
            const active = i <= activeStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActivePillar(i === 0 ? 0 : i === 1 ? 1 : 2)}
                className="relative z-10 flex flex-col items-center gap-2 group"
              >
                <motion.div
                  animate={{ scale: active && i === activeStep ? 1.1 : 1 }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    active
                      ? "border-rito-ocean bg-rito-ocean/20"
                      : "border-rito-deep bg-rito-night"
                  }`}
                >
                  {i === 1 ? (
                    <CompassIcon
                      size={22}
                      variant="dark"
                      pulse={active && i === activeStep}
                    />
                  ) : (
                    <span
                      className={`text-xs font-mono font-medium ${
                        active ? "text-rito-compass" : "text-rito-mist/50"
                      }`}
                    >
                      {i + 1}
                    </span>
                  )}
                </motion.div>
                <span
                  className={`text-[10px] sm:text-xs font-display font-medium ${
                    active ? "text-rito-frost" : "text-rito-mist/60"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {PILLARS.map((p, i) => (
            <button
              key={p.title}
              type="button"
              onClick={() => setActivePillar(i)}
              className={`text-left rounded-xl px-3 py-3 sm:px-4 sm:py-4 border transition-all ${
                activePillar === i
                  ? "border-rito-ocean bg-rito-ocean/10"
                  : "border-rito-deep/50 bg-rito-elevated/50 hover:border-rito-compass/40"
              }`}
            >
              <span className="text-[10px] font-mono text-rito-compass">0{i + 1}</span>
              <p className="text-xs sm:text-sm font-display font-medium text-rito-frost mt-1 line-clamp-2">
                {p.title.split(":")[0]}
              </p>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activePillar}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="bg-rito-elevated border border-rito-ocean/30 rounded-2xl p-5 sm:p-8 flex flex-col sm:flex-row gap-6 items-start"
          >
            <CompassIcon
              size={56}
              variant="dark"
              pulse={activePillar === 1}
              className="shrink-0 mx-auto sm:mx-0"
            />
            <div className="space-y-3 text-center sm:text-left">
              <h3 className="font-display font-semibold text-lg sm:text-xl text-rito-frost">
                {PILLARS[activePillar]!.title}
              </h3>
              <BodyText className="text-rito-mist">{PILLARS[activePillar]!.body}</BodyText>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
