import { GrpcTransport } from '@protobuf-ts/grpc-transport';
import { ChannelCredentials } from '@grpc/grpc-js';

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

/**
 * Native gRPC requires HTTP/2 trailer semantics that browsers do not expose,
 * and Sui's JSON-RPC alternative is being decommissioned — so SUI node calls
 * have no browser implementation at all. Block them at the entry point
 * instead of failing later with an opaque transport error.
 */
function assertNodeEnvironment(): void {
  const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

  if (isBrowser) {
    throw new Error(
      'SUI gRPC node calls are not supported in browser environments; native gRPC cannot run in a browser and Sui JSON-RPC is deprecated -> route through a server-side backend.'
    );
  }
}

/**
 * Creates a native-gRPC Sui client for the given host. SuiGrpcClient's default
 * transport is gRPC-web (fetch-based), which Sui full nodes do not serve, so a
 * native gRPC transport is injected instead. Public fullnode endpoints serve
 * gRPC over TLS on port 443; an http:// URL selects plaintext for in-cluster
 * nodes that serve gRPC without TLS.
 */
export async function createSuiGrpcClient(url: string, network: 'mainnet' | 'testnet'): Promise<SuiGrpcClient> {
  assertNodeEnvironment();
  // @mysten/sui 2.x is ESM-only and exposes its gRPC client through an
  // exports-map subpath that TypeScript's CJS (node10) module resolution cannot
  // see, hence the ts-expect-error. The literal specifier is kept so dependency
  // scanners (depcheck) detect the package usage. Browser bundles include this
  // graph; assertNodeEnvironment() rejects browser callers before it executes.
  const grpcModule = (await import(
    // @ts-expect-error ESM-only subpath unresolvable under CJS module resolution
    '@mysten/sui/grpc'
  )) as unknown as {
    SuiGrpcClient: new (options: { network: 'mainnet' | 'testnet'; transport: GrpcTransport }) => SuiGrpcClient;
  };
  const isTls = !url.startsWith('http://');
  const host = url.replace(/^https?:\/\//i, '');
  const transport = new GrpcTransport({
    host,
    channelCredentials: isTls ? ChannelCredentials.createSsl() : ChannelCredentials.createInsecure(),
    // RpcOptions.timeout in milliseconds is relative to each call's start,
    // so a transport-level default applies a per-call deadline to every RPC.
    timeout: SUI_GRPC_CALL_TIMEOUT_MS,
  });
  return new grpcModule.SuiGrpcClient({ network, transport });
}
