import React, { createContext, useContext, ReactNode } from "react";
import { useChat } from "@/hooks/useChat";

interface ChatContextType {
  unreadCounts: Record<number, number>;
  isConnected: boolean;
  joinChat: (orderId: number, userId: number, userRole: "customer" | "driver", userName: string) => void;
  sendMessage: (orderId: number, userId: number, userRole: "customer" | "driver", userName: string, message: string) => void;
  markAsRead: (orderId: number, userId: number) => void;
  leaveChat: (orderId: number, userId: number, userRole: "customer" | "driver", userName: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const chat = useChat();

  return (
    <ChatContext.Provider value={chat}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
