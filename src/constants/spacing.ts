// Scala de spatiere pentru layout minimalist.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  screenPadding: 20,
  cardPadding: 16,
  sectionGap: 24,
  inputHeight: 52,
} as const;

// Colturi rotunjite elegante, intre 16 si 24.
export const radii = {
  md: 16,
  lg: 20,
  xl: 24,
} as const;

// Umbre moi pentru carduri si elemente flotante.
export const shadows = {
  card: {
    shadowColor: "rgba(17, 24, 39, 0.12)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 4,
  },
  floating: {
    shadowColor: "rgba(17, 24, 39, 0.16)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

