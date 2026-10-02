export const gi = {
  background: "#080B14",
  surface: "#111827",
  surfaceRaised: "#151F30",
  border: "#223044",
  cyan: "#36E2FF",
  cyanSoft: "#12303A",
  violet: "#9A6BFF",
  violetSoft: "#241B3A",
  text: "#F3F6FC",
  muted: "#9AA8BC",
  quiet: "#64748B",
  success: "#40D99A",
  successSoft: "#102D26",
  warning: "#FFC15C",
  warningSoft: "#332817",
  danger: "#FF647C",
  dangerSoft: "#351923",
  white: "#FFFFFF",
} as const;

export type GiColor = (typeof gi)[keyof typeof gi];
