import type { CSSProperties } from "react";

export type CompassVariant = "light" | "dark" | "brand";

export interface CompassColors {
  ocean: string;
  deep: string;
  compass: string;
  amber: string;
  slate: string;
}

const VARIANTS: Record<CompassVariant, CompassColors> = {
  light: {
    ocean: "#0E7A8A",
    deep: "#0D4A52",
    compass: "#0E7A8A",
    amber: "#F2B84B",
    slate: "#F7F9FA",
  },
  dark: {
    ocean: "#14A8BD",
    deep: "#0D4A52",
    compass: "#14A8BD",
    amber: "#F2B84B",
    slate: "#C8EFF4",
  },
  brand: {
    ocean: "#F7F9FA",
    deep: "#C8EFF4",
    compass: "#F7F9FA",
    amber: "#F2B84B",
    slate: "#F7F9FA",
  },
};

export interface CompassIconProps {
  size?: number;
  className?: string;
  variant?: CompassVariant;
  /** Activa pulso en el punto ámbar central (procesamiento IA) */
  pulse?: boolean;
  colors?: Partial<CompassColors>;
}

export function CompassIcon({
  size = 48,
  className = "",
  variant = "light",
  pulse = false,
  colors: colorOverrides,
}: CompassIconProps) {
  const palette = { ...VARIANTS[variant], ...colorOverrides };

  const style = {
    width: size,
    height: size,
    "--compass-ocean": palette.ocean,
    "--compass-deep": palette.deep,
    "--compass-dash": palette.compass,
    "--compass-amber": palette.amber,
    "--compass-slate": palette.slate,
  } as CSSProperties;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="24"
        r="22"
        fill="none"
        stroke="var(--compass-ocean)"
        strokeWidth="2"
      />
      <circle
        cx="24"
        cy="24"
        r="16"
        fill="none"
        stroke="var(--compass-dash)"
        strokeWidth="0.6"
        strokeDasharray="2.5 3"
      />
      <circle cx="24" cy="24" r="3.5" fill="var(--compass-ocean)" />
      <polygon points="24,5 27,22 24,20.5 21,22" fill="var(--compass-ocean)" />
      <polygon
        points="24,43 21,26 24,27.5 27,26"
        fill="var(--compass-deep)"
        opacity="0.45"
      />
      <polygon
        points="5,24 22,21 20.5,24 22,27"
        fill="var(--compass-deep)"
        opacity="0.35"
      />
      <polygon
        points="43,24 26,27 27.5,24 26,21"
        fill="var(--compass-deep)"
        opacity="0.3"
      />
      <circle
        cx="24"
        cy="24"
        r="2"
        fill="var(--compass-amber)"
        className={pulse ? "rito-compass-pulse" : undefined}
      />
      <line
        x1="24"
        y1="2"
        x2="24"
        y2="8"
        stroke="var(--compass-ocean)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="40"
        x2="24"
        y2="46"
        stroke="var(--compass-ocean)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="2"
        y1="24"
        x2="8"
        y2="24"
        stroke="var(--compass-ocean)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="40"
        y1="24"
        x2="46"
        y2="24"
        stroke="var(--compass-ocean)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
