export interface ChatUser {
  id: string;
  displayName: string;
  profileImage?: string | null;
  email?: string;
}

export interface ChatPostSummary {
  id: string;
  title: string;
  status: "Lost" | "Found";
  imageUri?: string | null;
  userId?: string;
}

export interface ChatConversation {
  id: string;
  postId: ChatPostSummary | null;
  participants: ChatUser[];
  otherUser: ChatUser | null;
  lastMessage: string;
  lastMessageAt: string | null;
  lastMessageSenderId: ChatUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: ChatUser | null;
  text: string;
  createdAt: string;
  updatedAt: string;
}

