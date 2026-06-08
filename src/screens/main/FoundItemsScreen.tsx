import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import ItemCard from "../../components/ItemCard";
import { colors } from "../../constants/colors";
import { useItems } from "../../context/ItemsContext";
import { Item } from "../../types/item";
import type { MainStackParamList } from "../../navigation/MainNavigator";

const FoundItemsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute();
  const { foundItems, isLoading, error, refreshItems } = useItems();

  // Determine layout based on route params or default to horizontal
  const layout = (route.params as any)?.layout || "horizontal";

  const openDetails = (item: Item) => {
    navigation.navigate("Details", { item });
  };

  useFocusEffect(
    useCallback(() => {
      refreshItems().catch(() => undefined);
    }, [refreshItems]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />
      <View style={styles.container}>
        {layout === "vertical" && (
          <View style={styles.header}>
            <Text style={styles.badge}>Discover</Text>
            <Text style={styles.title}>Found Items</Text>
            <Text style={styles.subtitle}>
              Browse items that were found and reported by the community.
            </Text>
          </View>
        )}

        <View style={layout === "vertical" ? styles.card : styles.cardHorizontal}>
          {layout === "horizontal" && (
            <>
              <Text style={styles.sectionTitle}>Latest Finds</Text>
              <Text style={styles.sectionText}>
                Open any community found item and check the full details.
              </Text>

              <View style={styles.divider} />
            </>
          )}

          {isLoading ? (
            <View style={styles.feedbackWrap}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.feedbackText}>Loading found items...</Text>
            </View>
          ) : error ? (
            <View style={styles.feedbackWrap}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={foundItems}
              keyExtractor={(item) => item.id}
              horizontal={layout === "horizontal"}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={layout === "horizontal" ? styles.listContent : styles.listContentVertical}
              numColumns={layout === "vertical" ? 1 : undefined}
              ItemSeparatorComponent={ItemSeparator}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={refreshItems}
                  tintColor={colors.primary}
                />
              }
              ListEmptyComponent={
                <View style={styles.feedbackWrap}>
                  <Text style={styles.feedbackText}>No found items yet.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <ItemCard
                  title={item.title}
                  imageUri={item.imageUri}
                  status={item.status}
                  onPress={() => openDetails(item)}
                />
              )}
            />
          )}
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
    backgroundColor: colors.backgroundDark,
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
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  cardHorizontal: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  listContent: {
    paddingBottom: 4,
  },
  listContentVertical: {
    paddingBottom: 20,
    gap: 12,
  },
  listSeparator: {
    width: 12,
  },
  feedbackWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  feedbackText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: "center",
  },
});

const ItemSeparator = () => <View style={styles.listSeparator} />;

export default FoundItemsScreen;
