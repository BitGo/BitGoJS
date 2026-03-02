import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { IrysCommitmentTransactionBuilder } from './commitmentTransactionBuilder';
import { IRYS_MAINNET_CHAIN_ID, IRYS_TESTNET_CHAIN_ID } from './iface';

/** Irys API base URLs for anchor fetch (mainnet and testnet) */
const IRYS_MAINNET_API_URL = 'https://mainnet.irys.xyz/v1';
const IRYS_TESTNET_API_URL = 'https://testnet.irys.xyz/v1';

/** Coin names for mainnet vs testnet */
const IRYS_MAINNET_NAME = 'irys';
const IRYS_TESTNET_NAME = 'tirys';

/**
 * Minimal coin config shape used by the factory to derive API URL and chain ID.
 * Compatible with coins.get(coinName) from @bitgo/statics.
 */
export interface IrysCoinConfigLike {
  name: string;
  network: { chainId: number };
}

function getIrysApiUrlAndChainId(coinConfig: IrysCoinConfigLike): { irysApiUrl: string; chainId: bigint } {
  const name = coinConfig.name;
  const chainIdFromNetwork = coinConfig.network?.chainId;
  if (name === IRYS_MAINNET_NAME) {
    return {
      irysApiUrl: IRYS_MAINNET_API_URL,
      chainId: chainIdFromNetwork !== undefined ? BigInt(chainIdFromNetwork) : IRYS_MAINNET_CHAIN_ID,
    };
  }
  if (name === IRYS_TESTNET_NAME) {
    return {
      irysApiUrl: IRYS_TESTNET_API_URL,
      chainId: chainIdFromNetwork !== undefined ? BigInt(chainIdFromNetwork) : IRYS_TESTNET_CHAIN_ID,
    };
  }
  // Fallback: use chainId from network if present, otherwise default to testnet
  const chainId = chainIdFromNetwork !== undefined ? BigInt(chainIdFromNetwork) : IRYS_TESTNET_CHAIN_ID;
  const irysApiUrl = chainId === IRYS_MAINNET_CHAIN_ID ? IRYS_MAINNET_API_URL : IRYS_TESTNET_API_URL;
  return { irysApiUrl, chainId };
}

/**
 * Factory for Irys commitment transaction builders.
 * Accepts coin config (e.g. from coins.get('irys') or coins.get('tirys')) and provides
 * getCommitmentTransactionBuilder() for building STAKE/PLEDGE transactions with the
 * wallet-platform–friendly API (serializedTxHex, signableHex).
 */
export class TransactionBuilderFactory {
  private readonly _coinConfig: Readonly<CoinConfig>;
  private readonly _irysApiUrl: string;
  private readonly _chainId: bigint;

  constructor(coinConfig: Readonly<CoinConfig>) {
    this._coinConfig = coinConfig;
    const configLike = coinConfig as unknown as IrysCoinConfigLike;
    const { irysApiUrl, chainId } = getIrysApiUrlAndChainId(configLike);
    this._irysApiUrl = irysApiUrl;
    this._chainId = chainId;
  }

  /**
   * Returns a commitment transaction builder configured with the factory's
   * Irys API URL and chain ID. Same pattern as other coins (e.g. getTransferBuilder()).
   */
  getCommitmentTransactionBuilder(): IrysCommitmentTransactionBuilder {
    return new IrysCommitmentTransactionBuilder(this._irysApiUrl, this._chainId);
  }
}
