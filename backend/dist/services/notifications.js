"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushToMany = exports.sendPushNotification = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
const expo = new expo_server_sdk_1.Expo();
const sendPushNotification = async (expoPushToken, title, body, data) => {
    if (!expoPushToken || !expo_server_sdk_1.Expo.isExpoPushToken(expoPushToken)) {
        return;
    }
    const message = {
        to: expoPushToken,
        sound: "default",
        title,
        body,
        data,
    };
    try {
        await expo.sendPushNotificationsAsync([message]);
    }
    catch (error) {
        console.error("Push send error:", error);
    }
};
exports.sendPushNotification = sendPushNotification;
const sendPushToMany = async (expoPushTokens, title, body, data) => {
    const validTokens = expoPushTokens.filter((token) => expo_server_sdk_1.Expo.isExpoPushToken(token));
    if (validTokens.length === 0)
        return;
    const messages = validTokens.map((token) => ({
        to: token,
        sound: "default",
        title,
        body,
        data,
    }));
    try {
        await expo.sendPushNotificationsAsync(messages);
    }
    catch (error) {
        console.error("Push batch send error:", error);
    }
};
exports.sendPushToMany = sendPushToMany;
//# sourceMappingURL=notifications.js.map