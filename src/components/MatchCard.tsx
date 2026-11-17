import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { radii, spacing } from "../constants/spacing";
import type { PostMatch } from "../types/match";

interface MatchCardProps {
  match: PostMatch;
  onPress: () => void;
}

const scoreTone = (score: number) => {
  if (score >= 0.75) return { background: colors.primarySoft, text: colors.primaryDark, label: "Strong match" };
  if (score >= 0.55) return { background: colors.warningLight, text: colors.warning, label: "Good match" };
  return { background: colors.backgroundDark, text: colors.textMuted, label: "Possible match" };
};

const MatchCard: React.FC<MatchCardProps> = ({ match, onPress }) => {
  const { item, score, reasons } = match;
  const tone = scoreTone(score);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tone.label}: ${item.title}, ${Math.round(score * 100)} percent`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={22} color={colors.textSubtle} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={[styles.scoreBadge, { backgroundColor: tone.background }]}>
            <Text style={[styles.scoreText, { color: tone.text }]}>{Math.round(score * 100)}%</Text>
          </View>
          <Text style={[styles.toneLabel, { color: tone.text }]}>{tone.label}</Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.status} · {item.location}
        </Text>

        {reasons.slice(0, 3).map((reason) => (
          <View key={reason} style={styles.reasonRow}>
            <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
            <Text style={styles.reasonText} numberOfLines={1}>
              {reason}
            </Text>
          </View>
        ))}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} style={styles.chevron} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardPressed: {
    opacity: 0.85,
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: radii.md,
    backgroundColor: colors.borderSoft,
    marginRight: spacing.md,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    marginRight: 6,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "800",
  },
  toneLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});

export default MatchCard;
