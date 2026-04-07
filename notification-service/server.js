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

// Initialize database table
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        taskId VARCHAR(255),
        read BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Initialize database on startup
initDatabase();

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "notification-service" });
});

app.get("/notifications", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 50"
    );
    const notifications = result.rows.map(row => ({
      ...row,
      createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
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
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await pool.query(
      "INSERT INTO notifications (id, message, type, taskId, createdAt) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
      [id, message, type, taskId]
    );
    
    const notification = {
      ...result.rows[0],
      createdAt: result.rows[0].createdAt ? result.rows[0].createdAt.toISOString() : new Date().toISOString(),
    };
    
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Internal server error" });
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
    
    const notification = {
      ...result.rows[0],
      createdAt: result.rows[0].createdAt ? result.rows[0].createdAt.toISOString() : new Date().toISOString(),
    };
    
    res.json(notification);
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
});

module.exports = app;
