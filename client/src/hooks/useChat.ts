import { useEffect, useRef, useState } from "react";
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
  const [unreadCount, setUnreadCount] = useState(0);

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
      updateUnreadCount(data.messages);
    });

    // Receive new message
    socket.on("chat:message-received", (message: ChatMessage) => {
      console.log("[Chat] New message received:", message);
      setMessages((prev) => [...prev, message]);
      
      // Update unread count
      if (!message.read) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    // User joined notification
    socket.on("chat:user-joined", (data: { orderId: number; userId: number; userRole: string; userName: string }) => {
      console.log(`[Chat] ${data.userRole} ${data.userName} joined the chat`);
    });

    // User left notification
    socket.on("chat:user-left", (data: { orderId: number; userId: number; userRole: string; userName: string }) => {
      console.log(`[Chat] ${data.userRole} ${data.userName} left the chat`);
    });

    // Messages marked as read
    socket.on("chat:messages-read", (data: { orderId: number; userId: number }) => {
      console.log("[Chat] Messages marked as read by user:", data.userId);
      setMessages((prev) =>
        prev.map((msg) => (msg.senderId !== data.userId ? { ...msg, read: true } : msg))
      );
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("[Chat] Error:", error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const updateUnreadCount = (msgs: ChatMessage[]) => {
    const unread = msgs.filter((msg) => !msg.read).length;
    setUnreadCount(unread);
  };

  // Join chat room
  const joinChat = (orderId: number, userId: number, userRole: "customer" | "driver", userName: string) => {
    if (socketRef.current) {
      socketRef.current.emit("chat:join", { orderId, userId, userRole, userName });
    }
  };

  // Send message
  const sendMessage = (orderId: number, userId: number, userRole: "customer" | "driver", userName: string, message: string) => {
    if (socketRef.current) {
      socketRef.current.emit("chat:send-message", {
        orderId,
        userId,
        userRole,
        userName,
        message,
      });
    }
  };

  // Mark messages as read
  const markAsRead = (orderId: number, userId: number) => {
    if (socketRef.current) {
      socketRef.current.emit("chat:mark-read", { orderId, userId });
    }
  };

  // Leave chat room
  const leaveChat = (orderId: number, userId: number, userRole: "customer" | "driver", userName: string) => {
    if (socketRef.current) {
      socketRef.current.emit("chat:leave", { orderId, userId, userRole, userName });
    }
  };

  return {
    isConnected,
    messages,
    unreadCount,
    joinChat,
    sendMessage,
    markAsRead,
    leaveChat,
  };
}
