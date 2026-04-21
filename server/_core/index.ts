import 'dotenv/config';
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { Server as SocketIOServer } from "socket.io";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./oauth";
import "./firebase";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { setupLocationTracking } from "./locationTracking";
import { setupOrderNotifications } from "./orderNotifications";
import { setupChat } from "./chat";
import { registerSSEConnection, sendPushNotificationToUser as sendNotificationToUser, getVapidPublicKey, removePushSubscription, notifyDriversOfNewOrder } from "../notifications";
import { upsertPushSubscription, getAvailableOrders } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Log environment status
  console.log("[Environment] Server starting...");
  if (!process.env.DATABASE_URL) {
    console.warn("[Environment] WARNING: DATABASE_URL is not set. Falling back to in-memory database.");
  } else {
    console.log("[Environment] DATABASE_URL is configured.");
  }
  
  const app = express();
  app.set('trust proxy', true);
  const server = createServer(app);
  
  // Initialize Socket.IO for real-time location tracking
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  
  // Setup location tracking
  setupLocationTracking(io);
  
  // Setup order notifications
  setupOrderNotifications(io);

  // Setup chat system
  setupChat(io);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));
  app.use(cookieParser());
  // Health check endpoint for Railway/Docker
  app.get("/health", (req, res) => {
    res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
  });

  // Authentication routes
  registerAuthRoutes(app);
  
  // SSE Notifications endpoint
  app.get("/api/notifications/subscribe/:userId", (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    registerSSEConnection(userId, res);
  });
  
  // Push Notifications Subscription endpoints
  app.get("/api/notifications/vapid-public-key", (req, res) => {
    res.json({ publicKey: getVapidPublicKey() });
  });

  app.post("/api/notifications/subscribe", async (req, res) => {
    try {
      // In a real app, we would get the userId from the session
      // For now, we'll try to find it from the session or expect it in the body
      const userId = (req as any).user?.id || req.body.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      
      const subscription = req.body;
      await upsertPushSubscription(userId, subscription);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("[Notifications] Failed to subscribe:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/notifications/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        res.status(400).json({ error: "Endpoint is required" });
        return;
      }
      await removePushSubscription(endpoint);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("[Notifications] Failed to unsubscribe:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Serve uploaded files statically
  const uploadsPath = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsPath));
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  // Store io instance for use in routers
  (app as any).io = io;
  (app as any).sendNotificationToUser = sendNotificationToUser;

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`WebSocket server initialized on port ${port}`);
    
    // إعداد نظام التذكير الدوري للسائقين كل 30 ثانية
    let reminderIntervalId: NodeJS.Timeout | null = null;
    
    reminderIntervalId = setInterval(async () => {
      try {
        const pendingOrders = await getAvailableOrders();
        
        if (pendingOrders && pendingOrders.length > 0) {
          console.log(`[Reminder] Found ${pendingOrders.length} pending orders. Notifying drivers...`);
          
          // إرسال تنبيه تذكيري لجميع السائقين
          // نستخدم معرف أول طلب في الرسالة كمثال أو نرسل رسالة عامة
          const count = pendingOrders.length;
          const message = count === 1 
            ? `تذكير: يوجد طلب متاح الآن بانتظارك! 🚀` 
            : `تذكير: يوجد ${count} طلبات متاحة الآن بانتظارك! 🚀`;
          
          console.log(`[Reminder] Sending notification for order ${pendingOrders[0].id}: ${message}`);
          await notifyDriversOfNewOrder(pendingOrders[0].id, message);
          console.log(`[Reminder] Notification sent successfully`);
        } else {
          console.log(`[Reminder] No pending orders found`);
        }
      } catch (error) {
        console.error("[Reminder] Error in periodic driver notification:", error);
      }
    }, 30000); // 30 ثانية
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[Server] SIGTERM received, cleaning up...');
      if (reminderIntervalId) {
        clearInterval(reminderIntervalId);
      }
      server.close(() => {
        console.log('[Server] Server closed');
        process.exit(0);
      });
    });
  });
}

startServer().catch(console.error);

export { SocketIOServer };
