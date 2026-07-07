export const fontFamily = {
  regular: "Poppins-Regular",
  medium: "Poppins-Medium",
  semibold: "Poppins-SemiBold",
  bold: "Poppins-Bold",
} as const;

export const typography = {
  h1: {
    size: 32,
    lineHeight: 38.4,
    family: fontFamily.bold,
  },
  h2: {
    size: 24,
    lineHeight: 31.2,
    family: fontFamily.semibold,
  },
  h3: {
    size: 20,
    lineHeight: 26,
    family: fontFamily.semibold,
  },
  h4: {
    size: 16,
    lineHeight: 22.4,
    family: fontFamily.medium,
  },
  bodyLarge: {
    size: 16,
    lineHeight: 25.6,
    family: fontFamily.regular,
  },
  bodyMedium: {
    size: 14,
    lineHeight: 22.4,
    family: fontFamily.regular,
  },
  bodySmall: {
    size: 13,
    lineHeight: 20.8,
    family: fontFamily.regular,
  },
  caption: {
    size: 11,
    lineHeight: 15.4,
    family: fontFamily.regular,
  },
} as const;
