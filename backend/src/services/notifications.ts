import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export const sendPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<void> => {
  if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) {
    return;
  }

  const message: ExpoPushMessage = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data,
  };

  try {
    await expo.sendPushNotificationsAsync([message]);
  } catch (error) {
    console.error("Push send error:", error);
  }
};

export const sendPushToMany = async (
  expoPushTokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<void> => {
  const validTokens = expoPushTokens.filter((token) => Expo.isExpoPushToken(token));
  if (validTokens.length === 0) return;

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));

  try {
    await expo.sendPushNotificationsAsync(messages);
  } catch (error) {
    console.error("Push batch send error:", error);
  }
};

