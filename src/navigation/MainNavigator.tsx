import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { createBottomTabNavigator, BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/main/HomeScreen";
import LostItemsScreen from "../screens/main/LostItemsScreen";
import FoundItemsScreen from "../screens/main/FoundItemsScreen";
import AddPostScreen from "../screens/main/AddPostScreen";
import ChatScreen from "../screens/main/ChatScreen";
import ProfileScreen from "../screens/main/ProfileScreen";
import DetailsScreen from "../screens/main/DetailsScreen";
import ChatThreadScreen from "../screens/main/ChatThreadScreen";
import EditPostScreen from "../screens/main/EditPostScreen";
import { colors } from "../constants/colors";
import { radii, shadows, spacing } from "../constants/spacing";
import { Item } from "../types/item";

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  AddPost: undefined;
  Inbox: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  Details: { item: Item };
  ChatThread: { conversationId: string; otherUserName?: string; postTitle?: string };
  EditPost: { item: Item };
  AllLostItems: { layout: "vertical" };
  AllFoundItems: { layout: "vertical" };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

const tabIconMap: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "home",
  Search: "search",
  AddPost: "add",
  Inbox: "chatbubble-ellipses",
  Profile: "person",
};

const renderTabIcon = (
  routeName: keyof MainTabParamList,
  color: string,
  size: number,
) => {
  if (routeName === "AddPost") {
    return null;
  }

  return <Ionicons name={tabIconMap[routeName]} size={size} color={color} />;
};

const renderAddPostTabButton = (props: BottomTabBarButtonProps) => (
  <AddPostTabButton {...props} />
);

const AddPostTabButton: React.FC<BottomTabBarButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.addPostButtonWrapper}
    >
      <View style={styles.addPostButton}>
        <Ionicons name="add" size={28} color={colors.surface} />
      </View>
      <Text style={styles.addPostLabel}>Add Post</Text>
    </TouchableOpacity>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" options={{ headerShown: false }}>
        {() => (
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarShowLabel: true,
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textMuted,
              tabBarStyle: styles.tabBar,
              tabBarLabelStyle: styles.tabLabel,
              tabBarItemStyle: styles.tabItem,
              tabBarIcon: ({ color, size }) => renderTabIcon(route.name, color, size),
            })}
          >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
            <Tab.Screen name="Search" component={LostItemsScreen} options={{ title: "Search" }} />
            <Tab.Screen
              name="AddPost"
              component={AddPostScreen}
              options={{
                title: "",
                tabBarButton: renderAddPostTabButton,
              }}
            />
            <Tab.Screen name="Inbox" component={ChatScreen} options={{ title: "Inbox" }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
          </Tab.Navigator>
        )}
      </Stack.Screen>
      <Stack.Screen name="Details" component={DetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditPost" component={EditPostScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="AllLostItems"
        component={LostItemsScreen}
        options={{ headerShown: false }}
        initialParams={{ layout: "vertical" }}
      />
      <Stack.Screen
        name="AllFoundItems"
        component={FoundItemsScreen}
        options={{ headerShown: false }}
        initialParams={{ layout: "vertical" }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    height: 78,
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    ...shadows.card,
  },
  tabItem: {
    paddingTop: spacing.xs,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  addPostButtonWrapper: {
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: -spacing.md,
    flex: 1,
  },
  addPostButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    ...shadows.floating,
  },
  addPostLabel: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
});

export default MainNavigator;
