import type { ImageSourcePropType } from "react-native";

const lessonImageUrls = [
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=240&h=240&fit=crop",
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=240&h=240&fit=crop",
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=240&h=240&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=240&h=240&fit=crop",
  "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=240&h=240&fit=crop",
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=240&h=240&fit=crop",
] as const;

export const images = {
  cafeHero: {
    uri: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1000&h=640&fit=crop",
  } as ImageSourcePropType,
  earth: require("../../assets/assets/images/earth.png") as ImageSourcePropType,
  earthTransparent: require("../../assets/assets/images/earth-transparent.png") as ImageSourcePropType,
  lessonImages: {
    first: require("../../assets/assets/images/mascot-logo-transparent.png") as ImageSourcePropType,
    second: require("../../assets/assets/images/streak-fire.png") as ImageSourcePropType,
    third: require("../../assets/assets/images/treasure.png") as ImageSourcePropType,
    fourth: { uri: lessonImageUrls[3] } as ImageSourcePropType,
    fifth: { uri: lessonImageUrls[4] } as ImageSourcePropType,
    sixth: { uri: lessonImageUrls[5] } as ImageSourcePropType,
  },
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

export function getLessonImage(order: number) {
  const lessonImages = images.lessonImages;

  if (order === 1) return lessonImages.first;
  if (order === 2) return lessonImages.second;
  if (order === 3) return lessonImages.third;
  if (order === 4) return lessonImages.fourth;
  if (order === 5) return lessonImages.fifth;

  return lessonImages.sixth;
}
