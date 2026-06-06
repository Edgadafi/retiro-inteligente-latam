import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectionCalculator } from "../../pages/ProjectionCalculator";
import { CompassIcon } from "../ui/CompassIcon";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DemoModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-rito-night/80 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Cerrar demo"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
            className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto bg-rito-night border-t sm:border border-rito-deep/60 rounded-t-2xl sm:rounded-2xl shadow-2xl"
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b border-rito-deep/50 bg-rito-night/95 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <CompassIcon size={28} variant="dark" />
                <p id="demo-modal-title" className="font-display font-semibold text-rito-frost text-sm">
                  Calculadora de retiro
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-rito-mist hover:text-rito-frost px-2 py-1 text-sm"
              >
                Cerrar
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <ProjectionCalculator />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
