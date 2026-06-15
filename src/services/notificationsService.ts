import { Platform } from "react-native";
import Constants from "expo-constants";

type NotificationsModule = typeof import("expo-notifications");
type DeviceModule = typeof import("expo-device");

let cachedModules:
  | { Notifications: NotificationsModule; Device: DeviceModule }
  | null
  | undefined;

const getExpoNotificationModules = (): {
  Notifications: NotificationsModule;
  Device: DeviceModule;
} | null => {
  if (cachedModules !== undefined) {
    return cachedModules;
  }

  try {
    const Notifications = require("expo-notifications") as NotificationsModule;
    const Device = require("expo-device") as DeviceModule;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    cachedModules = { Notifications, Device };
    return cachedModules;
  } catch (error) {
    // Native modules not ready yet (missing pod install/rebuild).
    console.warn("Expo notifications modules unavailable:", error);
    cachedModules = null;
    return null;
  }
};

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  const modules = getExpoNotificationModules();
  if (!modules) {
    return null;
  }

  const { Notifications, Device } = modules;

  if (!Device.isDevice) {
    // Physical device is required for push notifications.
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const permission = await Notifications.requestPermissionsAsync();
    finalStatus = permission.status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#10B981",
    });
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId;

  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();
  return tokenResponse.data;
};


