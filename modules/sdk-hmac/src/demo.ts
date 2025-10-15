import { calculateRequestHeaders, verifyResponse } from './hmac';

interface TestResult {
  url: string;
  authVersion: number;
  status: number;
  isVerified: boolean;
  responseTime: number;
  error?: string;
}

/**
 * Test a single API endpoint with a specific auth version
 */
async function testEndpoint(token: string, authVersion: 2 | 3, url: string): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const { hmac, timestamp, tokenHash } = calculateRequestHeaders({
      url,
      text: '',
      token,
      authVersion,
      method: 'get',
    });

    const fullUrl = `https://app.bitgo.com${url}`;
    const response = await fetch(fullUrl, {
      headers: {
        hmac: hmac,
        'Auth-Timestamp': timestamp.toString(),
        Authorization: `Bearer ${tokenHash}`,
        'BitGo-Auth-Version': `${authVersion}.0`,
      },
    });

    const authResponseHeaders = {
      hmac: response.headers.get('hmac') ?? '',
      timestamp: Number(response.headers.get('timestamp') ?? 0),
    };

    const data = await response.json();
    const text = JSON.stringify(data);
    const statusCode = response.status;

    const verifiedResponse = verifyResponse({
      url,
      hmac: authResponseHeaders.hmac,
      timestamp: authResponseHeaders.timestamp,
      token,
      authVersion,
      statusCode,
      text,
      method: 'get',
    });

    const responseTime = Date.now() - startTime;

    return {
      url,
      authVersion,
      status: statusCode,
      isVerified: verifiedResponse.isValid,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      url,
      authVersion,
      status: 0,
      isVerified: false,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Format results as a table
 */
function formatResultsTable(results: TestResult[]): void {
  console.log('\n' + '='.repeat(100));
  console.log('API Testing Results');
  console.log('='.repeat(100));

  // Header
  const header = [
    'Endpoint'.padEnd(45),
    'Auth Ver'.padEnd(10),
    'Status'.padEnd(10),
    'Verified'.padEnd(10),
    'Time (ms)'.padEnd(12),
    'Error',
  ].join(' | ');

  console.log(header);
  console.log('-'.repeat(100));

  // Rows
  for (const result of results) {
    const row = [
      result.url.padEnd(45),
      `v${result.authVersion}`.padEnd(10),
      (result.status || 'N/A').toString().padEnd(10),
      (result.isVerified ? '✓' : '✗').padEnd(10),
      result.responseTime.toString().padEnd(12),
      result.error || '',
    ].join(' | ');

    console.log(row);
  }

  console.log('='.repeat(100) + '\n');
}

/**
 * Run all tests
 */
async function runTests(token: string): Promise<void> {
  const endpoints = ['/api/v2/wallets/count', '/api/prime/trading/v1/accounts'];

  const authVersions: (2 | 3)[] = [2, 3];

  console.log('\nStarting API tests...\n');

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
