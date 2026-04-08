// Cloud Run deployment
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const notifications = [];

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "notification-service" });
});

app.get("/notifications", (req, res) => {
  res.json(notifications);
});

app.post("/notifications", (req, res) => {
  const { message, type = "info", taskId = null } = req.body;
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }
  const notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    type,
    taskId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(notification);
  // Keep only last 50 notifications
  if (notifications.length > 50) notifications.length = 50;
  res.status(201).json(notification);
});

app.patch("/notifications/:id/read", (req, res) => {
  const notif = notifications.find((n) => n.id === req.params.id);
  if (!notif) return res.status(404).json({ error: "Not found" });
  notif.read = true;
  res.json(notif);
});

app.delete("/notifications", (req, res) => {
  notifications.length = 0;
  res.status(204).end();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});

module.exports = app;
