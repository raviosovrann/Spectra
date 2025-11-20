# Backend Testing Guide

Comprehensive guide for testing the Spectra Crypto Dashboard backend.

## Quick Start

```bash
# Run all tests once
npm test -- --run

# Run in watch mode
npm test

# Run with coverage
npm test -- --coverage --run

# Run with UI
npm test -- --ui
```

## Test Structure

```
backend/tests/
├── setup.ts                      # Test configuration and environment setup
├── unit/                         # Unit tests (isolated component testing)
│   ├── auth.test.ts             # Authentication service (password, JWT, login/register)
│   ├── encryption.test.ts       # API key encryption/decryption
│   └── middleware.test.ts       # Authentication middleware
└── api/                         # Integration tests (API endpoint testing)
    └── auth.integration.test.ts # Auth API endpoints (register, login, logout, /me)
```

## Test Statistics

- **Total Tests**: 59 passing
- **Test Files**: 4
- **Test Framework**: Vitest
- **HTTP Testing**: Supertest
- **Mocking**: Vitest built-in mocks

## Running Tests

### All Tests

```bash
# Run once and exit
npm test -- --run

# Watch mode (auto-rerun on changes)
npm test

# With coverage report
npm test -- --coverage --run

# With verbose output
npm test -- --run --reporter=verbose
```

### Specific Test Files

```bash
# Run single file
npm test -- tests/unit/auth.test.ts --run

# Run all unit tests
npm test -- tests/unit --run

# Run all integration tests
npm test -- tests/api --run
```

### Filter by Pattern

```bash
# Run tests matching "login"
npm test -- -t "login" --run

# Run tests matching "JWT"
npm test -- -t "JWT" --run

# Run specific test suite
npm test -- -t "Password Hashing" --run
```

## Test Coverage

### Current Coverage

- **Authentication Service**: Password hashing, JWT generation, registration, login, token verification
- **Encryption Utilities**: API key encryption/decryption with AES-256-GCM
- **Authentication Middleware**: Token validation from cookies and headers
- **Auth API Endpoints**: Complete registration and login flows

### Generate Coverage Report

```bash
npm test -- --coverage --run
```

View the report in terminal or open `coverage/index.html` in your browser.

## Test Environment

### Configuration

Tests use isolated environment with:
- **Mocked database**: No real PostgreSQL connections
- **Mocked logger**: No actual log files created
- **Test secrets**: Auto-configured in `setup.ts`
  - `JWT_SECRET`: Test JWT signing key
  - `ENCRYPTION_KEY`: 256-bit test encryption key

### Environment Variables

The test setup (`tests/setup.ts`) automatically configures required environment variables. No `.env` file needed for tests.

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do something', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = someFunction(input)
    
    // Assert
    expect(result).toBe('expected')
  })
})
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'

describe('API Endpoint', () => {
  let app: Express

  beforeAll(() => {
    app = express()
    // Configure app with routes
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle POST request', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ data: 'test' })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ success: true })
  })
})
```

### Mocking Database Queries

```typescript
// Mock the database pool
vi.mock('../../src/database/config.js', () => ({
  default: {
    query: vi.fn(),
  },
}))

import pool from '../../src/database/config.js'

// Helper to create mock query results
const mockQueryResult = <T>(rows: T[]) => 
  Promise.resolve({ 
    rows, 
    rowCount: rows.length, 
    command: '', 
    oid: 0, 
    fields: [] 
  })

// Use in tests
vi.mocked(pool.query).mockImplementationOnce(() => mockQueryResult([mockUser]))
```

## Debugging Tests

### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Debug Specific Test

```bash
# Debug with Node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs --run tests/unit/auth.test.ts
```

### Common Debug Commands

```bash
# Run tests sequentially (easier to debug)
npm test -- --run --no-threads

# Bail on first failure
npm test -- --run --bail=1

# Run only changed tests
npm test -- --run --changed
```

## Advanced Options

### Vitest CLI Options

```bash
# Run tests in parallel (default)
npm test -- --run

# Run sequentially
npm test -- --run --no-threads

# Show test execution time
npm test -- --run --reporter=verbose

# Update snapshots
npm test -- --run -u

# Run only failed tests from last run
npm test -- --run --changed
```

### Filtering and Exclusion

```bash
# Exclude integration tests
npm test -- --exclude="**/api/**" --run

# Run only files matching pattern
npm test -- auth --run

# Skip specific tests (use .skip in code)
it.skip('test to skip', () => { ... })
```

## Best Practices

### Test Organization
- **Keep tests isolated**: Each test should be independent
- **Use descriptive names**: Clearly describe what is being tested
- **Follow AAA pattern**: Arrange, Act, Assert
- **One assertion per test**: Focus on single behavior

### Mocking
- **Mock external dependencies**: Database, APIs, file system
- **Clear mocks between tests**: Use `beforeEach(() => vi.clearAllMocks())`
- **Mock at module level**: Use `vi.mock()` before imports
- **Verify mock calls**: Use `expect(mockFn).toHaveBeenCalledWith(...)`

### Performance
- **Keep unit tests fast**: < 100ms per test
- **Use beforeAll for expensive setup**: Database connections, app initialization
- **Avoid real I/O**: Mock file system, network calls
- **Run tests in parallel**: Default Vitest behavior

### Coverage
- **Aim for 80%+ coverage**: Focus on business logic
- **Test edge cases**: Error conditions, boundary values
- **Test happy and sad paths**: Success and failure scenarios
- **Don't test implementation details**: Test behavior, not internals

## Troubleshooting

### Tests Fail with "Cannot find module"

Ensure you're in the backend directory:
```bash
cd backend
npm test
```

### Tests Timeout

Increase timeout for slow tests:
```typescript
it('slow test', async () => {
  // Test code
}, 10000) // 10 second timeout
```

### Mock Not Working

1. Ensure mock is defined before imports
2. Clear mocks between tests
3. Check mock implementation returns correct type

```typescript
beforeEach(() => {
  vi.clearAllMocks()
})
```

### Database Connection Errors

Tests should never connect to real database. Ensure:
- Database module is mocked with `vi.mock()`
- Mock returns proper structure
- No real connection strings in test environment

### Type Errors in Tests

Use proper types for mocks:
```typescript
const mockQueryResult = <T>(rows: T[]) => 
  Promise.resolve({ rows, rowCount: rows.length, command: '', oid: 0, fields: [] })
```

## Continuous Integration

Tests run automatically in CI/CD. Ensure all tests pass locally:

```bash
# Run as CI would
npm test -- --run --coverage

# Check for type errors
npm run lint
```

## Test Categories

### Unit Tests (tests/unit/)
- Test individual functions and classes
- Mock all external dependencies
- Fast execution (< 100ms)
- High coverage of business logic
- Examples: password hashing, JWT generation, encryption

### Integration Tests (tests/api/)
- Test multiple components together
- Test API endpoints end-to-end
- Mock external services only
- Verify request/response flows
- Examples: registration flow, login flow, authentication

## Quick Reference Card

```bash
# Essential Commands
npm test -- --run                    # Run all tests once
npm test                             # Watch mode
npm test -- --coverage --run         # With coverage
npm test -- tests/unit/auth.test.ts --run  # Specific file
npm test -- -t "login" --run         # Filter by name
npm test -- --ui                     # Interactive UI

# Debugging
npm test -- --run --reporter=verbose # Verbose output
npm test -- --run --bail=1           # Stop on first failure
npm test -- --run --no-threads       # Sequential execution

# Coverage
npm test -- --coverage --run         # Generate report
open coverage/index.html             # View in browser
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [Vitest UI](https://vitest.dev/guide/ui.html)

## Support

For issues or questions:
1. Check this README
2. Review test examples in `tests/` directory
3. Check Vitest documentation
4. Review error messages carefully - they're usually helpful!
