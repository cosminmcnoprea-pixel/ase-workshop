const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://taskuser:taskpass@localhost:5432/taskdb",
});

// Initialize database table
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        task_id VARCHAR(255),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

// Initialize database on startup
initDatabase();

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "healthy", service: "notification-service" });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", service: "notification-service" });
  }
});

app.get("/notifications", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Database error" });
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

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.patch("/notifications/:id/read", async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/notifications", async (req, res) => {
  try {
    await pool.query("DELETE FROM notifications");
    res.status(204).end();
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ error: "Database error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});

module.exports = app;
