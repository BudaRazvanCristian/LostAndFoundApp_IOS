import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import { verifyToken } from "../middleware/auth";
import { Conversation } from "../models/Conversation";
import Message from "../models/Message";
import Post from "../models/Post";
import User from "../models/User";
import { sendPushNotification } from "../services/notifications";

const router = Router();

const toStringId = (value: any): string => (value?._id || value?.id || value)?.toString?.() || String(value);

const buildParticipantKey = (userA: string, userB: string, postId: string) => {
  return [userA, userB].sort().join("_") + `_${postId}`;
};

const formatUser = (user: any) => ({
  id: toStringId(user),
  displayName: user?.displayName,
  profileImage: user?.profileImage,
  email: user?.email,
});

const formatConversation = (conversation: any, currentUserId?: string) => {
  const participants = Array.isArray(conversation.participants)
    ? conversation.participants.map(formatUser)
    : [];
  const otherUser = currentUserId
    ? participants.find((participant: { id: string }) => participant.id !== currentUserId) || null
    : null;

  return {
    id: toStringId(conversation),
    postId: conversation.postId
      ? {
          id: toStringId(conversation.postId),
          title: conversation.postId.title,
          status: conversation.postId.status,
          imageUri: conversation.postId.imageUri,
          userId: toStringId(conversation.postId.userId),
        }
      : null,
    participants,
    otherUser,
    lastMessage: conversation.lastMessage || "",
    lastMessageAt: conversation.lastMessageAt,
    lastMessageSenderId: conversation.lastMessageSenderId
      ? formatUser(conversation.lastMessageSenderId)
      : null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

const formatMessage = (message: any) => ({
  id: toStringId(message),
  conversationId: toStringId(message.conversationId),
  senderId: message.senderId ? formatUser(message.senderId) : null,
  text: message.text,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

const isParticipant = (conversation: any, userId: string) => {
  return conversation.participants.some((participant: any) => toStringId(participant) === userId);
};

router.get("/conversations", verifyToken, async (req: Request, res: Response) => {
  try {
    const conversations = await Conversation.find({ participants: req.userId })
      .populate("participants", "displayName profileImage email")
      .populate("postId", "title status imageUri userId")
      .populate("lastMessageSenderId", "displayName profileImage email")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    return res.status(200).json({
      conversations: conversations.map((conversation) => formatConversation(conversation, req.userId)),
    });
  } catch (error) {
    console.error("Conversations fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.post("/conversations", verifyToken, async (req: Request, res: Response) => {
  try {
    const { postId, otherUserId } = req.body;

    if (!postId || !otherUserId) {
      return res.status(400).json({ error: "postId and otherUserId are required" });
    }

    if (otherUserId === req.userId) {
      return res.status(400).json({ error: "You cannot start a conversation with yourself" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (toStringId(post.userId) !== otherUserId) {
      return res.status(400).json({ error: "Conversation can only be started with the post owner" });
    }

    const participantKey = buildParticipantKey(req.userId as string, otherUserId, toStringId(post._id));

    let conversation = await Conversation.findOne({ participantKey })
      .populate("participants", "displayName profileImage email")
      .populate("postId", "title status imageUri userId")
      .populate("lastMessageSenderId", "displayName profileImage email");

    if (!conversation) {
      conversation = await Conversation.create({
        postId: post._id,
        participants: [new mongoose.Types.ObjectId(req.userId), new mongoose.Types.ObjectId(otherUserId)],
        participantKey,
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("participants", "displayName profileImage email")
        .populate("postId", "title status imageUri userId")
        .populate("lastMessageSenderId", "displayName profileImage email");
    }

    return res.status(200).json({ conversation: formatConversation(conversation, req.userId) });
  } catch (error) {
    console.error("Conversation create error:", error);
    return res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/:conversationId/messages", verifyToken, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate("participants", "displayName profileImage email")
      .populate("postId", "title status imageUri userId")
      .populate("lastMessageSenderId", "displayName profileImage email");

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (!isParticipant(conversation, req.userId as string)) {
      return res.status(403).json({ error: "Not authorized to access this conversation" });
    }

    const messages = await Message.find({ conversationId })
      .populate("senderId", "displayName profileImage email")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      conversation: formatConversation(conversation, req.userId),
      messages: messages.map(formatMessage),
    });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/conversations/:conversationId/messages", verifyToken, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const conversation = await Conversation.findById(conversationId)
      .populate("participants", "displayName profileImage email")
      .populate("postId", "title status imageUri userId")
      .populate("lastMessageSenderId", "displayName profileImage email");

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (!isParticipant(conversation, req.userId as string)) {
      return res.status(403).json({ error: "Not authorized to send messages in this conversation" });
    }

    const message = await Message.create({
      conversationId,
      senderId: req.userId,
      text: text.trim(),
    });

    const recipientId = conversation.participants
      .map((participant: any) => toStringId(participant))
      .find((participantId: string) => participantId !== req.userId);

    if (recipientId) {
      const recipient = await User.findById(recipientId).select("expoPushToken");
      if (recipient?.expoPushToken) {
        await sendPushNotification(
          recipient.expoPushToken,
          "New message",
          text.trim(),
          {
            type: "chat-message",
            conversationId,
          },
        );
      }
    }

    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    conversation.lastMessageSenderId = new mongoose.Types.ObjectId(req.userId);
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate(
      "senderId",
      "displayName profileImage email"
    );

    return res.status(201).json({
      message: formatMessage(populatedMessage),
      conversation: formatConversation(
        await Conversation.findById(conversationId)
          .populate("participants", "displayName profileImage email")
          .populate("postId", "title status imageUri userId")
          .populate("lastMessageSenderId", "displayName profileImage email"),
        req.userId
      ),
    });
  } catch (error) {
    console.error("Message send error:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

router.delete("/conversations/:conversationId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (!isParticipant(conversation, req.userId as string)) {
      return res.status(403).json({ error: "Not authorized to delete this conversation" });
    }

    await Message.deleteMany({ conversationId });
    await Conversation.deleteOne({ _id: conversationId });

    return res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Conversation delete error:", error);
    return res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export default router;



