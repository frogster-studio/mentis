export const COLORS = {
  background: "#F6F6F6",
  card: "#FFFFFF",
  primary: "#F59E0B",
  ink: "#000000",
  inkMuted: "rgba(0, 0, 0, 0.4)",
  quiet: "#ECECEC",
  success: "#22C55E",
  danger: "#EF4444",
  scrim: "rgba(0, 0, 0, 0.4)",
  stroke: "rgba(0, 0, 0, 0.1)",
} as const;

export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const GUTTER = SPACE.lg;

export const RADIUS = {
  base: 16,
  round: 999,
} as const;

export const SHADOW = {
  card: "0px 3px 5px rgba(0, 0, 0, 0.02)",
} as const;

export const PRESSED = {
  opacity: 0.85,
} as const;

export const CONTROL_HEIGHT = 52;

export const CONTROL_ICON_SIZE = 20;
