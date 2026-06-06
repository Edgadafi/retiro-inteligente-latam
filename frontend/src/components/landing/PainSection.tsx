import { motion } from "framer-motion";
import { BodyText, DisplayH1, RitoLabel } from "../ui/RitoTypography";

const PAINS = [
  {
    stat: "7 de 10",
    text: "trabajadores gig no tienen ahorro formal — el dinero entra y sale sin rumbo.",
  },
  {
    stat: "Ingresos variables",
    text: "cada semana es distinta; los bancos piden montos fijos que no calzan con tu realidad.",
  },
  {
    stat: "CETES lejos",
    text: "sabes que rinden más, pero los trámites te frenan antes del primer peso invertido.",
  },
];

export function PainSection() {
  return (
    <section className="px-4 py-12 sm:py-16 bg-rito-deep/30">
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <RitoLabel className="text-rito-compass block">El problema</RitoLabel>
          <DisplayH1
            as="h2"
            className="text-rito-frost !text-[1.5rem] sm:!text-[2rem]"
          >
            Ahorrar hoy es caótico si vives del gig
          </DisplayH1>
          <BodyText className="text-rito-mist max-w-2xl">
            Entre apps, efectivo y cuentas que no hablan entre sí, tu retiro queda en el
            olvido. No es falta de voluntad — es falta de dirección.
          </BodyText>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PAINS.map((item, i) => (
            <motion.div
              key={item.stat}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="bg-rito-night border border-rito-ocean/25 rounded-2xl p-5 space-y-2"
            >
              <p className="font-mono font-medium text-rito-ocean text-lg">{item.stat}</p>
              <BodyText className="text-rito-mist !text-sm">{item.text}</BodyText>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
