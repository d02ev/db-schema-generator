import request from 'supertest';
import { describe, test, expect } from '@jest/globals';
import app from '../../src/app.js';
import HttpStatusCodes from '../../src/enums/httpStatusCodes.enum.js';

describe('Health Check Endpoints', () => {
  test('GET /api/v1/health should return 200', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      statusCode: HttpStatusCodes.OK,
      message: 'API is running',
    });
  });

  test('GET /api/v1/fail should return 500', async () => {
    const response = await request(app).get('/api/v1/fail');

    expect(response.statusCode).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(response.text).toContain('Something went wrong');
  });
});
