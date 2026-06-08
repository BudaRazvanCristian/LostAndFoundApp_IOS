import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { radii, shadows, spacing } from "../constants/spacing";

export interface ItemCardProps {
  title: string;
  imageUri: string;
  status?: string;
  onPress?: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ title, imageUri, status, onPress }) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Image source={{ uri: imageUri }} style={styles.image} />
      <View style={styles.content}>
        {status ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{status}</Text>
          </View>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: "hidden",
    ...shadows.md,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },
  image: {
    width: "100%",
    height: 120,
    backgroundColor: colors.backgroundDark,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primaryDark,
  },
});

export default ItemCard;

