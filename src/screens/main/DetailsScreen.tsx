import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, Linking, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import AppButton from "../../components/AppButton";
import InfoCard from "../../components/InfoCard";
import { colors } from "../../constants/colors";
import { radii, shadows, spacing } from "../../constants/spacing";
import { MainStackParamList } from "../../navigation/MainNavigator";
import { useAuth } from "../../context/AuthContext";
import { useItems } from "../../context/ItemsContext";
import * as apiService from "../../services/apiService";

type DetailsScreenProps = NativeStackScreenProps<MainStackParamList, "Details">;

const DetailsScreen: React.FC<DetailsScreenProps> = ({ navigation, route }) => {
  const { item } = route.params;
  const { user } = useAuth();
  const { refreshItems } = useItems();
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = useMemo(() => {
    return Boolean(user?.id && item.userId && user.id === item.userId);
  }, [item.userId, user?.id]);

  const handleDelete = () => {
    Alert.alert(
      "Delete post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await apiService.deletePost(item.id);
              await refreshItems();
              Alert.alert("Post deleted", "Your post was deleted successfully.");
              navigation.goBack();
            } catch (error) {
              const message = error instanceof Error ? error.message : "Failed to delete post";
              Alert.alert("Delete failed", message);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: item.imageUri }} style={styles.heroImage} />

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>

          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipLabel}>Category</Text>
              <Text style={styles.metaChipValue}>{item.category}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipLabel}>Location</Text>
              <Text style={styles.metaChipValue}>{item.location}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <InfoCard label="Status" value={item.status} style={styles.infoCard} />
            <InfoCard label="Date" value={item.date} style={styles.infoCard} />
                <InfoCard label="Owner" value={item.ownerName} style={styles.infoCard} />
                <InfoCard label="Phone" value={item.phoneNumber} style={styles.infoCard} />
                <InfoCard label="Category" value={item.category} style={styles.infoCard} />
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{item.description}</Text>

          <Text style={styles.sectionTitle}>Reported by</Text>
          <View style={styles.ownerCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.ownerName.slice(0, 1)}</Text>
            </View>
            <View style={styles.ownerTextWrap}>
              <Text style={styles.ownerName}>{item.ownerName}</Text>
              <Text style={styles.ownerSubtitle}>Verified community member</Text>
            </View>
          </View>

           <AppButton
             title={item.status === "Lost" ? "Contact owner" : "Send message"}
             onPress={() => {
               if (!item.phoneNumber) {
                 Alert.alert("No phone number", "This post does not have a phone number to contact.");
                 return;
               }

               // Remove spaces from phone number for tel: URI scheme
               const cleanPhoneNumber = item.phoneNumber.replace(/\s/g, "");
               const url = `tel:${cleanPhoneNumber}`;
               
               console.log("Attempting to call:", url);
               
               // Try to open the tel: URL
               // Note: On iOS Simulator, tel: scheme doesn't work
               Linking.openURL(url).catch((error) => {
                 console.log("Error opening URL:", error);
                 Alert.alert(
                   "Unable to open dialer",
                   "Your device cannot make phone calls. Try again on a physical device."
                 );
               });
             }}
             style={styles.primaryButton}
           />

          {isOwner && (
            <AppButton
              title={isDeleting ? "Deleting..." : "Delete post"}
              onPress={handleDelete}
              variant="danger"
              disabled={isDeleting}
              style={styles.deleteButton}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  heroWrap: {
    position: "relative",
    marginBottom: spacing.lg,
  },
  heroImage: {
    width: "100%",
    height: 320,
    borderRadius: radii.xl,
    backgroundColor: colors.borderSoft,
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPressed: {
    opacity: 0.85,
  },
  statusBadge: {
    position: "absolute",
    right: 16,
    bottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.overlay,
  },
  statusBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.card,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metaChip: {
    flex: 1,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
  },
  metaChipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaChipValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  infoCard: {
    width: "48%",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  ownerTextWrap: {
    flex: 1,
  },
  ownerName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  ownerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  primaryButton: {
    marginTop: spacing.xs,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
});

export default DetailsScreen;
