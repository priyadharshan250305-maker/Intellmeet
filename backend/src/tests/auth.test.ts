import request from 'supertest';
import app from '../index';
import { getJwtSecret } from '../middleware/auth';
import { User } from '../models/User';

describe('Authentication API Endpoints', () => {
  it('should require JWT_SECRET in production', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalJwtSecret = process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    try {
      expect(() => getJwtSecret()).toThrow('JWT_SECRET must be configured in production.');
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('should register a new user successfully with hashed password and default workspace', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '203.0.113.10')
      .send({
        name: 'John Enterprise',
        email: 'john@intellmeet.com',
        password: 'SecurePassword123!',
        role: 'user',
        title: 'Senior Architect',
        department: 'Cloud Solutions',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('john@intellmeet.com');
    expect(res.body.user.password).toBeUndefined();

    // Verify user saved in DB and password hashed
    const userInDb = await User.findOne({ email: 'john@intellmeet.com' }).select('+password');
    expect(userInDb).not.toBeNull();
    expect(userInDb!.password).not.toBe('SecurePassword123!');
  });

  it('should not allow public registration to assign the admin role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Unprivileged Signup',
      email: 'unprivileged@intellmeet.com',
      password: 'SecurePassword123!',
      role: 'admin',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
  });

  it('should reject registration with duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'First User',
      email: 'duplicate@intellmeet.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Second User',
      email: 'duplicate@intellmeet.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should authenticate user and return token on valid login', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice Cooper',
      email: 'alice@intellmeet.com',
      password: 'secretPassword456',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@intellmeet.com',
      password: 'secretPassword456',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('Alice Cooper');
  });

  it('should reject login with wrong password', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Bob Marley',
      email: 'bob@intellmeet.com',
      password: 'correctPassword',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'bob@intellmeet.com',
      password: 'incorrectPassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should fetch authenticated user profile via /api/auth/me', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Claire Redfield',
      email: 'claire@intellmeet.com',
      password: 'password123',
    });

    const token = regRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user.email).toBe('claire@intellmeet.com');
  });
});
