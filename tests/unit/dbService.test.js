import pg from 'pg';
import DbService from '../../src/services/db.service.js';
import DbConnectionError from '../../src/errors/dbConnection.error.js';
import QueryExecutionError from '../../src/errors/queryExecution.error.js';
import TestConnectionResponse from '../../src/dtos/TestConnectionResponse.dto.js';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

jest.mock('pg');

const mockConnect = jest.fn();
const mockQuery = jest.fn();
const mockEnd = jest.fn();

pg.Client.mockImplementation(() => ({
  connect: mockConnect,
  query: mockQuery,
  end: mockEnd,
}));

describe('DbService', () => {
  const dbUrl = 'postgresql://user:password@localhost:5432/db';
  let dbService;

  beforeEach(() => {
    dbService = new DbService(dbUrl);
    jest.clearAllMocks();
  });

  it('should return schemas on successful connection', async () => {
    mockConnect.mockResolvedValue();
    mockQuery.mockResolvedValue({ rows: [{ schema_name: 'public' }, { schema_name: 'custom' }] });
    mockEnd.mockResolvedValue();

    const result = await dbService.testDbConnection();
    expect(result).toBeInstanceOf(TestConnectionResponse);
    expect(result.schemas).toEqual(['public', 'custom']);
    expect(mockConnect).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalled();
    expect(mockEnd).toHaveBeenCalled();
  });

  it('should throw DbConnectionError if connect fails', async () => {
    mockConnect.mockRejectedValue(new Error('Connection failed'));
    await expect(dbService.testDbConnection()).rejects.toThrow(DbConnectionError);
    expect(mockConnect).toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockEnd).not.toHaveBeenCalled();
  });

  it('should throw QueryExecutionError if query fails', async () => {
    mockConnect.mockResolvedValue();
    mockQuery.mockRejectedValue(new Error('Query failed'));
    mockEnd.mockResolvedValue();
    await expect(dbService.testDbConnection()).rejects.toThrow(QueryExecutionError);
    expect(mockConnect).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalled();
    expect(mockEnd).not.toHaveBeenCalled(); // end is not called if query fails before
  });
});
