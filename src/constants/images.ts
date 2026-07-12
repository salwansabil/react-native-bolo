import type { ImageSourcePropType } from "react-native";

export const images = {
  earth: require("../../assets/assets/images/earth.png") as ImageSourcePropType,
  earthTransparent: require("../../assets/assets/images/earth-transparent.png") as ImageSourcePropType,
  mascotAuth: require("../../assets/assets/images/mascot-auth.png") as ImageSourcePropType,
  mascotLogo: require("../../assets/assets/images/mascot-logo.png") as ImageSourcePropType,
  mascotLogoTransparent: require("../../assets/assets/images/mascot-logo-transparent.png") as ImageSourcePropType,
  mascotWelcome: require("../../assets/assets/images/mascot-welcome.png") as ImageSourcePropType,
  mascotWelcomeTransparent: require("../../assets/assets/images/mascot-welcome-transparent.png") as ImageSourcePropType,
  palace: require("../../assets/assets/images/palace.png") as ImageSourcePropType,
  palaceTransparent: require("../../assets/assets/images/palace-transparent.png") as ImageSourcePropType,
  streakFire: require("../../assets/assets/images/streak-fire.png") as ImageSourcePropType,
  teacherAvatar: {
    uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=240&fit=crop&crop=faces",
  } as ImageSourcePropType,
  treasure: require("../../assets/assets/images/treasure.png") as ImageSourcePropType,
} as const;
