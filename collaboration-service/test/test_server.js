const request = require('supertest');
const app = require('../server');

describe('Collaboration Service', () => {
  test('Health check endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
    expect(response.body.service).toBe('collaboration-service');
  });

  test('Get comments for task', async () => {
    const taskId = 'test-task-123';
    const response = await request(app)
      .get(`/api/tasks/${taskId}/comments`)
      .expect(200);
    
    expect(response.body.comments).toBeDefined();
    expect(Array.isArray(response.body.comments)).toBe(true);
  });

  test('Add comment to task', async () => {
    const taskId = 'test-task-123';
    const commentData = {
      userId: 'user-123',
      username: 'testuser',
      content: 'This is a test comment with **markdown** support'
    };

    const response = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .send(commentData)
      .expect(201);

    expect(response.body.comment.content).toBe(commentData.content);
    expect(response.body.comment.username).toBe(commentData.username);
    expect(response.body.comment.content_html).toContain('<strong>');
  });

  test('Get attachments for task', async () => {
    const taskId = 'test-task-123';
    const response = await request(app)
      .get(`/api/tasks/${taskId}/attachments`)
      .expect(200);
    
    expect(response.body.attachments).toBeDefined();
    expect(Array.isArray(response.body.attachments)).toBe(true);
  });

  test('Get task activity', async () => {
    const taskId = 'test-task-123';
    const response = await request(app)
      .get(`/api/tasks/${taskId}/activity`)
      .expect(200);
    
    expect(response.body.activity).toBeDefined();
    expect(Array.isArray(response.body.activity)).toBe(true);
  });
});

// Run tests if called directly
if (require.main === module) {
  const http = require('http');
  const server = http.createServer(app);
  
  server.listen(0, () => {
    console.log('Test server running');
  });
}
