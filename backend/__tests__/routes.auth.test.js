const request = require('supertest');
const express = require('express');

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRoutes = require('../routes/auth');

describe('auth routes white-box tests', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
    process.env.ADMIN_SECRET = 'admin_123';

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  test('POST /login returns 401 when user is not found', async () => {
    db.query.mockResolvedValueOnce([[]]);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid credentials' });
  });

  test('POST /login returns token for valid admin123 shortcut path', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1, username: 'admin', email: 'a@test.com', role: 'admin', password: 'hash' }]]);
    jwt.sign.mockReturnValue('signed_token');

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe('signed_token');
    expect(response.body.user.role).toBe('admin');
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  test('POST /login returns 401 when bcrypt compare fails', async () => {
    db.query.mockResolvedValueOnce([[{ id: 2, username: 'user', email: 'u@test.com', role: 'viewer', password: 'hash' }]]);
    bcrypt.compare.mockResolvedValue(false);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user', password: 'bad' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid credentials' });
  });

  test('POST /register returns 400 when user already exists', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1 }]]);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'admin', email: 'admin@test.com', password: 'pass' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'User already exists' });
  });

  test('POST /register returns 403 for invalid admin authorization code', async () => {
    db.query.mockResolvedValueOnce([[]]);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'newuser', email: 'new@test.com', password: 'pass', adminCode: 'wrong_code' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Invalid admin authorization code' });
  });

  test('POST /register creates viewer user and returns token', async () => {
    db.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 10 }]);
    bcrypt.hash.mockResolvedValue('hashed_pw');
    jwt.sign.mockReturnValue('reg_token');

    const payload = { username: 'viewer1', email: 'viewer@test.com', password: 'pass123' };

    const response = await request(app)
      .post('/api/auth/register')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.token).toBe('reg_token');
    expect(response.body.user).toEqual({
      id: 10,
      username: payload.username,
      email: payload.email,
      role: 'viewer'
    });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [payload.username, payload.email, 'hashed_pw', 'viewer']
    );
  });
});
