# DB Schema Generator

A Node.js Express API for generating database schemas with PostgreSQL support.

## Features

- Health check endpoints
- Database connection testing
- Schema and table listing
- Metadata extraction with relationships
- Express.js with Babel for modern JavaScript
- ESLint and Prettier for code quality
- Jest for testing

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- PostgreSQL database (for testing connections)

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start development server
npm run dev
```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run prettier` - Format code
- `npm run format` - Format and fix linting issues

### API Endpoints

#### Health Check
- `GET /api/v1/health` - Health check
- `GET /api/v1/fail` - Test error handling

#### Database Operations
- `POST /api/v1/db/test-connection` - Test database connection
- `POST /api/v1/db/get-tables` - Get tables from schema
- `POST /api/v1/db/get-metadata` - Get table metadata

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
src/
├── api/v1/         # API routes
├── core/           # Core utilities (logger, exceptions)
├── services/       # Business logic
├── utils/          # Utility functions
└── index.js        # Application entry point
```

## Configuration

The application uses environment variables for configuration:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

See `.env.example` for all available options.
