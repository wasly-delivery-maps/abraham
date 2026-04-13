import { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, X, Loader2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface ChatBoxProps {
  orderId: number;
  userId: number;
  userRole: "customer" | "driver";
  userName: string;
  otherUserName: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ChatBox({
  orderId,
  userId,
  userRole,
  userName,
  otherUserName,
  isOpen = true,
  onClose,
}: ChatBoxProps) {
  const { isConnected, messages, unreadCount, joinChat, sendMessage, markAsRead, leaveChat } = useChat();
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Join chat on mount
  useEffect(() => {
    if (isOpen) {
      joinChat(orderId, userId, userRole, userName);
      markAsRead(orderId, userId);
    }

    return () => {
      if (isOpen) {
        leaveChat(orderId, userId, userRole, userName);
      }
    };
  }, [orderId, userId, userRole, userName, isOpen, joinChat, markAsRead, leaveChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    setIsLoading(true);
    sendMessage(orderId, userId, userRole, userName, messageText);
    setMessageText("");
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  const filteredMessages = messages.filter((msg) => msg.orderId === orderId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
    >
      <Card className="shadow-2xl border-2 border-blue-200 bg-white dark:bg-slate-900">
        {/* Header */}
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">{otherUserName}</CardTitle>
                <p className="text-xs text-blue-100">
                  {isConnected ? "متصل" : "غير متصل"}
                  {unreadCount > 0 && ` • ${unreadCount} رسالة جديدة`}
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </CardHeader>

        {/* Messages Container */}
        <CardContent className="p-4 h-96 overflow-y-auto bg-gray-50 dark:bg-slate-800 space-y-3">
          {!isConnected && (
            <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                جاري الاتصال بخادم المحادثة...
              </p>
            </div>
          )}

          <AnimatePresence>
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-sm">لا توجد رسائل بعد</p>
              </div>
            ) : (
              filteredMessages.map((msg, index) => (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.senderId === userId
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-600 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">{msg.senderName}</p>
                    <p className="text-sm break-words">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.senderId === userId
                          ? "text-blue-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formatDistanceToNow(new Date(msg.timestamp), {
                        locale: ar,
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-b-lg">
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك هنا..."
              disabled={!isConnected || isLoading}
              className="flex-1 text-right"
              dir="rtl"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!isConnected || isLoading || !messageText.trim()}
              size="icon"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
