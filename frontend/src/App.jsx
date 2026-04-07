import { useState, useEffect, useCallback } from "react";

const TASK_API = import.meta.env.VITE_TASK_API_URL || "http://localhost:8000";
const NOTIF_API = import.meta.env.VITE_NOTIFICATION_API_URL || "http://localhost:3001";

const PRIORITY_COLORS = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };
const STATUS_FLOW = { todo: "in-progress", "in-progress": "done", done: "todo" };

function App() {
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [health, setHealth] = useState({ tasks: false, notifications: false });
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", priority: "medium" });

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${TASK_API}/tasks`);
      setTasks(await res.json());
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${NOTIF_API}/notifications`);
      setNotifications(await res.json());
    } catch {}
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const r = await fetch(`${TASK_API}/health`);
      setHealth((h) => ({ ...h, tasks: r.ok }));
    } catch {
      setHealth((h) => ({ ...h, tasks: false }));
    }
    try {
      const r = await fetch(`${NOTIF_API}/health`);
      setHealth((h) => ({ ...h, notifications: r.ok }));
    } catch {
      setHealth((h) => ({ ...h, notifications: false }));
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchNotifications();
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [fetchTasks, fetchNotifications, checkHealth]);

  const sendNotification = async (message, type = "info", taskId = null) => {
    try {
      await fetch(`${NOTIF_API}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, type, taskId }),
      });
      fetchNotifications();
    } catch {}
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      const res = await fetch(`${TASK_API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const task = await res.json();
      setForm({ title: "", description: "", priority: "medium" });
      fetchTasks();
      sendNotification(`Task "${task.title}" created`, "success", task.id);
    } catch {}
  };

  const toggleStatus = async (task) => {
    const newStatus = STATUS_FLOW[task.status];
    try {
      await fetch(`${TASK_API}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
      if (newStatus === "done") {
        sendNotification(`Task "${task.title}" completed!`, "success", task.id);
      }
    } catch {}
  };

  const deleteTask = async (task) => {
    try {
      await fetch(`${TASK_API}/tasks/${task.id}`, { method: "DELETE" });
      fetchTasks();
      sendNotification(`Task "${task.title}" deleted`, "warning", task.id);
    } catch {}
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setEditForm({ 
      title: task.title, 
      description: task.description, 
      priority: task.priority 
    });
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditForm({ title: "", description: "", priority: "medium" });
  };

  const updateTask = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim() || !editingTask) return;
    try {
      await fetch(`${TASK_API}/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      fetchTasks();
      sendNotification(`Task "${editForm.title}" updated`, "info", editingTask.id);
      cancelEdit();
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const styles = {
    app: { fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: "#f1f5f9", margin: 0 },
    header: { background: "#1e293b", color: "#fff", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    logo: { fontSize: 24, fontWeight: 700, margin: 0 },
    subtitle: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
    bellWrap: { position: "relative", cursor: "pointer" },
    bell: { fontSize: 22, background: "none", border: "none", color: "#fff", cursor: "pointer" },
    badge: { position: "absolute", top: -6, right: -8, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
    notifPanel: { position: "absolute", top: 40, right: 0, width: 320, background: "#fff", borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,.15)", zIndex: 10, maxHeight: 350, overflowY: "auto" },
    notifItem: { padding: "10px 14px", borderBottom: "1px solid #f1f5f9", fontSize: 13 },
    main: { maxWidth: 900, margin: "0 auto", padding: "24px 16px" },
    form: { background: "#fff", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 24 },
    formTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#334155" },
    row: { display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" },
    input: { flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 14, minWidth: 150 },
    select: { padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 14 },
    btn: { padding: "8px 18px", borderRadius: 6, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 },
    card: { background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    cardTitle: { fontSize: 16, fontWeight: 600, color: "#1e293b" },
    cardDesc: { fontSize: 13, color: "#64748b", marginTop: 4 },
    priorityBadge: (p) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "#fff", background: PRIORITY_COLORS[p] || "#94a3b8", marginRight: 6 }),
    statusBadge: { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: "#e2e8f0", color: "#334155" },
    actions: { display: "flex", gap: 6, marginTop: 8 },
    smallBtn: { padding: "4px 10px", borderRadius: 4, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12 },
    editBtn: { padding: "4px 10px", borderRadius: 4, border: "1px solid #dbeafe", background: "#fff", color: "#3b82f6", cursor: "pointer", fontSize: 12 },
    deleteBtn: { padding: "4px 10px", borderRadius: 4, border: "1px solid #fecaca", background: "#fff", color: "#ef4444", cursor: "pointer", fontSize: 12 },
    modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modalContent: { background: "#fff", borderRadius: 12, padding: 24, width: "90%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
    modalTitle: { fontSize: 18, fontWeight: 600, marginBottom: 16, color: "#1e293b" },
    modalActions: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 },
    cancelBtn: { padding: "8px 16px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 14 },
    saveBtn: { padding: "8px 16px", borderRadius: 6, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 },
    footer: { textAlign: "center", padding: "16px", fontSize: 12, color: "#94a3b8", display: "flex", justifyContent: "center", gap: 16 },
    dot: (ok) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: ok ? "#22c55e" : "#ef4444", marginRight: 4 }),
    empty: { textAlign: "center", color: "#94a3b8", padding: 32, fontSize: 14 },
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>DevTask Hub</h1>
          <div style={styles.subtitle}>Microservices Task Manager</div>
        </div>
        <div style={styles.bellWrap}>
          <button style={styles.bell} onClick={() => setShowNotifs(!showNotifs)}>
            🔔
          </button>
          {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
          {showNotifs && (
            <div style={styles.notifPanel}>
              {notifications.length === 0 ? (
                <div style={styles.notifItem}>No notifications</div>
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <div key={n.id} style={{ ...styles.notifItem, fontWeight: n.read ? 400 : 600 }}>
                    <span style={{ marginRight: 6 }}>
                      {n.type === "success" ? "✅" : n.type === "warning" ? "⚠️" : "ℹ️"}
                    </span>
                    {n.message}
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </header>

      <main style={styles.main}>
        <form style={styles.form} onSubmit={createTask}>
          <div style={styles.formTitle}>Create New Task</div>
          <div style={styles.row}>
            <input
              style={styles.input}
              placeholder="Task title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <select
              style={styles.select}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div style={styles.row}>
            <input
              style={styles.input}
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <button style={styles.btn} type="submit">Add Task</button>
          </div>
        </form>

        {tasks.length === 0 ? (
          <div style={styles.empty}>No tasks yet. Create one above!</div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} style={styles.card}>
              <div style={{ flex: 1 }}>
                <div style={styles.cardTitle}>{task.title}</div>
                {task.description && <div style={styles.cardDesc}>{task.description}</div>}
                <div style={{ marginTop: 8 }}>
                  <span style={styles.priorityBadge(task.priority)}>{task.priority}</span>
                  <span style={styles.statusBadge}>{task.status}</span>
                </div>
                <div style={styles.actions}>
                  <button style={styles.editBtn} onClick={() => startEdit(task)}>
                    Edit
                  </button>
                  <button style={styles.smallBtn} onClick={() => toggleStatus(task)}>
                    {task.status === "todo" ? "Start" : task.status === "in-progress" ? "Done" : "Reopen"}
                  </button>
                  <button style={styles.deleteBtn} onClick={() => deleteTask(task)}>
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                {new Date(task.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Edit Modal */}
      {editingTask && (
        <div style={styles.modal} onClick={cancelEdit}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Edit Task</div>
            <form onSubmit={updateTask}>
              <div style={styles.row}>
                <input
                  style={styles.input}
                  placeholder="Task title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
                <select
                  style={styles.select}
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div style={styles.row}>
                <input
                  style={styles.input}
                  placeholder="Description (optional)"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={cancelEdit}>
                  Cancel
                </button>
                <button type="submit" style={styles.saveBtn}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span><span style={styles.dot(health.tasks)} />Task Service</span>
        <span><span style={styles.dot(health.notifications)} />Notification Service</span>
      </footer>
    </div>
  );
}

export default App;
