# Remote Signer LND Node Setup for Self Custodial Lightning Wallets

This guide helps you set up a remote signer LND node in Docker to use BitGo self-custodial lightning wallets.

---

## Prerequisites

- Docker installed on your system.

## Docker Environment Variables
- `BITCOIN_NETWORK` environment variable set to one of: `mainnet`, `testnet`.
- Optional: Base64-encoded TLS certificate `TLS_CERT` and TLS key `TLS_KEY`, in case if you want to use your own TLS certificate. If they are not provided, LND will create a self-signed certificate and print the certificate in log.

---

## LND configuration through example.conf

- You can configure your signer LND node's domain/IP by editing `tlsextradomain` and `tlsextraip` in `example.conf` file.
- Do not change other configurations in the `example.conf` file.

## Example Docker Setup

The `tlsextradomain=signernode` entry in the `example.conf` file is used to set the domain name for the signer LND node in the Docker network `lnd-network`. This domain name is used to generate the TLS certificate for the signer LND node.

`docker run --name signernode --network lnd-network -p 8080:8080 --init -e BITCOIN_NETWORK=testnet -e TLS_CERT=LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNQRENDQWVLZ0F3SUJBZ0lSQU02TEFoaGxOMGo4ZlhxV2dLTWdENmN3Q2dZSUtvWkl6ajBFQXdJd09ERWYKTUIwR0ExVUVDaE1XYkc1a0lHRjFkRzluWlc1bGNtRjBaV1FnWTJWeWRERVZNQk1HQTFVRUF4TU1aV1UxTVdZeApOREV4TUdVMk1CNFhEVEkwTURneE9ERXlNVE14TWxvWERUSTFNVEF4TXpFeU1UTXhNbG93T0RFZk1CMEdBMVVFCkNoTVdiRzVrSUdGMWRHOW5aVzVsY21GMFpXUWdZMlZ5ZERFVk1CTUdBMVVFQXhNTVpXVTFNV1l4TkRFeE1HVTIKTUZrd0V3WUhLb1pJemowQ0FRWUlLb1pJemowREFRY0RRZ0FFclA0d2NXWFEwUWFFazhsVFNVTXBCa1d3ditFbQpxNTNyOWVSeVJUOTRkZGdVR0tTMFlRK0liZzFseVBRU3hiN0dXYloyWG9GUFdiK1VOM0lFMVlMQ2thT0J6RENCCnlUQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0V3WURWUjBsQkF3d0NnWUlLd1lCQlFVSEF3RXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVb3JmUkNVQytmaUNjZlE4cEhEUTFWaE1uMXBBd2NnWURWUjBSQkdzdwphWUlNWldVMU1XWXhOREV4TUdVMmdnbHNiMk5oYkdodmMzU0NDbk5wWjI1bGNtNXZaR1dDQ1d4dlkyRnNhRzl6CmRJSUVkVzVwZUlJS2RXNXBlSEJoWTJ0bGRJSUhZblZtWTI5dWJvY0Vmd0FBQVljUUFBQUFBQUFBQUFBQUFBQUEKQUFBQUFZY0VyQlFBQWpBS0JnZ3Foa2pPUFFRREFnTklBREJGQWlFQXJuQ0xRTlgzeDZ1NjhIM2xCOG9wOUFKaApBd2RrUjhXOXNSaUZnZDJKM2tZQ0lHczFOVGM0T0toRzByNzVHUWpXb2x0SkJyOUtjWWVyR1V3aklCaCtvZ1h0Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K -e TLS_KEY=LS0tLS1CRUdJTiBFQyBQUklWQVRFIEtFWS0tLS0tCk1IY0NBUUVFSUFFamQ0Qng3M3VPYllGSW42VlZpZTJmeG9lbXVYZFBob2FkS2JscHpnaTBvQW9HQ0NxR1NNNDkKQXdFSG9VUURRZ0FFclA0d2NXWFEwUWFFazhsVFNVTXBCa1d3ditFbXE1M3I5ZVJ5UlQ5NGRkZ1VHS1MwWVErSQpiZzFseVBRU3hiN0dXYloyWG9GUFdiK1VOM0lFMVlMQ2tRPT0KLS0tLS1FTkQgRUMgUFJJVkFURSBLRVktLS0tLQo= signer`


