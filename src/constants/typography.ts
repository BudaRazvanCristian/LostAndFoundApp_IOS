// Tipografie moderna cu ierarhie clara si titluri mari.
export const typography = {
  fontFamilies: {
    regular: "System",
    medium: "System",
    semibold: "System",
    bold: "System",
  },
  fontSizes: {
    titleLarge: 32,
    title: 24,
    headline: 20,
    subtitle: 18,
    body: 16,
    bodySmall: 14,
    caption: 12,
  },
  lineHeights: {
    titleLarge: 38,
    title: 30,
    headline: 26,
    subtitle: 24,
    body: 22,
    bodySmall: 20,
    caption: 16,
  },
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  letterSpacing: {
    titleLarge: -0.5,
    title: -0.3,
    headline: -0.2,
    body: 0,
    caption: 0.2,
  },
  textStyles: {
    titleLarge: {
      fontSize: 32,
      lineHeight: 38,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    title: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    headline: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "600",
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "600",
      letterSpacing: -0.1,
    },
    body: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "400",
    },
    bodyEmphasis: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "600",
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "400",
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "500",
      letterSpacing: 0.2,
    },
  },
} as const;

