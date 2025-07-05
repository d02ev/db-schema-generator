export default class QueryHelper {
  requestFetchAllSchemasQuery = () => {
    return `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
      AND schema_name NOT LIKE 'pg_toast%'
      AND schema_name NOT LIKE 'pg_temp%'
      ORDER BY schema_name;
    `;
  }

  requestFetchAllTablesQuery = () => {
    return `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1;
    `;
  };

  requestFetchColumnsQuery = () => {
    return `
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = $1
      AND table_name = ANY($2::text[]);
      `;
  };

  requestFetchConstraintsMetadataQuery = () => {
    return `
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = $1
      AND tc.table_schema = $2
      AND tc.table_name = ANY($3::text[]);
    `;
  }

  requestFetchFkMetadataQuery = () => {
    return `
      SELECT tc.table_name AS source_table, kcu.column_name AS source_column,
             ccu.table_name AS target_table, ccu.column_name AS target_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = $1
      AND tc.table_name = ANY($2::text[]);
    `;
  };
};