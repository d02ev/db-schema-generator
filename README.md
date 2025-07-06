# DB Schema Generator

A backend API that fetches tables, columns and schema information from the given connection string which is then used by the client to create an ERD diagram.

P.S.: The whole application is stateless and only requires a read permission on the database.

## Features

- Health check endpoints
- Database connection testing
- Schema and table listing
- Metadata extraction with relationships

## Getting Started

### Prerequisites

- Node.js 22.x or higher
- npm
- PostgreSQL database (for testing connections)

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp src/config/.env.sample src/config/dev/.env.development # make sure to change values

# Start development server
npm run dev
```

### API Endpoints

#### Health Check

- `GET /api/v1/health` - Health check
- `GET /api/v1/fail` - Test error handling

#### Database Operations

- `POST /api/v1/db/test-connection` - Test database connection
- `GET /api/v1/db/get-schemas?dbUrl=...` - Get schemas from connection string
- `GET /api/v1/db/get-tables?dbUrl=...&tableSchema=...` - Get tables from schema
- `GET /api/v1/db/get-diagram-data?dbUrl=...&tableSchema=...&tables=...` - Get table diagram data

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Configuration

The application uses environment variables for configuration:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

See `.env.example` for all available options.
