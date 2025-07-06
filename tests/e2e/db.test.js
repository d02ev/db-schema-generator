import request from 'supertest';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import app from '../../src/app.js';
import HttpStatusCodes from '../../src/enums/httpStatusCodes.enum';

describe('Database Metadata Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Get Schemas', () => {
    test('GET /api/v1/db/get-schemas should return 200', async () => {
      const response = await request(app).get(`/api/v1/db/get-schemas?dbUrl=${encodeURI(process.env.DB_URL)}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.statusCode).toBe(HttpStatusCodes.OK);
      expect(response.body.message).toBe('Schemas fetched successfully');
      expect(response.body.schemas).toEqual(["public"]);
    });
  });

  describe('Get Tables', () => {
    test('GET /api/v1/db/get-tables should return 200', async () => {
      const response = await request(app).get(`/api/v1/db/get-tables?dbUrl=${encodeURI(process.env.DB_URL)}&tableSchema=public`)

      expect(response.statusCode).toBe(200);
      expect(response.body.statusCode).toBe(HttpStatusCodes.OK);
      expect(response.body.message).toBe('Tables fetched successfully');
      expect(response.body.tables).toEqual(["users", "user_profiles", "user_documents"]);
    });
  });

  describe('Get Diagram Data', () => {
    test('GET /api/v1/db/get-diagram-data shoudl return 200', async () => {
      const response = await request(app).get('/api/v1/db/get-diagram-data?dbUrl=postgresql://postgres:d02ev@localhost:5432/gen_schema_db&tableSchema=public&tableNames=users,user_profiles,user_documents')

      expect(response.statusCode).toBe(200);
      expect(response.body.statusCode).toBe(HttpStatusCodes.OK);
      expect(response.body.message).toBe('Metadata fetched successfully');
      expect(response.body.metadata).toEqual([
        {
          "table_name": "users",
          "columns": [
            {
              "table_name": "users",
              "column_name": "id",
              "data_type": "int"
            },
            {
              "table_name": "users",
              "column_name": "name",
              "data_type": "varchar"
            },
            {
              "table_name": "users",
              "column_name": "age",
              "data_type": "int"
            },
            {
              "table_name": "users",
              "column_name": "email",
              "data_type": "varchar"
            }
          ],
          "primary_key": [
            "id"
          ],
          "foreign_keys": []
        },
        {
          "table_name": "user_profiles",
          "columns": [
            {
              "table_name": "user_profiles",
              "column_name": "user_id",
              "data_type": "int"
            },
            {
              "table_name": "user_profiles",
              "column_name": "bio",
              "data_type": "text"
            },
            {
              "table_name": "user_profiles",
              "column_name": "profile_picture",
              "data_type": "text"
            },
            {
              "table_name": "user_profiles",
              "column_name": "birth_date",
              "data_type": "date"
            }
          ],
          "primary_key": [
            "user_id"
          ],
          "foreign_keys": [
            {
              "source_column": "user_id",
              "target_table": "users",
              "target_column": "id",
              "relationship_type": "OneToOne"
            }
          ]
        },
        {
          "table_name": "user_documents",
          "columns": [
            {
              "table_name": "user_documents",
              "column_name": "id",
              "data_type": "int"
            },
            {
              "table_name": "user_documents",
              "column_name": "user_profile_id",
              "data_type": "int"
            },
            {
              "table_name": "user_documents",
              "column_name": "document_type",
              "data_type": "varchar"
            },
            {
              "table_name": "user_documents",
              "column_name": "document_url",
              "data_type": "text"
            },
            {
              "table_name": "user_documents",
              "column_name": "uploaded_at",
              "data_type": "timestamp"
            }
          ],
          "primary_key": [
            "id"
          ],
          "foreign_keys": [
            {
              "source_column": "user_profile_id",
              "target_table": "user_profiles",
              "target_column": "user_id",
              "relationship_type": "OneToMany"
            }
          ]
        }
      ]);
    });
  });

  describe('Test Connection', () => {
    test('POST /api/v1/db/test-connection should return 200', async () => {
      const response = await request(app).post('/api/v1/db/test-connection').send({ dbUrl: process.env.DB_URL });

      expect(response.statusCode).toBe(200);
      expect(response.body.statusCode).toBe(HttpStatusCodes.OK);
      expect(response.body.message).toBe('Database connection successful')
    });
  });
});