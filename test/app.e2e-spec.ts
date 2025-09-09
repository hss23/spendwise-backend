import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('SpendWise API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200);
    });
  });

  describe('Authentication', () => {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      preferredCurrency: 'USD',
    };

    it('/auth/register (POST)', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.email).toBe(testUser.email);
          authToken = res.body.access_token;
        });
    });

    it('/auth/login (POST)', async () => {
      const loginDto = {
        email: testUser.email,
        password: testUser.password,
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.email).toBe(testUser.email);
        });
    });

    it('/auth/login with invalid credentials (POST)', async () => {
      const loginDto = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    it('should reject requests without auth token', async () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);
    });

    it('should accept requests with valid auth token', async () => {
      if (!authToken) {
        // Create auth token if not available
        const testUser = {
          email: `test-profile-${Date.now()}@example.com`,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          preferredCurrency: 'USD',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser);
        
        authToken = response.body.access_token;
      }

      return request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('API Endpoints', () => {
    beforeAll(async () => {
      if (!authToken) {
        const testUser = {
          email: `test-api-${Date.now()}@example.com`,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          preferredCurrency: 'USD',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser);
        
        authToken = response.body.access_token;
      }
    });

    it('/categories (GET)', async () => {
      return request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/expenses (GET)', async () => {
      return request(app.getHttpServer())
        .get('/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/budgets (GET)', async () => {
      return request(app.getHttpServer())
        .get('/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/goals (GET)', async () => {
      return request(app.getHttpServer())
        .get('/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/reports/spending (GET)', async () => {
      return request(app.getHttpServer())
        .get('/reports/spending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      return request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);
    });

    it('should return validation errors for invalid data', async () => {
      const invalidUser = {
        email: 'invalid-email', // Invalid email format
        password: '123', // Too short password
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });
  });
});
