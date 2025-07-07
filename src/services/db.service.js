import pg from 'pg';
import logger from '../core/logger';
import QueryHelper from '../helpers/query.helper';
import { simplifyType, convertTableNamesToArray } from '../utils/util.js';
import DbConnectionError from '../errors/dbConnection.error.js';
import QueryExecutionError from '../errors/queryExecution.error.js';
import TestConnectionResponse from '../dtos/TestConnectionResponse.dto.js';
import FetchSchemaResponse from '../dtos/FetchSchemaResponse.dto.js';
import FetchTableResponse from '../dtos/FetchTableResponse.dto.js';
import FetchMetadataResponse from '../dtos/FetchMetadataResponse.dto.js';

export default class DbService {
  constructor(dbUrl) {
    const config = {
      connectionString: dbUrl,
    };

    if (dbUrl && dbUrl.includes('sslmode=') && !dbUrl.includes('sslmode=disable')) {
      config.ssl = { rejectUnauthorized: false };
    }

    this.client = new pg.Client(config);
    this.queryHelper = new QueryHelper();
  }

  testDbConnection = async () => {
    let connectionSuccessful = false;
    try {
      await this.client.connect();
      connectionSuccessful = true;
      return new TestConnectionResponse();
    } catch (error) {
      logger.error(`Failed to connect to the database: ${error.message}`);
      throw new DbConnectionError(error.message);
    } finally {
      if (connectionSuccessful && this.client && typeof this.client.end === 'function') {
        await this.client.end();
      }
    }
  };

  fetchSchemas = async () => {
    try {
      await this.client.connect();
      const query = this.queryHelper.requestFetchAllSchemasQuery();
      const result = await this.client.query(query);
      const schemas = result.rows.map(row => row.schema_name);
      return new FetchSchemaResponse(schemas);
    } catch (error) {
      logger.error(`Failed to retrieve schemas: ${error.message}`);
      throw new QueryExecutionError(error.message);
    } finally {
      if (this.client && typeof this.client.end === 'function') {
        await this.client.end();
      }
    }
  };

  fetchTables = async schema => {
    try {
      await this.client.connect();
      const query = this.queryHelper.requestFetchAllTablesQuery();
      const result = await this.client.query(query, [schema]);
      const tableNames = result.rows.map(row => row.table_name);
      return new FetchTableResponse(tableNames);
    } catch (error) {
      logger.error(`Failed to retrieve tables: ${error.message}`);
      throw new QueryExecutionError(error.message);
    } finally {
      if (this.client && typeof this.client.end === 'function') {
        await this.client.end();
      }
    }
  };

  fetchColumnsMetadata = async (client, schema, tables) => {
    try {
      const query = this.queryHelper.requestFetchColumnsMetadataQuery();
      const result = await client.query(query, [schema, tables]);
      return result.rows.map(row => ({
        table_name: row.table_name,
        column_name: row.column_name,
        data_type: simplifyType(row.data_type),
      }));
    } catch (error) {
      logger.error(`Failed to retrieve columns metadata: ${error.message}`);
      throw new QueryExecutionError(error.message);
    }
  };

  fetchConstraintsMetadata = async (client, schema, tables, constraintType) => {
    try {
      const query = this.queryHelper.requestFetchConstraintsMetadataQuery();
      const result = await client.query(query, [constraintType, schema, tables]);
      const constraintMap = {};

      result.rows.forEach(row => {
        if (!constraintMap[row.table_name]) {
          constraintMap[row.table_name] = [];
        }
        constraintMap[row.table_name].push(row.column_name);
      });

      return constraintMap;
    } catch (error) {
      logger.error(`Failed to retrieve ${constraintType} constraint metadata: ${error.message}`);
      throw new QueryExecutionError(error.message);
    }
  };

  fetchFkMetadata = async (client, schema, tables) => {
    try {
      const query = this.queryHelper.requestFetchFkMetadataQuery();
      const result = await client.query(query, [schema, tables]);
      return result.rows.map(row => ({
        source_table: row.source_table,
        source_column: row.source_column,
        target_table: row.target_table,
        target_column: row.target_column,
      }));
    } catch (error) {
      logger.error(`Failed to retrieve foreign key metadata: ${error.message}`);
      throw new QueryExecutionError(error.message);
    }
  };

  fetchMetadata = async (schema, tables) => {
    const tablesArray = convertTableNamesToArray(tables);

    try {
      await this.client.connect();
      const columns = await this.fetchColumnsMetadata(this.client, schema, tablesArray);
      const pk = await this.fetchConstraintsMetadata(
        this.client,
        schema,
        tablesArray,
        'PRIMARY KEY'
      );
      const uniq = await this.fetchConstraintsMetadata(this.client, schema, tablesArray, 'UNIQUE');
      const fks = await this.fetchFkMetadata(this.client, schema, tablesArray);

      const fkMap = {};
      fks.forEach(fk => {
        if (!fkMap[fk.source_table]) {
          fkMap[fk.source_table] = [];
        }
        fkMap[fk.source_table].push(fk);
      });

      const metadata = [];

      tablesArray.forEach(table => {
        const foreignKeys = [];
        const tableFks = fkMap[table] || [];

        tableFks.forEach(fk => {
          const src = fk.source_column;
          const isUnique = (pk[table] || []).includes(src) || (uniq[table] || []).includes(src);
          const relType = isUnique ? 'OneToOne' : 'OneToMany';

          foreignKeys.push({
            source_column: src,
            target_table: fk.target_table,
            target_column: fk.target_column,
            relationship_type: relType,
          });
        });

        const isJoinTable = (pk[table] || []).length === 2 && tableFks.length === 2;
        const tableMetadata = {
          table_name: table,
          columns: columns.filter(col => col.table_name === table),
          primary_key: pk[table] || [],
          foreign_keys: foreignKeys,
        };

        if (isJoinTable) {
          tableMetadata.relationship_type = 'ManyToMany';
        }

        metadata.push(tableMetadata);
      });

      return new FetchMetadataResponse(metadata);
    } catch (error) {
      logger.error(`Failed to retrieve metadata: ${error.message}`);
      throw new QueryExecutionError(error.message);
    } finally {
      if (this.client && typeof this.client.end === 'function') {
        await this.client.end();
      }
    }
  };
}
