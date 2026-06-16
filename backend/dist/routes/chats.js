"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const Conversation_1 = require("../models/Conversation");
const Message_1 = __importDefault(require("../models/Message"));
const Post_1 = __importDefault(require("../models/Post"));
const User_1 = __importDefault(require("../models/User"));
const notifications_1 = require("../services/notifications");
const router = (0, express_1.Router)();
const toStringId = (value) => (value?._id || value?.id || value)?.toString?.() || String(value);
const buildParticipantKey = (userA, userB, postId) => {
    return [userA, userB].sort().join("_") + `_${postId}`;
};
const formatUser = (user) => ({
    id: toStringId(user),
    displayName: user?.displayName,
    profileImage: user?.profileImage,
    email: user?.email,
});
const formatConversation = (conversation, currentUserId) => {
    const participants = Array.isArray(conversation.participants)
        ? conversation.participants.map(formatUser)
        : [];
    const otherUser = currentUserId
        ? participants.find((participant) => participant.id !== currentUserId) || null
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
const formatMessage = (message) => ({
    id: toStringId(message),
    conversationId: toStringId(message.conversationId),
    senderId: message.senderId ? formatUser(message.senderId) : null,
    text: message.text,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
});
const isParticipant = (conversation, userId) => {
    return conversation.participants.some((participant) => toStringId(participant) === userId);
};
router.get("/conversations", auth_1.verifyToken, async (req, res) => {
    try {
        const conversations = await Conversation_1.Conversation.find({ participants: req.userId })
            .populate("participants", "displayName profileImage email")
            .populate("postId", "title status imageUri userId")
            .populate("lastMessageSenderId", "displayName profileImage email")
            .sort({ lastMessageAt: -1, updatedAt: -1 });
        return res.status(200).json({
            conversations: conversations.map((conversation) => formatConversation(conversation, req.userId)),
        });
    }
    catch (error) {
        console.error("Conversations fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch conversations" });
    }
});
router.post("/conversations", auth_1.verifyToken, async (req, res) => {
    try {
        const { postId, otherUserId } = req.body;
        if (!postId || !otherUserId) {
            return res.status(400).json({ error: "postId and otherUserId are required" });
        }
        if (otherUserId === req.userId) {
            return res.status(400).json({ error: "You cannot start a conversation with yourself" });
        }
        const post = await Post_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        if (toStringId(post.userId) !== otherUserId) {
            return res.status(400).json({ error: "Conversation can only be started with the post owner" });
        }
        const participantKey = buildParticipantKey(req.userId, otherUserId, toStringId(post._id));
        let conversation = await Conversation_1.Conversation.findOne({ participantKey })
            .populate("participants", "displayName profileImage email")
            .populate("postId", "title status imageUri userId")
            .populate("lastMessageSenderId", "displayName profileImage email");
        if (!conversation) {
            conversation = await Conversation_1.Conversation.create({
                postId: post._id,
                participants: [new mongoose_1.default.Types.ObjectId(req.userId), new mongoose_1.default.Types.ObjectId(otherUserId)],
                participantKey,
            });
            conversation = await Conversation_1.Conversation.findById(conversation._id)
                .populate("participants", "displayName profileImage email")
                .populate("postId", "title status imageUri userId")
                .populate("lastMessageSenderId", "displayName profileImage email");
        }
        return res.status(200).json({ conversation: formatConversation(conversation, req.userId) });
    }
    catch (error) {
        console.error("Conversation create error:", error);
        return res.status(500).json({ error: "Failed to create conversation" });
    }
});
router.get("/conversations/:conversationId/messages", auth_1.verifyToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const conversation = await Conversation_1.Conversation.findById(conversationId)
            .populate("participants", "displayName profileImage email")
            .populate("postId", "title status imageUri userId")
            .populate("lastMessageSenderId", "displayName profileImage email");
        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }
        if (!isParticipant(conversation, req.userId)) {
            return res.status(403).json({ error: "Not authorized to access this conversation" });
        }
        const messages = await Message_1.default.find({ conversationId })
            .populate("senderId", "displayName profileImage email")
            .sort({ createdAt: 1 });
        return res.status(200).json({
            conversation: formatConversation(conversation, req.userId),
            messages: messages.map(formatMessage),
        });
    }
    catch (error) {
        console.error("Messages fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch messages" });
    }
});
router.post("/conversations/:conversationId/messages", auth_1.verifyToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ error: "Message text is required" });
        }
        const conversation = await Conversation_1.Conversation.findById(conversationId)
            .populate("participants", "displayName profileImage email")
            .populate("postId", "title status imageUri userId")
            .populate("lastMessageSenderId", "displayName profileImage email");
        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }
        if (!isParticipant(conversation, req.userId)) {
            return res.status(403).json({ error: "Not authorized to send messages in this conversation" });
        }
        const message = await Message_1.default.create({
            conversationId,
            senderId: req.userId,
            text: text.trim(),
        });
        const recipientId = conversation.participants
            .map((participant) => toStringId(participant))
            .find((participantId) => participantId !== req.userId);
        if (recipientId) {
            const recipient = await User_1.default.findById(recipientId).select("expoPushToken");
            if (recipient?.expoPushToken) {
                await (0, notifications_1.sendPushNotification)(recipient.expoPushToken, "New message", text.trim(), {
                    type: "chat-message",
                    conversationId,
                });
            }
        }
        conversation.lastMessage = text.trim();
        conversation.lastMessageAt = new Date();
        conversation.lastMessageSenderId = new mongoose_1.default.Types.ObjectId(req.userId);
        await conversation.save();
        const populatedMessage = await Message_1.default.findById(message._id).populate("senderId", "displayName profileImage email");
        return res.status(201).json({
            message: formatMessage(populatedMessage),
            conversation: formatConversation(await Conversation_1.Conversation.findById(conversationId)
                .populate("participants", "displayName profileImage email")
                .populate("postId", "title status imageUri userId")
                .populate("lastMessageSenderId", "displayName profileImage email"), req.userId),
        });
    }
    catch (error) {
        console.error("Message send error:", error);
        return res.status(500).json({ error: "Failed to send message" });
    }
});
router.delete("/conversations/:conversationId", auth_1.verifyToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const conversation = await Conversation_1.Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }
        if (!isParticipant(conversation, req.userId)) {
            return res.status(403).json({ error: "Not authorized to delete this conversation" });
        }
        await Message_1.default.deleteMany({ conversationId });
        await Conversation_1.Conversation.deleteOne({ _id: conversationId });
        return res.status(200).json({ message: "Conversation deleted successfully" });
    }
    catch (error) {
        console.error("Conversation delete error:", error);
        return res.status(500).json({ error: "Failed to delete conversation" });
    }
});
exports.default = router;
//# sourceMappingURL=chats.js.map