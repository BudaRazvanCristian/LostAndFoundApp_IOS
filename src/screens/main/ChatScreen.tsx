import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { useAuth } from "../../context/AuthContext";
import * as apiService from "../../services/apiService";
import { ChatConversation } from "../../types/chat";

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations().catch(() => undefined);
    }, [loadConversations]),
  );

  const openConversation = (conversation: ChatConversation) => {
    navigation.navigate("ChatThread" as never, {
      conversationId: conversation.id,
      otherUserName: conversation.otherUser?.displayName,
      postTitle: conversation.postId?.title,
    } as never);
  };

  const getConversationPreview = (conversation: ChatConversation) => {
    const isMine = conversation.lastMessageSenderId?.id === user?.id;
    if (!conversation.lastMessage) return "No messages yet";
    return `${isMine ? "You" : conversation.otherUser?.displayName || "User"}: ${conversation.lastMessage}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.badge}>Messages</Text>
          <Text style={styles.title}>Chat</Text>
          <Text style={styles.subtitle}>
            Keep conversations organized and respond to inquiries quickly.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Inbox</Text>

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.sectionText}>Loading conversations...</Text>
            </View>
          ) : conversations.length === 0 ? (
            <View>
              <Text style={styles.sectionText}>
                New conversations and match updates will appear here.
              </Text>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Safety Tips</Text>
              <Text style={styles.sectionText}>
                Share only the details needed to verify item ownership.
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={ConversationSeparator}
              renderItem={({ item }) => (
                <Pressable style={styles.conversationRow} onPress={() => openConversation(item)}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.otherUser?.displayName?.slice(0, 1) || "?"}</Text>
                  </View>

                  <View style={styles.conversationTextWrap}>
                    <View style={styles.conversationTopRow}>
                      <Text style={styles.conversationName}>{item.otherUser?.displayName || "Unknown user"}</Text>
                      <Text style={styles.timeText}>
                        {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleDateString() : ""}
                      </Text>
                    </View>
                    <Text style={styles.conversationPost} numberOfLines={1}>
                      {item.postId ? item.postId.title : "Lost & Found"}
                    </Text>
                    <Text style={styles.conversationPreview} numberOfLines={2}>
                      {getConversationPreview(item)}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
                </Pressable>
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
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: colors.mutedText,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  conversationTextWrap: {
    flex: 1,
  },
  conversationTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  conversationName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  conversationPost: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  conversationPreview: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  timeText: {
    fontSize: 11,
    color: colors.textSubtle,
  },
  conversationSeparator: {
    height: 1,
    backgroundColor: colors.border,
  },
});

const ConversationSeparator = () => <View style={styles.conversationSeparator} />;

export default ChatScreen;

