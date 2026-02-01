import "reflect-metadata";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { AppDataSource } from "./config/database";
import apiRoutes from "./routes";
import { setupSocketHandlers } from "./websocket";

const PORT = parseInt(process.env.PORT || "3000", 10);

async function main() {
  // Initialize database connection
  try {
    await AppDataSource.initialize();
    console.log("Database connection established");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }

  // Create Express app
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
    })
  );
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API routes
  app.use("/api", apiRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error handler
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error("Unhandled error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  );

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  setupSocketHandlers(io);

  // Start server
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`  - HTTP: http://localhost:${PORT}`);
    console.log(`  - WebSocket: ws://localhost:${PORT}`);
    console.log(`  - API: http://localhost:${PORT}/api`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\nShutting down...");
    httpServer.close();
    await AppDataSource.destroy();
    console.log("Server stopped");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
