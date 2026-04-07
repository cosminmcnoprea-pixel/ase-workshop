const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://app_user:app_password@localhost:5432/devopstask_hub",
});

// Initialize database
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        message TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning')),
        task_id VARCHAR(255),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON notifications(task_id);
    `);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "healthy", service: "notification-service" });
  } catch (error) {
    res.status(503).json({ status: "unhealthy", service: "notification-service" });
  }
});

app.get("/notifications", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50"
    );
    // Convert created_at to createdAt for frontend compatibility
    const notifications = result.rows.map(row => ({
      ...row,
      createdAt: row.created_at
    }));
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/notifications", async (req, res) => {
  const { message, type = "info", taskId = null } = req.body;
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }
  
  try {
    const notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      type,
      task_id: taskId,
      read: false,
      created_at: new Date().toISOString(),
    };
    
    await pool.query(
      `INSERT INTO notifications (id, message, type, task_id, read, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [notification.id, notification.message, notification.type, notification.task_id, notification.read, notification.created_at]
    );
    
    // Return with createdAt field for frontend compatibility
    const responseNotification = {
      ...notification,
      createdAt: notification.created_at
    };
    res.status(201).json(responseNotification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/notifications/:id/read", async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE notifications SET read = true WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    
    // Return with createdAt field for frontend compatibility
    const notification = {
      ...result.rows[0],
      createdAt: result.rows[0].created_at
    };
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/notifications", async (req, res) => {
  try {
    await pool.query("DELETE FROM notifications");
    res.status(204).end();
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;

// Initialize database and start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Notification service running on port ${PORT}`);
  });
});

module.exports = app;
