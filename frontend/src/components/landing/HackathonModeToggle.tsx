import { motion } from "framer-motion";

interface Props {
  enabled: boolean;
  onChange: (value: boolean) => void;
}

export function HackathonModeToggle({ enabled, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span className="text-[10px] sm:text-xs font-display font-medium text-rito-mist hidden sm:inline">
        Ver arquitectura técnica
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          enabled ? "bg-rito-ocean" : "bg-rito-deep"
        }`}
      >
        <motion.span
          layout
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-rito-frost shadow-sm"
          animate={{ x: enabled ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </label>
  );
}
