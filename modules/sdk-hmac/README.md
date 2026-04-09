# @bitgo/sdk-sdk-hmac

Isolated module for performing hash-based message authentication (HMAC) on API requests.

## Installation

```shell
npm i @bitgo/sdk-hmac
```

```javascript
import { calculateRequestHeaders, verifyResponse } from '@bitgo/sdk-hmac';

const bearerToken = 'v2x123...';
const url = '/api/v2/wallets';

const { hmac, timestamp, tokenHash } = calculateRequestHeaders({
  url,
  token: bearerToken,
  timestamp: new Date().valueOf().toString(),
  // if making a POST/PUT request with a body, pass as text
  // text: JSON.stringify(request.body)
  // optional, can pass 2 or 3 for auth-version
  // authVersion: 3
});

const response = await fetch(url, {
  method: 'GET',
  headers: {
    authorization: `Bearer ${tokenHash}`,
    hmac,
    'bitgo-auth-version': '2.0',
    'auth-timestamp': timestamp,
  },
});

const verifiedResponse = verifyResponse({
  url,
  hmac: response.headers.get('hmac'),
  statusCode: response.status,
  text: response.text,
  timestamp: response.headers.get('timestamp'),
  token: bearerToken,
  method: 'get',
});

if (!verifiedResponse.isValid) {
  throw new Error('dont trust this response, possible MITM attack');
}
```
