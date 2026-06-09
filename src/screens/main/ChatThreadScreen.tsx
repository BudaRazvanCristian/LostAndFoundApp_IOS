import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import AppButton from "../../components/AppButton";
import { colors } from "../../constants/colors";
import { radii, shadows, spacing } from "../../constants/spacing";
import { useAuth } from "../../context/AuthContext";
import { MainStackParamList } from "../../navigation/MainNavigator";
import * as apiService from "../../services/apiService";
import { ChatMessage } from "../../types/chat";

type ChatThreadScreenProps = NativeStackScreenProps<MainStackParamList, "ChatThread">;

const ChatThreadScreen: React.FC<ChatThreadScreenProps> = ({ navigation, route }) => {
  const { conversationId, otherUserName, postTitle } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [remoteTitle, setRemoteTitle] = useState(postTitle || "Chat");
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const loadThread = useCallback(async () => {
    try {
      const data = await apiService.getConversationMessages(conversationId);
      setMessages(data.messages);
      setRemoteTitle(data.conversation.postId?.title || postTitle || "Chat");
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load chat thread:", error);
      setIsLoading(false);
    }
  }, [conversationId, postTitle]);

  useFocusEffect(
    useCallback(() => {
      loadThread().catch(() => undefined);
    }, [loadThread]),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      loadThread().catch(() => undefined);
    }, 5000);

    return () => clearInterval(interval);
  }, [loadThread]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      const result = await apiService.sendMessage(conversationId, trimmed);
      setMessages((current) => [...current, result.message]);
      setMessageText("");
      setRemoteTitle(result.conversation.postId?.title || remoteTitle);
    } catch (error) {
      console.error("Send message failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  const headerTitle = useMemo(() => otherUserName || "Conversation", [otherUserName]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>{headerTitle}</Text>
              <Text style={styles.subtitle}>{remoteTitle}</Text>
            </View>
          </View>

          <View style={styles.threadCard}>
            {isLoading ? (
              <View style={styles.feedbackWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.feedbackText}>Loading messages...</Text>
              </View>
            ) : (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isMine = item.senderId?.id === user?.id;
                  return (
                    <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.text}</Text>
                        <Text style={[styles.timeText, isMine && styles.timeTextMine]}>
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.feedbackWrap}>
                    <Text style={styles.feedbackText}>No messages yet. Say hello!</Text>
                  </View>
                }
              />
            )}
          </View>

          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSubtle}
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
            <AppButton
              title={isSending ? "Sending..." : "Send"}
              onPress={handleSend}
              disabled={isSending || !messageText.trim()}
              style={styles.sendButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.background },
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
  threadCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card,
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
  messagesContent: {
    paddingBottom: spacing.sm,
  },
  bubbleRow: {
    marginBottom: spacing.sm,
    flexDirection: "row",
  },
  bubbleRowMine: {
    justifyContent: "flex-end",
  },
  bubbleRowTheirs: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    backgroundColor: colors.backgroundDark,
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  bubbleTextMine: {
    color: colors.textInverse,
  },
  timeText: {
    marginTop: 6,
    fontSize: 11,
    color: colors.textMuted,
    alignSelf: "flex-end",
  },
  timeTextMine: {
    color: colors.textInverse,
    opacity: 0.8,
  },
  composer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  sendButton: {
    minWidth: 92,
  },
});

export default ChatThreadScreen;


