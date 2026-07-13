import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

type TabConfig = {
  activeAndroidIcon: AndroidSymbol;
  activeIcon: SFSymbol;
  androidIcon: AndroidSymbol;
  icon: SFSymbol;
  label: string;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  home: {
    activeAndroidIcon: "home",
    activeIcon: "house.fill",
    androidIcon: "home",
    icon: "house",
    label: "Home",
  },
  learn: {
    activeAndroidIcon: "menu_book",
    activeIcon: "book.fill",
    androidIcon: "menu_book",
    icon: "book",
    label: "Learn",
  },
  "ai-teacher": {
    activeAndroidIcon: "school",
    activeIcon: "brain.head.profile",
    androidIcon: "school",
    icon: "brain.head.profile",
    label: "AI Teacher",
  },
  chat: {
    activeAndroidIcon: "chat_bubble",
    activeIcon: "bubble.left.fill",
    androidIcon: "chat_bubble",
    icon: "bubble.left",
    label: "Chat",
  },
  profile: {
    activeAndroidIcon: "person",
    activeIcon: "person.fill",
    androidIcon: "person",
    icon: "person",
    label: "Profile",
  },
};

const ACTIVE_COLOR = "#6C4EF5";
const INACTIVE_COLOR = "#65708D";

export function CustomTabBar({
  descriptors,
  insets,
  navigation,
  state,
}: BottomTabBarProps) {
  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 9),
        },
      ]}
    >
      <View style={styles.bar}>
        {state.routes.map((route) => {
          const options = descriptors[route.key]?.options;
          const isFocused = state.routes[state.index]?.key === route.key;
          const tab = TAB_CONFIG[route.name];

          if (!tab) {
            return null;
          }

          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

          const onPress = () => {
            const event = navigation.emit({
              canPreventDefault: true,
              target: route.key,
              type: "tabPress",
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              target: route.key,
              type: "tabLongPress",
            });
          };

          return (
            <Pressable
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? tab.label}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : undefined}
              key={route.key}
              onLongPress={onLongPress}
              onPress={onPress}
              style={({ pressed }) => [styles.tabButton, { opacity: pressed ? 0.72 : 1 }]}
            >
              <SymbolView
                fallback={
                  <Text style={[styles.fallbackIcon, { color }]}>
                    {tab.label.charAt(0)}
                  </Text>
                }
                name={{
                  android: isFocused ? tab.activeAndroidIcon : tab.androidIcon,
                  ios: isFocused ? tab.activeIcon : tab.icon,
                }}
                size={31}
                tintColor={color}
                weight={{
                  android: { font: isFocused ? 600 : 400, name: "regular" },
                  ios: isFocused ? "semibold" : "regular",
                }}
              />
              <Text style={[styles.label, isFocused && styles.activeLabel]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#F0F2F8",
    borderTopWidth: 1,
    paddingTop: 8,
  },
  bar: {
    alignItems: "center",
    flexDirection: "row",
    height: 72,
    justifyContent: "space-around",
    paddingHorizontal: 12,
  },
  tabButton: {
    alignItems: "center",
    flex: 1,
    gap: 2,
    height: 62,
    justifyContent: "center",
  },
  label: {
    color: INACTIVE_COLOR,
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    lineHeight: 18,
  },
  activeLabel: {
    color: ACTIVE_COLOR,
    fontFamily: "Poppins-SemiBold",
  },
  fallbackIcon: {
    fontFamily: "Poppins-Bold",
    fontSize: 20,
    lineHeight: 25,
  },
});
