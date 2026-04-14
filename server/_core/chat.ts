import { Server as SocketIOServer, Socket } from "socket.io";
import { getDb } from "../db";

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

interface ChatRoom {
  orderId: number;
  customerId: number;
  driverId: number;
  messages: ChatMessage[];
  createdAt: Date;
}

// Store active chat rooms
const activeChatRooms = new Map<number, ChatRoom>();

export function setupChat(io: SocketIOServer) {
  io.on("connection", (socket: Socket) => {
    console.log(`[Chat] Client connected: ${socket.id}`);

    // User joins their personal notification room
    socket.on("chat:subscribe", (data: { userId: number }) => {
      const { userId } = data;
      socket.join(`chat:user:${userId}`);
      console.log(`[Chat] User ${userId} subscribed to personal chat notifications`);
    });

    // User joins chat room for an order
    socket.on("chat:join", async (data: { orderId: number; userId: number; userRole: "customer" | "driver"; userName: string }) => {
      try {
        const { orderId, userId, userRole, userName } = data;
        console.log(`[Chat] ${userRole} ${userId} joined chat for order ${orderId}`);

        // Join Socket.IO room
        socket.join(`chat:order:${orderId}`);

        // Get or create chat room
        let chatRoom = activeChatRooms.get(orderId);
        if (!chatRoom) {
          chatRoom = {
            orderId,
            customerId: userRole === "customer" ? userId : 0,
            driverId: userRole === "driver" ? userId : 0,
            messages: [],
            createdAt: new Date(),
          };
          activeChatRooms.set(orderId, chatRoom);
        }

        // Update IDs if needed
        if (userRole === "customer") {
          chatRoom.customerId = userId;
        } else {
          chatRoom.driverId = userId;
        }

        // Send chat history to the user
        socket.emit("chat:history", {
          orderId,
          messages: chatRoom.messages,
        });

        // Notify others in the room
        socket.to(`chat:order:${orderId}`).emit("chat:user-joined", {
          orderId,
          userId,
          userRole,
          userName,
        });

        socket.emit("chat:joined", { success: true, orderId });
      } catch (error) {
        console.error("[Chat] Error in chat:join:", error);
        socket.emit("error", { message: "Failed to join chat" });
      }
    });

    // Send message
    socket.on("chat:send-message", async (data: { orderId: number; userId: number; userRole: "customer" | "driver"; userName: string; message: string }) => {
      try {
        const { orderId, userId, userRole, userName, message } = data;

        if (!message.trim()) {
          socket.emit("error", { message: "Message cannot be empty" });
          return;
        }

        const chatMessage: ChatMessage = {
          id: `${Date.now()}-${userId}`,
          orderId,
          senderId: userId,
          senderRole: userRole,
          senderName: userName,
          message: message.trim(),
          timestamp: new Date(),
          read: false,
        };

        // Store message in chat room
        const chatRoom = activeChatRooms.get(orderId);
        if (chatRoom) {
          chatRoom.messages.push(chatMessage);
        }

        // Broadcast message to all users in the chat room
        io.to(`chat:order:${orderId}`).emit("chat:message-received", chatMessage);

        // Also send to the other party's personal room for notification
        if (chatRoom) {
          const otherPartyId = userRole === "customer" ? chatRoom.driverId : chatRoom.customerId;
          if (otherPartyId) {
            io.to(`chat:user:${otherPartyId}`).emit("chat:new-message-notification", chatMessage);
          }
        }

        console.log(`[Chat] Message sent in order ${orderId} by ${userRole} ${userId}`);
      } catch (error) {
        console.error("[Chat] Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Mark messages as read
    socket.on("chat:mark-read", (data: { orderId: number; userId: number }) => {
      try {
        const { orderId, userId } = data;
        const chatRoom = activeChatRooms.get(orderId);

        if (chatRoom) {
          chatRoom.messages.forEach(msg => {
            if (msg.senderId !== userId) {
              msg.read = true;
            }
          });
        }

        io.to(`chat:order:${orderId}`).emit("chat:messages-read", { orderId, userId });
      } catch (error) {
        console.error("[Chat] Error marking messages as read:", error);
      }
    });

    // User leaves chat room
    socket.on("chat:leave", (data: { orderId: number; userId: number; userRole: "customer" | "driver"; userName: string }) => {
      try {
        const { orderId, userId, userRole, userName } = data;
        console.log(`[Chat] ${userRole} ${userId} left chat for order ${orderId}`);

        socket.leave(`chat:order:${orderId}`);

        // Notify others
        socket.to(`chat:order:${orderId}`).emit("chat:user-left", {
          orderId,
          userId,
          userRole,
          userName,
        });
      } catch (error) {
        console.error("[Chat] Error in chat:leave:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`[Chat] Client disconnected: ${socket.id}`);
    });
  });

  console.log("[Chat] Chat system initialized");
}

// Helper function to get or create chat room and update participant IDs
export function updateChatRoomParticipants(orderId: number, customerId?: number, driverId?: number) {
  let chatRoom = activeChatRooms.get(orderId);
  if (!chatRoom) {
    chatRoom = {
      orderId,
      customerId: customerId || 0,
      driverId: driverId || 0,
      messages: [],
      createdAt: new Date(),
    };
    activeChatRooms.set(orderId, chatRoom);
  }
  
  if (customerId) chatRoom.customerId = customerId;
  if (driverId) chatRoom.driverId = driverId;
  
  return chatRoom;
}

// Helper function to get chat room
export function getChatRoom(orderId: number): ChatRoom | undefined {
  return activeChatRooms.get(orderId);
}

// Helper function to broadcast message
export function broadcastChatMessage(io: SocketIOServer, orderId: number, message: ChatMessage) {
  io.to(`chat:order:${orderId}`).emit("chat:message-received", message);
}

// Helper function to clear chat room
export function clearChatRoom(orderId: number) {
  activeChatRooms.delete(orderId);
}
