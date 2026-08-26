export const COLORS = {
  background: "#F5EBE2",
  grid: "rgba(0, 0, 0, 0.03)",
  card: "#FFFDFB",
  face: "#FFFFFF",
  ink: "#250313",
  inkMuted: "rgba(37, 3, 19, 0.6)",
  primary: "#FFB15E",
  primarySunken: "#E09250",
  primaryPlaceholder: "rgba(160, 101, 62, 0.4)",
  quiet: "#F1DBC6",
  trough: "#E6D3C3",
  neutral: "#C4BDB8",
  divider: "#F5EBE2",
  success: "#22C55E",
  danger: "#EF4444",
  scrim: "rgba(37, 3, 19, 0.4)",
  stroke: "rgba(37, 3, 19, 0.1)",
} as const;

export const SPACE = {
  xxs: 3,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  xxl: 40,
} as const;

export const GUTTER = SPACE.sm;

export const RADIUS = {
  sm: 10,
  base: 20,
  lg: 30,
  xl: 40,
  round: 999,
} as const;

export const PRESSED = {
  opacity: 0.85,
} as const;

export const CONTROL_HEIGHT = 64;

// Icon-only controls are square, and the profile mark matches them.
export const CONTROL_SQUARE_SIZE = 60;

export const CONTROL_ICON_SIZE = 24;
