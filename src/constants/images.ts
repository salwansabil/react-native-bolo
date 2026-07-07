import type { ImageSourcePropType } from "react-native";

export const images = {
  mascotAuth: require("../../assets/assets/images/mascot-auth.png") as ImageSourcePropType,
  mascotLogo: require("../../assets/assets/images/mascot-logo.png") as ImageSourcePropType,
  mascotWelcome: require("../../assets/assets/images/mascot-welcome.png") as ImageSourcePropType,
  streakFire: require("../../assets/assets/images/streak-fire.png") as ImageSourcePropType,
} as const;
