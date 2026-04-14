import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

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
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

  useEffect(() => {
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
    });

    socket.on("disconnect", () => {
      console.log("[Chat] Disconnected from chat server");
      setIsConnected(false);
    });

    // Receive chat history
    socket.on("chat:history", (data: { orderId: number; messages: ChatMessage[] }) => {
      console.log("[Chat] Received chat history:", data.messages.length, "messages");
      setMessages(data.messages);
      
      // Update unread count for this specific order
      const unread = data.messages.filter((msg) => !msg.read).length;
      setUnreadCounts(prev => ({ ...prev, [data.orderId]: unread }));
    });

    // Receive new message
    socket.on("chat:message-received", (message: ChatMessage) => {
      console.log("[Chat] New message received:", message);
      setMessages((prev) => [...prev, message]);
      
      // Update unread count for the specific order if not read
      if (!message.read) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.orderId]: (prev[message.orderId] || 0) + 1
        }));
      }
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
  }, []);

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
