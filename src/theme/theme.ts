import { DefaultTheme, Theme } from "@react-navigation/native";

export const colors = {
  background: "#0B0F14",
  surface: "#141A22",
  surfaceAlt: "#1C2430",
  border: "#2A3444",
  primary: "#3E8EDE",
  accent: "#4FD1C5",
  danger: "#E5484D",
  warning: "#F2B705",
  success: "#3FB950",
  textPrimary: "#F5F7FA",
  textSecondary: "#9AA7B8",
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const typography = {
  title: { fontSize: 22, fontWeight: "700" as const },
  subtitle: { fontSize: 16, fontWeight: "600" as const },
  body: { fontSize: 14, fontWeight: "400" as const },
  caption: { fontSize: 12, fontWeight: "400" as const },
};

const navigationTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
  },
};

export const theme = { colors, spacing, typography, navigationTheme };
