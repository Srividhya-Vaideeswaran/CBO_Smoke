# CBO Smoke Tests

Automated smoke tests for CBO Authentication and business workflows using Playwright.

## Overview

This project contains comprehensive Playwright-based smoke tests for validating CBO authentication flows, Hangfire job processing, debtor lookups, and RC login functionality across multiple environments.

## Prerequisites

- Node.js (v18 or higher)
- Access to CBO database (SQL Server)
- Valid CBO authentication credentials

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Srividhya-Vaideeswaran/CBO_Smoke.git
cd CBO_Smoke
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install
```

## Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# CBO Authentication URLs
CBO_AUTHURL_QA=http://your-qa-server/IdentityServer/connect/token
CBO_AUTHURL_QA2=http://your-qa2-server/IdentityServer/connect/token
CBO_AUTHURL_QA3=http://your-qa3-server/IdentityServer/connect/token
CBO_AUTHURL_QA4=http://your-qa4-server/IdentityServer/connect/token
CBO_AUTHURL_QA5=http://your-qa5-server/IdentityServer/connect/token

# OAuth Client Credentials
CBO_CLIENT_ID=your-client-id-here
CBO_CLIENT_SECRET=your-client-secret-here

# Database Configuration
DB_SERVER=your-database-server
DB_DATABASE=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password

# Application Base URL
BASE_URL=http://your-application-url

# Log Level (optional)
LOG_LEVEL=info
```

**Important**: Never commit the `.env` file to version control. Use `.env.example` as a template.

## Project Structure

```
CBO_Smoke/
├── src/                      # Source code
│   └── pages/               # Page Object Model classes
│       ├── CBO_Auth.ts      # Authentication utilities
│       ├── HangfireJob.ts   # Hangfire job interactions
│       └── RCLogin.ts       # RC login page object
├── tests/                    # Test specifications
│   ├── CBO-Auth.spec.ts     # Authentication tests
│   ├── Debtorlookup.spec.ts # Debtor lookup tests
│   └── RCLogin.spec.ts      # RC login tests
├── utils/                    # Utility functions
│   ├── database-utility.ts  # Database operations
│   ├── test-data-manager.ts # Test data manager utility
│   └── test-data.interface.ts # Test data type definitions
├── fixtures/                 # Test data files
│   └── CBO-Smoke-TestData.xlsx
├── test-logs/                # Test execution logs
├── playwright.config.ts      # Playwright configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## Running Tests

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test tests/CBO-Auth.spec.ts
```

### Run tests with browser visible (headed mode)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run tests in UI mode (interactive)
```bash
npx playwright test --ui
```

### Run tests on specific browsers
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View test report
```bash
npx playwright show-report
```

## Test Data Management

Test data is managed through CSV files in the `fixtures/` directory and loaded using `TestDataManager`:

```typescript
import { TestDataManager } from '../utils/test-data-manager';

// Load specific test data row
const testData = TestDataManager.loadDataRow(1);
```

## Database Utilities

The project includes a `DatabaseUtility` class for database operations:

```typescript
import { DatabaseUtility } from '../utils/database-utility';

// Connect to database
await DatabaseUtility.connect();

// Execute query
const results = await DatabaseUtility.executeQuery('SELECT * FROM table');

// Process template values
const processedValue = DatabaseUtility.processDate('$GetCurrentDate');

// Close connection
await DatabaseUtility.close();
```

## CI/CD Integration

Tests run automatically via GitHub Actions on push and pull requests. Configure the following secrets in your GitHub repository settings:

- `CBO_AUTHURL_QA`
- `CBO_CLIENT_ID`
- `CBO_CLIENT_SECRET`
- `DB_SERVER`
- `DB_DATABASE`
- `DB_USER`
- `DB_PASSWORD`
- `BASE_URL`

## Best Practices

1. **Environment Variables**: Always use environment variables for sensitive data
2. **Page Objects**: Keep test logic separate from page interactions
3. **Test Data**: Use TestDataManager for consistent test data management
4. **Assertions**: Include meaningful assertions in all tests
5. **Error Handling**: Implement proper try-catch blocks for database operations
6. **Cleanup**: Close database connections and clean up test data after tests

## Troubleshooting

### Database Connection Issues
- Verify database credentials in `.env`
- Ensure database server is accessible from your network
- Check firewall settings

### Authentication Failures
- Verify OAuth credentials are valid
- Check authentication URL is correct
- Ensure client ID and secret are not expired

### Test Timeouts
- Increase timeout in `playwright.config.ts` if needed
- Check network connectivity to test environments
- Verify application is running and accessible

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Add tests for new functionality
4. Run all tests locally
5. Submit a pull request

## Code Quality

### Run TypeScript type checking
```bash
npx tsc --noEmit
```

### Linting (if configured)
```bash
npm run lint
```

## Test Coverage

Current test suites validate:
- OAuth 2.0 authentication flow
- Access token retrieval and validation
- Hangfire job triggering and monitoring
- Debtor lookup functionality
- RC login workflows
- Database integration

## License

Proprietary - DHL Supply Chain

## Support

For issues or questions, please contact the QA Automation team or create an issue in the repository.
