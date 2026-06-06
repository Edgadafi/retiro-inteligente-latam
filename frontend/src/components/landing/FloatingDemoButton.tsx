import { motion } from "framer-motion";
import { CompassIcon } from "../ui/CompassIcon";

interface Props {
  onClick: () => void;
}

export function FloatingDemoButton({ onClick }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 bg-rito-amber hover:bg-rito-amber-d text-rito-night font-display font-semibold text-sm px-4 py-3 rounded-full shadow-lg shadow-rito-amber/25"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
    >
      <CompassIcon size={22} variant="brand" colors={{ ocean: "#0B2A2E", compass: "#0B2A2E" }} />
      <span>Ver demo en vivo</span>
    </motion.button>
  );
}
