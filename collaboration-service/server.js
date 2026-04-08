const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const marked = require('marked');
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');

const app = express();
const PORT = process.env.PORT || 4006;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://collabuser:collabpass@postgres:5432/collabdb'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // limit each IP to 200 requests per windowMs
});
app.use('/api/', limiter);

// File upload configuration
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|md|zip|json|xml|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Markdown sanitizer setup
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Create tables
const createTables = async () => {
  // Comments table
  const commentsTable = `
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      task_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      username VARCHAR(100) NOT NULL,
      content TEXT NOT NULL,
      content_html TEXT,
      parent_id INTEGER REFERENCES comments(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      edited BOOLEAN DEFAULT FALSE
    )
  `;

  // Attachments table
  const attachmentsTable = `
    CREATE TABLE IF NOT EXISTS attachments (
      id SERIAL PRIMARY KEY,
      task_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      username VARCHAR(100) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      original_filename VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(commentsTable);
    await pool.query(attachmentsTable);
    console.log('Collaboration tables created or already exist');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
};

// Initialize database
createTables();

// Helper function to render markdown to HTML
const renderMarkdown = (content) => {
  const html = marked(content);
  return purify.sanitize(html);
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'collaboration-service' });
});

// Comments endpoints

// Get comments for a task
app.get('/api/tasks/:taskId/comments', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const result = await pool.query(
      `SELECT c.*, 
        CASE WHEN c.parent_id IS NULL THEN 'root' ELSE 'reply' END as comment_type
      FROM comments c 
      WHERE c.task_id = $1 
      ORDER BY c.created_at ASC`,
      [taskId]
    );

    res.json({ comments: result.rows });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment to task
app.post('/api/tasks/:taskId/comments', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, username, content, parentId } = req.body;

    if (!userId || !username || !content) {
      return res.status(400).json({ error: 'userId, username, and content are required' });
    }

    const contentHtml = renderMarkdown(content);

    const result = await pool.query(
      `INSERT INTO comments (task_id, user_id, username, content, content_html, parent_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [taskId, userId, username, content, contentHtml, parentId || null]
    );

    res.status(201).json({ comment: result.rows[0] });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update comment
app.put('/api/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }

    const contentHtml = renderMarkdown(content);

    const result = await pool.query(
      `UPDATE comments 
       SET content = $1, content_html = $2, updated_at = CURRENT_TIMESTAMP, edited = TRUE
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [content, contentHtml, commentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    res.json({ comment: result.rows[0] });
  } catch (err) {
    console.error('Update comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete comment
app.delete('/api/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await pool.query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [commentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// File attachments endpoints

// Get attachments for a task
app.get('/api/tasks/:taskId/attachments', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const result = await pool.query(
      `SELECT id, filename, original_filename, file_size, mime_type, uploaded_at, username
       FROM attachments 
       WHERE task_id = $1 
       ORDER BY uploaded_at DESC`,
      [taskId]
    );

    res.json({ attachments: result.rows });
  } catch (err) {
    console.error('Get attachments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload file to task
app.post('/api/tasks/:taskId/attachments', upload.single('file'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, username } = req.body;

    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await pool.query(
      `INSERT INTO attachments 
       (task_id, user_id, username, filename, original_filename, file_path, file_size, mime_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, filename, original_filename, file_size, mime_type, uploaded_at, username`,
      [taskId, userId, username, req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype]
    );

    res.status(201).json({ attachment: result.rows[0] });
  } catch (err) {
    console.error('Upload file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download file
app.get('/api/attachments/:attachmentId/download', async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    const result = await pool.query(
      'SELECT file_path, original_filename, mime_type FROM attachments WHERE id = $1',
      [attachmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const attachment = result.rows[0];
    
    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.setHeader('Content-Type', attachment.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_filename}"`);
    
    const fileStream = fs.createReadStream(attachment.file_path);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Download file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete attachment
app.delete('/api/attachments/:attachmentId', async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get attachment info
    const attachmentResult = await pool.query(
      'SELECT file_path FROM attachments WHERE id = $1 AND user_id = $2',
      [attachmentId, userId]
    );

    if (attachmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found or unauthorized' });
    }

    // Delete file from disk
    const filePath = attachmentResult.rows[0].file_path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await pool.query(
      'DELETE FROM attachments WHERE id = $1 AND user_id = $2',
      [attachmentId, userId]
    );

    res.status(204).send();
  } catch (err) {
    console.error('Delete attachment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get task activity (comments + attachments)
app.get('/api/tasks/:taskId/activity', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Get comments
    const commentsResult = await pool.query(
      `SELECT id, 'comment' as type, username, content, created_at, updated_at, edited
       FROM comments 
       WHERE task_id = $1`,
      [taskId]
    );

    // Get attachments
    const attachmentsResult = await pool.query(
      `SELECT id, 'attachment' as type, username, original_filename as content, uploaded_at as created_at
       FROM attachments 
       WHERE task_id = $1`,
      [taskId]
    );

    // Combine and sort by date
    const activity = [...commentsResult.rows, ...attachmentsResult.rows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ activity });
  } catch (err) {
    console.error('Get activity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Collaboration Service running on port ${PORT}`);
});

module.exports = app;
