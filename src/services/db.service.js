import pg from 'pg';
import logger from '../core/logger'
import QueryHelper from '../helpers/query.helper';
import { simplifyType } from '../utils/util.js';
import DbConnectionError from '../errors/dbConnection.error.js';
import QueryExecutionError from '../errors/queryExecution.error.js';
import TestConnectionResponse from '../dtos/TestConnectionResponse.dto.js';

export default class DbService {
  constructor(dbUrl) {
    this.client = new pg.Client({ connectionString: dbUrl });
    this.queryHelper = new QueryHelper();
  }

  testDbConnection = async () => {
    let connectionSuccessful = false;
    try {
      await this.client.connect().catch(error => {
        logger.error(`Failed to connect to the database: ${error.message}`);
        throw new DbConnectionError(error.message);
      });
      connectionSuccessful = true;

      const query = this.queryHelper.requestFetchAllSchemasQuery();
      const result = await this.client.query(query).catch(error => {
        logger.error(`Failed to retrieve schemas: ${error.message}`);
        throw new QueryExecutionError(error.message);
      });

      return new TestConnectionResponse(result.rows.map(row => row.schema_name));
    } finally {
      // Only call end() if the connection was successful and client has an end method
      if (connectionSuccessful && this.client && typeof this.client.end === 'function') {
        this.client.end();
      }
    }
  }
};

// const { Client } = pg;
// const queryHelper = new QueryHelper();

// const fetchSchemas = async client => {
//   try {
//     const query = queryHelper.requestFetchAllSchemasQuery();
//     const result = await client.query(query);
//     const schemaNames = result.rows.map(row => row.schema_name);
//     return schemaNames;
//   } catch (error) {
//     logger.error(`Failed to retrieve schemas: ${error.message}`);
//     return [];
//   }
// };

// export const checkDbConnection = async dbUrl => {
//   const client = new Client({ connectionString: dbUrl });

//   try {
//     await client.connect();
//     logger.info('Database connection successful.');
//     const schemas = await fetchSchemas(client);
//     return [true, schemas];
//   } catch (error) {
//     logger.error(`Database connection failed: ${error.message}`);
//     return [false, []];
//   } finally {
//     await client.end();
//     logger.info('Database connection closed.');
//   }
// };

// export const fetchTables = async (dbUrl, schema) => {
//   const client = new Client({ connectionString: dbUrl });

//   try {
//     await client.connect();
//     const query = `
//       SELECT table_name
//       FROM information_schema.tables
//       WHERE table_schema = $1;
//     `;
//     const result = await client.query(query, [schema]);
//     const tableNames = result.rows.map(row => row.table_name);
//     logger.info(`Retrieved tables: ${tableNames}`);
//     return tableNames;
//   } catch (error) {
//     logger.error(`Failed to retrieve tables: ${error.message}`);
//     return [];
//   } finally {
//     await client.end();
//   }
// };

// const fetchColumnsMetadata = async (client, schema, tables) => {
//   try {
//     const query = `
//       SELECT table_name, column_name, data_type
//       FROM information_schema.columns
//       WHERE table_schema = $1
//       AND table_name = ANY($2::text[])
//     `;
//     const result = await client.query(query, [schema, tables]);
//     logger.info('Retrieved columns metadata');
//     return result.rows.map(row => ({
//       table_name: row.table_name,
//       column_name: row.column_name,
//       data_type: row.data_type,
//     }));
//   } catch (error) {
//     logger.error(`Failed to retrieve columns metadata: ${error.message}`);
//     return [];
//   }
// };

// const fetchConstraintsMetadata = async (
//   client,
//   schema,
//   tables,
//   constraintType
// ) => {
//   try {
//     const query = `
//       SELECT tc.table_name, kcu.column_name
//       FROM information_schema.table_constraints AS tc
//       JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
//       WHERE tc.constraint_type = $1
//       AND tc.table_schema = $2
//       AND tc.table_name = ANY($3::text[])
//     `;
//     const result = await client.query(query, [constraintType, schema, tables]);
//     const constraintMap = {};

//     result.rows.forEach(row => {
//       if (!constraintMap[row.table_name]) {
//         constraintMap[row.table_name] = [];
//       }
//       constraintMap[row.table_name].push(row.column_name);
//     });

//     logger.info(`Retrieved ${constraintType} constraint metadata`);
//     return constraintMap;
//   } catch (error) {
//     logger.error(
//       `Failed to retrieve ${constraintType} constraint metadata: ${error.message}`
//     );
//     return {};
//   }
// };

// const fetchFkMetadata = async (client, schema, tables) => {
//   try {
//     const query = `
//       SELECT tc.table_name AS source_table, kcu.column_name AS source_column,
//              ccu.table_name AS target_table, ccu.column_name AS target_column
//       FROM information_schema.table_constraints AS tc
//       JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
//       JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
//       WHERE tc.constraint_type = 'FOREIGN KEY'
//       AND tc.table_schema = $1
//       AND tc.table_name = ANY($2::text[])
//     `;
//     const result = await client.query(query, [schema, tables]);
//     logger.info('Retrieved foreign key metadata');
//     return result.rows.map(row => ({
//       source_table: row.source_table,
//       source_column: row.source_column,
//       target_table: row.target_table,
//       target_column: row.target_column,
//     }));
//   } catch (error) {
//     logger.error(`Failed to retrieve foreign key metadata: ${error.message}`);
//     return [];
//   }
// };

// export const fetchMetadata = async (dbUrl, schema, tables) => {
//   const client = new Client({ connectionString: dbUrl });

//   try {
//     await client.connect();
//     const columns = await fetchColumnsMetadata(client, schema, tables);
//     const pk = await fetchConstraintsMetadata(
//       client,
//       schema,
//       tables,
//       'PRIMARY KEY'
//     );
//     const uniq = await fetchConstraintsMetadata(
//       client,
//       schema,
//       tables,
//       'UNIQUE'
//     );
//     const fks = await fetchFkMetadata(client, schema, tables);

//     const fkMap = {};
//     fks.forEach(fk => {
//       if (!fkMap[fk.source_table]) {
//         fkMap[fk.source_table] = [];
//       }
//       fkMap[fk.source_table].push(fk);
//     });

//     const metadata = [];

//     tables.forEach(table => {
//       const foreignKeys = [];
//       const tableFks = fkMap[table] || [];

//       tableFks.forEach(fk => {
//         const src = fk.source_column;
//         const isUnique =
//           (pk[table] || []).includes(src) || (uniq[table] || []).includes(src);
//         const relType = isUnique ? 'OneToOne' : 'OneToMany';

//         foreignKeys.push({
//           source_column: src,
//           target_table: fk.target_table,
//           target_column: fk.target_column,
//           relationship_type: relType,
//         });
//       });

//       const isJoinTable =
//         (pk[table] || []).length === 2 && tableFks.length === 2;
//       const tableMetadata = {
//         table_name: table,
//         columns: columns
//           .filter(col => col.table_name === table)
//           .map(col => ({
//             column_name: col.column_name,
//             data_type: simplifyType(col.data_type),
//           })),
//         primary_key: pk[table] || [],
//         foreign_keys: foreignKeys,
//       };

//       if (isJoinTable) {
//         tableMetadata.relationship_type = 'ManyToMany';
//       }

//       metadata.push(tableMetadata);
//     });

//     logger.info('Retrieved metadata');
//     return metadata;
//   } catch (error) {
//     logger.error(`Failed to retrieve metadata: ${error.message}`);
//     return [];
//   } finally {
//     await client.end();
//   }
// };
