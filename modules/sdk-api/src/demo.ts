import { BitGoAPI } from './bitgoAPI';

interface TestResult {
  url: string;
  authVersion: number;
  status: number;
  responseTime: number;
  error?: string;
  data?: any;
}

/**
 * Test a single API endpoint with a specific auth version using the BitGoAPI SDK
 */
async function testEndpoint(token: string, authVersion: 2 | 3, url: string): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // Create a new BitGoAPI instance with the specified auth version
    const bitgo = new BitGoAPI({
      accessToken: token,
      authVersion,
      env: 'prod',
    });

    // Determine API version from URL and make the request
    const response = await bitgo.get(bitgo.microservicesUrl(url)).result();
    const responseTime = Date.now() - startTime;
    return {
      url,
      authVersion,
      status: 200,
      responseTime,
      data: response,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const status = error.status || error.statusCode || 0;
    const errorMessage = error.message || String(error);

    return {
      url,
      authVersion,
      status,
      responseTime,
      error: errorMessage,
    };
  }
}

/**
 * Format results as a table
 */
function formatResultsTable(results: TestResult[]): void {
  console.log('\n' + '='.repeat(100));
  console.log('BitGoAPI SDK Testing Results');
  console.log('='.repeat(100));

  // Header
  const header = [
    'Endpoint'.padEnd(45),
    'Auth Ver'.padEnd(10),
    'Status'.padEnd(10),
    'Time (ms)'.padEnd(12),
    'Error',
  ].join(' | ');

  console.log(header);
  console.log('-'.repeat(100));

  // Rows
  for (const result of results) {
    const statusDisplay = result.status || 'N/A';
    const row = [
      result.url.padEnd(45),
      `v${result.authVersion}`.padEnd(10),
      statusDisplay.toString().padEnd(10),
      result.responseTime.toString().padEnd(12),
      result.error || (result.status === 200 ? '✓ Success' : ''),
    ].join(' | ');

    console.log(row);
  }

  console.log('='.repeat(100) + '\n');
}

/**
 * Run all tests using the BitGoAPI SDK
 */
async function runTests(token: string): Promise<void> {
  const endpoints = ['/api/v2/wallets/count', '/api/prime/trading/v1/accounts'];

  const authVersions: (2 | 3)[] = [2, 3];

  console.log('\nStarting BitGoAPI SDK tests...\n');

  const results: TestResult[] = [];

  for (const url of endpoints) {
    for (const authVersion of authVersions) {
      console.log(`Testing ${url} with Auth v${authVersion}...`);
      const result = await testEndpoint(token, authVersion, url);
      results.push(result);
    }
  }

  formatResultsTable(results);
}

/**
 * Main function that reads the access token from command line arguments
 */
async function main(): Promise<void> {
  // Get access token from command line arguments
  const accessToken = process.argv[2];

  if (!accessToken || accessToken.trim().length === 0) {
    console.error('Error: Access token is required');
    console.error('Usage: ts-node demo.ts <access-token>');
    console.error('\nThis script will test the following endpoints with both Auth v2 and v3:');
    console.error('  - /api/v2/wallets/count');
    console.error('  - /api/prime/trading/v1/accounts');
    console.error('\nUsing BitGoAPI SDK with built-in HMAC signing and verification.');
    process.exit(1);
  }

  try {
    await runTests(accessToken.trim());
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
