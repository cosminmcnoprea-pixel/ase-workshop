// Cloud Run deployment
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/devtaskhub",
});

// Initialize database table with retry logic for Cloud Run cold starts
async function initDatabase(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id VARCHAR(36) PRIMARY KEY,
          message TEXT NOT NULL,
          type VARCHAR(20) DEFAULT 'info',
          task_id VARCHAR(36),
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
        )
      `);
      console.log("Database initialized successfully");
      return;
    } catch (error) {
      console.error(`Database init attempt ${i + 1}/${retries} failed:`, error.message);
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.error("Database initialization failed after all retries, continuing anyway...");
}

// Database init is called after server starts listening (see below)

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "notification-service" });
});

app.get("/notifications", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, message, type, task_id AS \"taskId\", read, created_at AS \"createdAt\" FROM notifications ORDER BY created_at DESC LIMIT 50"
    );
    res.json(result.rows);
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
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await pool.query(
      "INSERT INTO notifications (id, message, type, task_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, message, type, task_id AS \"taskId\", read, created_at AS \"createdAt\"",
      [id, message, type, taskId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/notifications/:id/read", async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING id, message, type, task_id AS \"taskId\", read, created_at AS \"createdAt\"",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/notifications", async (req, res) => {
  try {
    await pool.query("DELETE FROM notifications");
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
  initDatabase();
});

module.exports = app;
