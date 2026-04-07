const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
app.use(cors());
app.use(express.json());

// Database setup
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://taskuser:taskpass@postgres:5432/taskdb";
const sequelize = new Sequelize(DATABASE_URL);

// Notification model
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('info', 'success', 'warning'),
    defaultValue: 'info'
  },
  taskId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notifications',
  timestamps: true
});

// Initialize database
async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    await Notification.sync();
    console.log('Notification table synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "healthy", service: "notification-service" });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});

app.get("/notifications", async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/notifications", async (req, res) => {
  try {
    const { message, type = "info", taskId = null } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }
    
    const notification = await Notification.create({
      message,
      type,
      taskId
    });
    
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/notifications/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "Not found" });
    }
    
    await notification.update({ read: true });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/notifications", async (req, res) => {
  try {
    await Notification.destroy({ where: {} });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

// Start server with database initialization
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Notification service running on port ${PORT}`);
  });
});

module.exports = app;
