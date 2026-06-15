import React, { useEffect, useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, View } from "react-native";

import AppButton from "../../components/AppButton";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { useAuth } from "../../context/AuthContext";
import * as apiService from "../../services/apiService";
import { registerForPushNotificationsAsync } from "../../services/notificationsService";

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> => {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), ms);
      }),
    ]);
  };

  useEffect(() => {
    if (!isTestingPush) return;

    const safetyReset = setTimeout(() => {
      setIsTestingPush(false);
      Alert.alert(
        "Push test timeout",
        "Request took too long. Check internet/backend and try again.",
      );
    }, 20000);

    return () => clearTimeout(safetyReset);
  }, [isTestingPush]);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoggingOut(true);
            await logout();
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to log out";
            Alert.alert("Logout failed", message);
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handlePushTest = async () => {
    try {
      setIsTestingPush(true);

      const expoPushToken = await withTimeout(
        registerForPushNotificationsAsync(),
        10000,
        "Could not obtain Expo push token in time",
      );
      if (!expoPushToken) {
        Alert.alert(
          "Push token missing",
          "No push token available yet. Use a physical device, allow notifications, then try again.",
        );
        return;
      }

      await withTimeout(
        apiService.updatePushToken(expoPushToken),
        10000,
        "Push token sync timed out",
      );
      await withTimeout(
        apiService.sendPushTest(),
        10000,
        "Push test request timed out",
      );
      Alert.alert("Push test", "Test notification sent. Check device notifications.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send push test";
      Alert.alert("Push test failed", message);
    } finally {
      setIsTestingPush(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.badge}>Account</Text>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Review your account details and manage your session.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your details</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            <Text style={styles.fieldValue}>{user?.displayName || "-"}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValue}>{user?.email || "-"}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <Text style={styles.fieldValue}>{user?.phone || "Not set"}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>User ID</Text>
            <Text style={styles.fieldValueSmall}>{user?.id || "-"}</Text>
          </View>

          <View style={styles.divider} />

          <AppButton
            title={isTestingPush ? "Sending test..." : "Send test notification"}
            onPress={handlePushTest}
            variant="secondary"
            disabled={isTestingPush || isLoggingOut}
            style={styles.testPushButton}
          />

          <AppButton
            title={isLoggingOut ? "Logging out..." : "Log out"}
            onPress={handleLogout}
            variant="danger"
            disabled={isLoggingOut}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.primary,
    opacity: 0.12,
  },
  backgroundBottom: {
    position: "absolute",
    bottom: -140,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  header: {
    marginBottom: 28,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.card,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.mutedText,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  fieldRow: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  fieldValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },
  fieldValueSmall: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  testPushButton: {
    marginBottom: spacing.sm,
  },
});

export default ProfileScreen;
