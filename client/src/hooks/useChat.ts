import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/_core/hooks/useAuth";

interface ChatMessage {
  id?: string;
  orderId: number;
  senderId: number;
  senderRole: "customer" | "driver";
  senderName: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function useChat() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!user?.id) return;

    // Initialize Socket.IO connection
    const socket = io(window.location.origin, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Chat] Connected to chat server");
      setIsConnected(true);
      if (user?.id) {
        socket.emit("chat:subscribe", { userId: user.id });
      }
    });

    socket.on("disconnect", () => {
      console.log("[Chat] Disconnected from chat server");
      setIsConnected(false);
    });

    // Receive chat history
    socket.on("chat:history", (data: { orderId: number; messages: ChatMessage[] }) => {
      console.log("[Chat] Received chat history:", data.messages.length, "messages");
      setMessages(data.messages);
      
      // Update unread count for this specific order (only messages from others)
      const unread = data.messages.filter((msg) => !msg.read && msg.senderId !== user?.id).length;
      setUnreadCounts(prev => ({ ...prev, [data.orderId]: unread }));
    });

    // Receive new message
    socket.on("chat:message-received", (message: ChatMessage) => {
      console.log("[Chat] New message received:", message);
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      
      // Update unread count for the specific order if not read and not from current user
      if (!message.read && message.senderId !== user?.id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.orderId]: (prev[message.orderId] || 0) + 1
        }));
      }
    });

    // Receive notification for new message (when not in chat room)
    socket.on("chat:new-message-notification", (message: ChatMessage) => {
      console.log("[Chat] New message notification received:", message);
      // Only update unread count if we don't already have this message
      setUnreadCounts((prev) => ({
        ...prev,
        [message.orderId]: (prev[message.orderId] || 0) + 1
      }));
    });

    // Messages marked as read
    socket.on("chat:messages-read", (data: { orderId: number; userId: number }) => {
      console.log("[Chat] Messages marked as read by user:", data.userId);
      setMessages((prev) =>
        prev.map((msg) => (msg.orderId === data.orderId && msg.senderId !== data.userId ? { ...msg, read: true } : msg))
      );
      // Reset unread count for this order
      setUnreadCounts(prev => ({ ...prev, [data.orderId]: 0 }));
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  // Join chat room
  const joinChat = useCallback((orderId: number, userId: number, userRole: "customer" | "driver", userName: string) => {
    if (socketRef.current) {
      socketRef.current.emit("chat:join", { orderId, userId, userRole, userName });
    }
  }, []);

  // Send message
  const sendMessage = useCallback((orderId: number, userId: number, userRole: "customer" | "driver", userName: string, message: string) => {
    if (socketRef.current) {
      socketRef.current.emit("chat:send-message", {
        orderId,
        userId,
        userRole,
        userName,
        message,
      });
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback((orderId: number, userId: number) => {
    if (socketRef.current) {
      socketRef.current.emit("chat:mark-read", { orderId, userId });
      setUnreadCounts(prev => ({ ...prev, [orderId]: 0 }));
    }
  }, []);

  // Leave chat room
  const leaveChat = useCallback((orderId: number, userId: number, userRole: "customer" | "driver", userName: string) => {
    if (socketRef.current) {
      socketRef.current.emit("chat:leave", { orderId, userId, userRole, userName });
    }
  }, []);

  return {
    isConnected,
    messages,
    unreadCounts,
    joinChat,
    sendMessage,
    markAsRead,
    leaveChat,
  };
}
