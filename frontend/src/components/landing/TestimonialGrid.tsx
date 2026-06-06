import { motion } from "framer-motion";
import { BodyText, DisplayH1, RitoLabel } from "../ui/RitoTypography";

const TESTIMONIALS = [
  {
    quote:
      "Antes, el dinero que ganaba en la semana se me iba en cosas pequeñas y para cuando me daba cuenta, ya no tenía nada. Con Rito, ni siento cuando separo para mis CETES. Es como tener un contador en el bolsillo que no me juzga, solo me guía.",
    name: "Alejandro",
    age: 26,
    city: "CDMX",
    role: "Repartidor de apps",
    focus: "Variabilidad",
  },
  {
    quote:
      "Como no tengo nómina, siempre vivía con el estrés de '¿y si me enfermo o me quedo sin chamba?'. Rito me enseñó a crear un fondo de ahorro sin que tuviera que aprender finanzas complicadas. Es mi brújula para los meses flacos.",
    name: "Sofía",
    age: 31,
    city: "Guadalajara",
    role: "Freelancer de diseño",
    focus: "Paz mental",
  },
  {
    quote:
      "Siempre escuchaba hablar de CETES, pero me daba miedo o me parecía que era solo para gente con mucho dinero. Rito me quitó el miedo. Ver que mi dinero crece un poquito cada semana me hace sentir que, por fin, estoy construyendo algo para mi retiro.",
    name: "Javier",
    age: 40,
    city: "Monterrey",
    role: "Conductor de transporte privado",
    focus: "Largo plazo",
  },
] as const;

function QuoteIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="currentColor"
      className="text-rito-amber shrink-0"
      aria-hidden="true"
    >
      <path d="M6 18c0-4.5 2.5-7.5 6-9.5L10 5C5 7.5 2 12 2 18v5h8v-5H6zm14 0c0-4.5 2.5-7.5 6-9.5L24 5c-5 2.5-8 7-8 13v5h8v-5h-6z" />
    </svg>
  );
}

export function TestimonialGrid() {
  return (
    <section className="px-4 py-12 sm:py-16 bg-rito-night">
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-3"
        >
          <RitoLabel className="text-rito-compass block">Testimonios</RitoLabel>
          <DisplayH1 as="h2" className="text-rito-frost !text-[1.5rem] sm:!text-[2rem]">
            La voz de quienes ya usan Rito
          </DisplayH1>
          <BodyText className="text-rito-mist max-w-lg mx-auto">
            Trabajadores gig que encontraron su norte — sin jerga, sin juicio.
          </BodyText>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {TESTIMONIALS.map((item, i) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="bg-rito-frost rounded-xl p-5 sm:p-6 flex flex-col gap-4 transition-shadow duration-300 hover:shadow-lg hover:shadow-rito-ocean/15"
            >
              <div className="flex items-start justify-between gap-3">
                <QuoteIcon />
                <span className="text-[10px] font-display font-medium uppercase tracking-wider text-rito-ocean bg-rito-ocean/10 px-2 py-0.5 rounded-full">
                  {item.focus}
                </span>
              </div>

              <p className="font-display font-normal text-[15px] leading-[1.7] text-rito-night flex-1">
                "{item.quote}"
              </p>

              <footer className="border-t border-rito-ocean/15 pt-4 space-y-1">
                <p className="font-mono font-medium text-sm text-rito-deep">
                  — {item.name}, {item.age} años, {item.city}.
                </p>
                <p className="font-display text-xs text-rito-ocean/80">{item.role}</p>
              </footer>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
