const request = require('supertest');
const app = require('../server');

describe('Auth Service', () => {
  test('Health check endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
    expect(response.body.service).toBe('auth-service');
  });

  test('Register new user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpass123'
    };

    const response = await request(app)
      .post('/api/register')
      .send(userData)
      .expect(201);

    expect(response.body.message).toBe('User created successfully');
    expect(response.body.user.username).toBe(userData.username);
    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.token).toBeDefined();
  });

  test('Login user', async () => {
    const loginData = {
      username: 'testuser',
      password: 'testpass123'
    };

    const response = await request(app)
      .post('/api/login')
      .send(loginData)
      .expect(200);

    expect(response.body.message).toBe('Login successful');
    expect(response.body.token).toBeDefined();
  });

  test('Get user profile', async () => {
    // First login to get token
    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        username: 'testuser',
        password: 'testpass123'
      });

    const token = loginResponse.body.token;

    // Then get profile
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.user.username).toBe('testuser');
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
