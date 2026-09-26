import './setup.js';
import request from 'supertest';
import app from '../index.js';
import { prisma } from '../config/database.js';
import { hashPassword } from '../middleware/auth.js';
import { AUTH_COOKIE_NAME } from '../utils/authCookie.js';
import { UserStatus } from '@prisma/client';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user and set HttpOnly cookie', async () => {
      const userData = {
        login: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        info: 'Test user info',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.login).toBe(userData.login);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.status).toBe(UserStatus.READER);
      expect(response.body.data.token).toBeUndefined();

      const cookieHeader = response.headers['set-cookie']?.join(';') || '';
      expect(cookieHeader).toContain(`${AUTH_COOKIE_NAME}=`);
      expect(cookieHeader.toLowerCase()).toContain('httponly');
    });

    it('should not register user with existing login', async () => {
      const userData = {
        login: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      };

      await prisma.user.create({
        data: {
          ...userData,
          password: await hashPassword(userData.password),
          status: UserStatus.READER,
        },
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const password = await hashPassword('password123');
      await prisma.user.create({
        data: {
          login: 'testuser',
          email: 'test@example.com',
          password,
          status: UserStatus.READER,
        },
      });
    });

    it('should login with correct credentials and set cookie', async () => {
      const loginData = {
        login: 'testuser',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.login).toBe(loginData.login);
      expect(response.body.data.token).toBeUndefined();

      const cookieHeader = response.headers['set-cookie']?.join(';') || '';
      expect(cookieHeader).toContain(`${AUTH_COOKIE_NAME}=`);
      expect(cookieHeader.toLowerCase()).toContain('httponly');
    });

    it('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ login: 'testuser', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should not login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ login: 'nonexistent', password: 'password123' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authCookie: string[];
    let userId: number;

    beforeEach(async () => {
      const password = await hashPassword('password123');
      const user = await prisma.user.create({
        data: {
          login: 'testuser',
          email: 'test@example.com',
          password,
          status: UserStatus.READER,
        },
      });
      userId = user.id;

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ login: 'testuser', password: 'password123' });

      authCookie = loginResponse.headers['set-cookie'];
    });

    it('should get user profile with auth cookie', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.login).toBe('testuser');
    });

    it('should get user profile with Bearer token fallback', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ login: 'testuser', password: 'password123' });

      const cookiePair = loginResponse.headers['set-cookie']?.[0] || '';
      const token = cookiePair.split(';')[0].split('=')[1];

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear auth cookie', async () => {
      const password = await hashPassword('password123');
      await prisma.user.create({
        data: {
          login: 'logoutuser',
          email: 'logout@example.com',
          password,
          status: UserStatus.READER,
        },
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ login: 'logoutuser', password: 'password123' });

      const authCookie = loginResponse.headers['set-cookie'];

      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', authCookie)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      const clearedCookie = logoutResponse.headers['set-cookie']?.join(';') || '';
      expect(clearedCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    });
  });
});
