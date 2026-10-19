/**
 * Structural surface of the GrpcCoreClient namespace of @mysten/sui that the
 * Sui SDK's node interactions rely on. Shapes are verified against
 * @mysten/sui@2.20.0 (src/grpc/core.ts); the exact version pin in package.json
 * keeps them stable across upgrades, so no field is silently defaulted —
 * helpers below hard-throw when expected fields are missing.
 */
export interface SuiGrpcCoreClient {
  getBalance(options: { owner: string; coinType?: string }): Promise<{
    balance: {
      balance: string;
      coinType: string;
      coinBalance: string;
      addressBalance: string;
    };
  }>;
  listCoins(options: { owner: string; coinType?: string; cursor?: string | null }): Promise<{
    objects: Array<{
      objectId: string;
      version: string;
      digest: string;
      balance: string;
      type?: string;
    }>;
    hasNextPage: boolean;
    cursor: string | null;
  }>;
  simulateTransaction(options: {
    transaction: Uint8Array;
    checksEnabled: boolean;
    include: { effects: boolean };
  }): Promise<{
    $kind: 'Transaction' | 'FailedTransaction';
    Transaction?: {
      digest?: string;
      status?: { success?: boolean };
      effects?: {
        status?: { success?: boolean };
        gasUsed?: {
          computationCost?: string;
          storageCost?: string;
          storageRebate?: string;
          nonRefundableStorageFee?: string;
        };
      };
    };
    FailedTransaction?: { digest?: string };
  }>;
  getCurrentSystemState(): Promise<{ systemState?: { epoch?: string | number | bigint | null } }>;
  getChainIdentifier(): Promise<{ chainIdentifier: string }>;
  executeTransaction(options: { transaction: Uint8Array; signatures: string[] }): Promise<{
    $kind: 'Transaction' | 'FailedTransaction';
    Transaction?: { digest?: string };
    FailedTransaction?: { digest?: string };
  }>;
}

/**
 * The real @mysten/sui SuiGrpcClient nests its methods under a `core`
 * (GrpcCoreClient) namespace. Mirror that nesting so SDK call sites go through
 * the same surface production consumers of @mysten/sui use.
 */
export interface SuiGrpcClient {
  core: SuiGrpcCoreClient;
}

/**
 * Per-call deadline applied to every gRPC call made through this transport.
 * The legacy JSON-RPC client enforced a request timeout; an unbounded gRPC
 * deadline would let a hung fullnode hang balance/sweep/broadcast flows
 * indefinitely. 10s bounds those flows while leaving headroom over the legacy
 * 3s for dry-run simulations on loaded nodes.
 */
const SUI_GRPC_CALL_TIMEOUT_MS = 10_000;

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

// protobuf-ts service clients hold their transport under a private `_transport`
// field that the structural SuiGrpcClient type cannot express; the shape is
// fixed at the pinned @mysten/sui version.
function transportOf(client: SuiGrpcClient): unknown {
  const transportHolder = client as unknown as { transactionExecutionService: { _transport: unknown } };
  return transportHolder.transactionExecutionService._transport;
}
const clientCache = new Map<string, { client: SuiGrpcClient }>();

/**
 * Creates a Sui gRPC client. Node: native transport; browser: gRPC-web
 * (SuiGrpcClient's default fetch transport, given the URL as base). One
 * client (and connection) is cached per url+network and reused across calls.
 */
export async function createSuiGrpcClient(url: string, network: 'mainnet' | 'testnet'): Promise<SuiGrpcClient> {
  const key = `${network}|${url}`;
  const cached = clientCache.get(key);
  if (cached) {
    return cached.client;
  }

  // TS cannot resolve this ESM-only exports subpath under CJS resolution.
  const grpcModule = require('@mysten/sui/grpc') as {
    SuiGrpcClient: new (options: {
      network: 'mainnet' | 'testnet';
      transport?: unknown;
      baseUrl?: string;
    }) => SuiGrpcClient;
  };

  let client: SuiGrpcClient;
  if (isBrowserEnvironment()) {
    const { SuiGrpcClient } = grpcModule;
    client = new SuiGrpcClient({ network, baseUrl: url });
  } else {
    const [{ GrpcTransport }, { ChannelCredentials }] = await Promise.all([
      import('@protobuf-ts/grpc-transport'),
      import('@grpc/grpc-js'),
    ]);
    const isTls = !url.startsWith('http://');
    const host = url.replace(/^https?:\/\//i, '');
    const transport = new GrpcTransport({
      host,
      channelCredentials: isTls ? ChannelCredentials.createSsl() : ChannelCredentials.createInsecure(),
      timeout: SUI_GRPC_CALL_TIMEOUT_MS,
    });
    const { SuiGrpcClient: NativeSuiGrpcClient } = grpcModule;
    client = new NativeSuiGrpcClient({ network, transport });
  }
  clientCache.set(key, { client });
  return client;
}

/**
 * Closes a client's underlying connection and evicts it from the cache, so
 * the next createSuiGrpcClient for the same endpoint builds a fresh client.
 * Idempotent; also accepts clients that were never cached.
 */
export function closeSuiGrpcClient(client: SuiGrpcClient): void {
  for (const [key, cached] of clientCache.entries()) {
    if (cached.client === client) {
      clientCache.delete(key);
    }
  }
  const transport = transportOf(client) as { close?: () => void };
  try {
    transport.close?.();
  } catch {
    // transport already closed
  }
}

/** Test-only: tear down every cached client so suites do not share sockets. */
export function __resetSuiGrpcClientCacheForTest(): void {
  for (const { client } of clientCache.values()) {
    closeSuiGrpcClient(client);
  }
  clientCache.clear();
}
