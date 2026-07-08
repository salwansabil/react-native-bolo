import type { ImageSourcePropType } from "react-native";

export const images = {
  earth: require("../../assets/assets/images/earth.png") as ImageSourcePropType,
  earthTransparent: require("../../assets/assets/images/earth-transparent.png") as ImageSourcePropType,
  mascotAuth: require("../../assets/assets/images/mascot-auth.png") as ImageSourcePropType,
  mascotLogo: require("../../assets/assets/images/mascot-logo.png") as ImageSourcePropType,
  mascotLogoTransparent: require("../../assets/assets/images/mascot-logo-transparent.png") as ImageSourcePropType,
  mascotWelcome: require("../../assets/assets/images/mascot-welcome.png") as ImageSourcePropType,
  mascotWelcomeTransparent: require("../../assets/assets/images/mascot-welcome-transparent.png") as ImageSourcePropType,
  streakFire: require("../../assets/assets/images/streak-fire.png") as ImageSourcePropType,
} as const;
