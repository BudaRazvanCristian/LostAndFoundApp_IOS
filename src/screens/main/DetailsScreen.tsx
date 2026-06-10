import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, Alert, Linking, Platform } from "react-native";
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

// Load react-native-maps defensively to avoid startup crash if native setup is incomplete.
let mapsLib: any;
try {
  mapsLib = require("react-native-maps");
} catch {
  mapsLib = null;
}

const MapView = mapsLib?.default;
const Marker = mapsLib?.Marker;

type DetailsScreenProps = NativeStackScreenProps<MainStackParamList, "Details">;

const DetailsScreen: React.FC<DetailsScreenProps> = ({ navigation, route }) => {
  const { item } = route.params;
  const { user } = useAuth();
  const { refreshItems } = useItems();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isContacting, setIsContacting] = useState(false);

  const isOwner = useMemo(() => {
    return Boolean(user?.id && item.userId && user.id === item.userId);
  }, [item.userId, user?.id]);

  const handleEdit = () => {
    navigation.navigate("EditPost", { item });
  };

  const handleContactOwner = async () => {
    if (!item.userId) {
      Alert.alert("Chat unavailable", "This post does not have a valid owner.");
      return;
    }

    try {
      setIsContacting(true);
      const conversation = await apiService.createOrGetConversation(item.id, item.userId);

      navigation.navigate("ChatThread", {
        conversationId: conversation.id,
        otherUserName: conversation.otherUser?.displayName || item.ownerName,
        postTitle: item.title,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to open chat";
      Alert.alert("Chat error", message);
    } finally {
      setIsContacting(false);
    }
  };

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

  const openExternalMap = async () => {
    if (typeof item.latitude !== "number" || typeof item.longitude !== "number") {
      return;
    }

    const lat = item.latitude;
    const lng = item.longitude;
    const label = encodeURIComponent(item.location || item.title || "Lost and Found");

    const mapUrl =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`
        : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;

    try {
      await Linking.openURL(mapUrl);
    } catch (error) {
      console.error("Failed to open external maps app:", error);
      Alert.alert("Map unavailable", "Unable to open maps on this device.");
    }
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

          {typeof item.latitude === "number" && typeof item.longitude === "number" && (
            <>
              <Text style={styles.sectionTitle}>Map location</Text>
              {MapView ? (
                <View style={styles.mapWrap}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: item.latitude,
                      longitude: item.longitude,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    }}
                    onPress={openExternalMap}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                  >
                    {Marker ? (
                      <Marker
                        coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                        title={item.title}
                        description={item.location}
                      />
                    ) : null}
                  </MapView>
                </View>
              ) : (
                <View style={styles.mapUnavailableWrap}>
                  <Text style={styles.mapUnavailableText}>
                    Map module not ready. Rebuild app after native install.
                  </Text>
                </View>
              )}
              <Text style={styles.coordinatesText}>
                Lat: {item.latitude.toFixed(6)} | Lng: {item.longitude.toFixed(6)}
              </Text>
              <Text style={styles.mapHintText}>Tap map or button below to open in Maps.</Text>
              <Pressable onPress={openExternalMap} style={styles.openMapButton}>
                <Text style={styles.openMapButtonText}>Open in Maps</Text>
              </Pressable>
            </>
          )}

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

          {!isOwner && (
            <AppButton
              title={isContacting ? "Opening chat..." : "Contact owner"}
              onPress={handleContactOwner}
              disabled={isContacting}
              style={styles.primaryButton}
            />
          )}

          {isOwner && (
            <>
              <AppButton
                title="Edit post"
                onPress={handleEdit}
                variant="secondary"
                disabled={isDeleting}
                style={styles.editButton}
              />
              <AppButton
                title={isDeleting ? "Deleting..." : "Delete post"}
                onPress={handleDelete}
                variant="danger"
                disabled={isDeleting}
                style={styles.deleteButton}
              />
            </>
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
  mapWrap: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: spacing.sm,
  },
  map: {
    width: "100%",
    height: 180,
  },
  mapUnavailableWrap: {
    minHeight: 100,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  mapUnavailableText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  coordinatesText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  mapHintText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  openMapButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.lg,
  },
  openMapButtonText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
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
  editButton: {
    marginTop: spacing.sm,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
});

export default DetailsScreen;
