import { erc20, erc20Token, monErc20, terc20, xdcErc20 } from '../account';
import { CoinFeature, UnderlyingAsset } from '../base';
import { AccountNetwork, EthereumNetwork } from '../networks';
import { DISALLOWED_FEATURES, REQUIRED_FEATURES } from '../ofcCoin';
import { ofcerc20, tofcerc20 } from './ofcErc20Coins';

// --- Shared config interfaces ---

interface BaseErc20Config {
  id: string;
  name: string;
  fullName: string;
  decimalPlaces: number;
  contractAddress: string;
  asset: UnderlyingAsset;
  features?: CoinFeature[];
  prefix?: string;
  suffix?: string;
}

interface Erc20WithOfcConfig extends BaseErc20Config {
  ofcId: string;
  ofcName: string;
  ofcAddressCoin?: string;
  skipOfc?: false;
}

interface Erc20WithoutOfcConfig extends BaseErc20Config {
  skipOfc: true;
}

type Erc20Config = Erc20WithOfcConfig | Erc20WithoutOfcConfig;

type Erc20CoinConfig = Erc20Config & { network?: EthereumNetwork };
type Erc20TokenConfig = Erc20Config & { network: AccountNetwork };

/**
 * Derive OFC features from the onchain coin's features by filtering out
 * disallowed features and ensuring required features are present.
 */
function deriveOfcFeatures(onchainFeatures: CoinFeature[]): CoinFeature[] {
  const filtered = onchainFeatures.filter((f) => !DISALLOWED_FEATURES.includes(f));
  return [...filtered, ...REQUIRED_FEATURES.filter((f) => !filtered.includes(f))];
}

function createOfcCoin(
  config: Erc20WithOfcConfig,
  onchainFeatures: CoinFeature[],
  defaultAddressCoin: string,
  isTestnet: boolean
) {
  const ofcFeatures = deriveOfcFeatures(onchainFeatures);
  const ofcFn = isTestnet ? tofcerc20 : ofcerc20;

  return ofcFn(
    config.ofcId,
    config.ofcName,
    config.fullName,
    config.decimalPlaces,
    config.asset,
    undefined, // kind
    ofcFeatures,
    undefined, // prefix
    undefined, // suffix
    undefined, // network
    true, // isToken
    config.ofcAddressCoin ?? defaultAddressCoin
  );
}

// --- Ethereum ERC20 generators (erc20 / terc20) ---

export function generateErc20Coin(config: Erc20CoinConfig) {
  const onChain = erc20(
    config.id,
    config.name,
    config.fullName,
    config.decimalPlaces,
    config.contractAddress,
    config.asset,
    config.features,
    config.prefix,
    config.suffix,
    config.network
  );

  if (config.skipOfc) return [onChain];

  return [onChain, createOfcCoin(config, onChain.features, 'eth', false)];
}

export function generateTestErc20Coin(config: Erc20CoinConfig) {
  const onChain = terc20(
    config.id,
    config.name,
    config.fullName,
    config.decimalPlaces,
    config.contractAddress,
    config.asset,
    config.features,
    config.prefix,
    config.suffix,
    config.network
  );

  if (config.skipOfc) return [onChain];

  return [onChain, createOfcCoin(config, onChain.features, 'teth', true)];
}

// --- ERC20 Token generators (erc20Token for non-Ethereum EVM chains) ---

export function generateErc20Token(config: Erc20TokenConfig) {
  const onChain = erc20Token(
    config.id,
    config.name,
    config.fullName,
    config.decimalPlaces,
    config.contractAddress,
    config.asset,
    config.network,
    config.features,
    config.prefix,
    config.suffix
  );

  if (config.skipOfc) return [onChain];

  return [onChain, createOfcCoin(config, onChain.features, 'eth', false)];
}

export function generateTestErc20Token(config: Erc20TokenConfig) {
  const onChain = erc20Token(
    config.id,
    config.name,
    config.fullName,
    config.decimalPlaces,
    config.contractAddress,
    config.asset,
    config.network,
    config.features,
    config.prefix,
    config.suffix
  );

  if (config.skipOfc) return [onChain];

  return [onChain, createOfcCoin(config, onChain.features, 'teth', true)];
}

// --- Chain-specific ERC20 generators (xdc, mon, etc.) ---

export function generateXdcErc20(config: Erc20Config) {
  const onChain = xdcErc20(
    config.id,
    config.name,
    config.fullName,
    config.decimalPlaces,
    config.contractAddress,
    config.asset,
    config.features,
    config.prefix,
    config.suffix
  );

  if (config.skipOfc) return [onChain];

  return [onChain, createOfcCoin(config, onChain.features, 'xdc', false)];
}

export function generateMonErc20(config: Erc20Config) {
  const onChain = monErc20(
    config.id,
    config.name,
    config.fullName,
    config.decimalPlaces,
    config.contractAddress,
    config.asset,
    config.features,
    config.prefix,
    config.suffix
  );

  if (config.skipOfc) return [onChain];

  return [onChain, createOfcCoin(config, onChain.features, 'mon', false)];
}
