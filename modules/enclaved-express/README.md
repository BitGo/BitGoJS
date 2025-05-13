# Enclaved Express

Enclaved Express is a secure signer implementation for cryptocurrency operations. It's designed to run in a secure enclave environment with flexible security options.

## Overview

This module provides a lightweight, dedicated signing server with these features:

- Focused on signing operations only - no BitGo API dependencies
- Optional TLS security for secure connections
- Client certificate validation when operating in mTLS mode
- Simple configuration and deployment

## Supported Operations

Currently, the following operations are supported:

- `/api/v2/:coin/sign` - Sign transactions
- `/api/v2/:coin/tssshare/:sharetype` - Generate TSS shares
- `/api/v2/ofc/signPayload` - Sign OFC payloads

## Configuration

Configuration is done via environment variables:

### Network Settings

- `PORT` - Port to listen on (default: 3080)
- `BIND` - Address to bind to (default: localhost)
- `TIMEOUT` - Request timeout in milliseconds (default: 305000)

### TLS Settings

- `TLS_ENABLED` - Enable/disable TLS (default: false)
- `TLS_CA_PATH` - Path to CA certificate file (optional, for client verification)
- `TLS_CERT_PATH` - Path to server certificate file (required when TLS is enabled)
- `TLS_KEY_PATH` - Path to server key file (required when TLS is enabled)
- `TLS_REQUEST_CERT` - Whether to request client certificates for mTLS (default: false)
- `TLS_REJECT_UNAUTHORIZED` - Whether to reject unauthorized connections (default: false)
- `TLS_ALLOWED_CLIENT_CERT_FINGERPRINTS` - Comma-separated list of allowed client certificate fingerprints (optional)

### Other Settings

- `LOGFILE` - Path to log file (optional)
- `DEBUG` - Debug namespaces to enable (e.g., 'enclaved:*')

## Running Enclaved Express

You can run enclaved-express just like any other Node.js service. From the BitGoJS project root:

```bash
cd modules/enclaved-express
npm install
npm run build
npm start
```

You can set any configuration environment variables as needed before running `npm start`.

### Example (HTTP only):

```bash
HTTP_ENABLED=true npm start
```

### Example (with TLS):

```bash
TLS_ENABLED=true \
TLS_CERT_PATH=/path/to/server.crt \
TLS_KEY_PATH=/path/to/server.key \
TLS_CA_PATH=/path/to/ca.crt \
npm start
```

---

If you wish to run enclaved-express in a container, you can use your own Docker or Podman setup, similar to how you would containerize any Node.js application. There is no longer a dedicated Dockerfile or docker-compose configuration in this module.

## Certificate Generation for mTLS

To generate certificates for mTLS authentication:

```bash
# Generate CA key and certificate
openssl genrsa -out ca.key 4096
openssl req -new -x509 -key ca.key -out ca.crt -days 365 -subj "/CN=EnclaveCA"

# Generate server key and CSR
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr -subj "/CN=enclaved-express"

# Sign server certificate with CA
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 365

# Generate client key and CSR
openssl genrsa -out client.key 2048
openssl req -new -key client.key -out client.csr -subj "/CN=client-service"

# Sign client certificate with CA
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt -days 365

# Calculate client certificate fingerprint for allowlist
openssl x509 -in client.crt -noout -fingerprint -sha256 | sed 's/://g' | awk -F= '{print $2}'
```

## Extending the Module

To add more endpoints to the enclaved-express module:

1. Update the `setupCustomRoutes` function in `src/routes.ts` to include new routes
2. Import and use handlers from the Express module or create new ones

Example of adding a new route:

```typescript
function setupCustomRoutes(app: express.Application) {
  // Import handler from express module
  import { handleNewOperation } from '../../express/src/clientRoutes';
  
  // Add new route
  app.post('/api/v2/custom/endpoint', promiseWrapper(handleNewOperation));
  
  debug('Custom routes configured');
}
```

## Security Considerations

- Always keep private keys secure
- When using mTLS, use allowlisting for client certificates to ensure only approved services can connect
- Run in a production environment with proper firewall rules
- Consider using network policies to restrict which services can connect to the service
- Regularly rotate certificates and keys

## License

MIT 