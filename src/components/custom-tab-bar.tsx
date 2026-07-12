import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type TabConfig = {
  androidIcon: AndroidSymbol;
  icon: SFSymbol;
  label: string;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  home: {
    androidIcon: "home",
    icon: "house.fill",
    label: "Home",
  },
  learn: {
    androidIcon: "menu_book",
    icon: "book",
    label: "Learn",
  },
  "ai-teacher": {
    androidIcon: "school",
    icon: "brain.head.profile",
    label: "AI Teacher",
  },
  chat: {
    androidIcon: "chat_bubble",
    icon: "bubble.left",
    label: "Chat",
  },
  profile: {
    androidIcon: "person",
    icon: "person",
    label: "Profile",
  },
};

const BAR_HORIZONTAL_MARGIN = 12;
const BAR_HORIZONTAL_PADDING = 18;
const ACTIVE_CIRCLE_SIZE = 46;
const ACTIVE_COLOR = "#6C4EF5";
const INACTIVE_COLOR = "#7C839F";

export function CustomTabBar({
  descriptors,
  insets,
  navigation,
  state,
}: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const barWidth = width - BAR_HORIZONTAL_MARGIN * 2;
  const itemWidth =
    (barWidth - BAR_HORIZONTAL_PADDING * 2) / Math.max(state.routes.length, 1);
  const activeX = useSharedValue(
    BAR_HORIZONTAL_PADDING +
      itemWidth * state.index +
      (itemWidth - ACTIVE_CIRCLE_SIZE) / 2,
  );

  useEffect(() => {
    activeX.value = withTiming(
      BAR_HORIZONTAL_PADDING +
        itemWidth * state.index +
        (itemWidth - ACTIVE_CIRCLE_SIZE) / 2,
      {
        duration: 240,
      },
    );
  }, [activeX, itemWidth, state.index]);

  const activeCircleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: activeX.value }],
  }));

  const activeRoute = state.routes[state.index];
  const activeTab = TAB_CONFIG[activeRoute.name];

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View
        style={[
          styles.bar,
          {
            marginHorizontal: BAR_HORIZONTAL_MARGIN,
            paddingHorizontal: BAR_HORIZONTAL_PADDING,
          },
        ]}
      >
        <Animated.View style={[styles.activeCircle, activeCircleStyle]}>
          {activeTab ? (
            <SymbolView
              fallback={
                <Text style={styles.activeFallbackIcon}>
                  {activeTab.label.charAt(0)}
                </Text>
              }
              name={{ android: activeTab.androidIcon, ios: activeTab.icon }}
              size={25}
              tintColor="#FFFFFF"
              weight={{ android: { font: 400, name: "regular" }, ios: "semibold" }}
            />
          ) : null}
        </Animated.View>

        <View style={styles.itemsRow}>
          {state.routes.map((route, index) => {
            const options = descriptors[route.key]?.options;
            const isFocused = state.index === index;
            const tab = TAB_CONFIG[route.name];

            if (!tab) {
              return null;
            }

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
                accessibilityLabel={options?.tabBarAccessibilityLabel}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : undefined}
                key={route.key}
                onLongPress={onLongPress}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.tabButton,
                  { opacity: pressed ? 0.75 : 1, width: itemWidth },
                ]}
              >
                {isFocused ? (
                  <View style={styles.activeIconSpacer} />
                ) : (
                  <>
                    <SymbolView
                      fallback={
                        <Text style={styles.inactiveFallbackIcon}>
                          {tab.label.charAt(0)}
                        </Text>
                      }
                      name={{ android: tab.androidIcon, ios: tab.icon }}
                      size={28}
                      tintColor={INACTIVE_COLOR}
                      weight={{ android: { font: 400, name: "regular" }, ios: "regular" }}
                    />
                    <Text style={styles.inactiveLabel}>{tab.label}</Text>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "transparent",
    paddingTop: 8,
  },
  bar: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderCurve: "continuous",
    borderRadius: 26,
    boxShadow: "0 -4px 18px rgba(13, 19, 43, 0.08)",
    height: 88,
    justifyContent: "center",
    position: "relative",
  },
  activeCircle: {
    alignItems: "center",
    backgroundColor: ACTIVE_COLOR,
    borderRadius: ACTIVE_CIRCLE_SIZE / 2,
    height: ACTIVE_CIRCLE_SIZE,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    top: 13,
    width: ACTIVE_CIRCLE_SIZE,
    zIndex: 1,
  },
  itemsRow: {
    alignItems: "center",
    flexDirection: "row",
    height: "100%",
  },
  tabButton: {
    alignItems: "center",
    gap: 4,
    height: 70,
    justifyContent: "center",
  },
  activeIconSpacer: {
    height: ACTIVE_CIRCLE_SIZE,
    width: ACTIVE_CIRCLE_SIZE,
  },
  inactiveLabel: {
    color: INACTIVE_COLOR,
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    lineHeight: 18,
  },
  activeFallbackIcon: {
    color: "#FFFFFF",
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    lineHeight: 24,
  },
  inactiveFallbackIcon: {
    color: INACTIVE_COLOR,
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    lineHeight: 24,
  },
});
