import { erc20, erc20Token, terc20 } from '../account';
import { BaseCoin, CoinFeature, UnderlyingAsset } from '../base';
import { AccountNetwork, EthereumNetwork, Networks } from '../networks';
import { ofcerc20, tofcerc20 } from '../ofc';

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

function createOfcCoin(
  config: Erc20WithOfcConfig,
  onchainFeatures: CoinFeature[],
  defaultAddressCoin: string,
  isTestnet: boolean
) {
  const ofcFn = isTestnet ? tofcerc20 : ofcerc20;

  return ofcFn(
    config.ofcId,
    config.ofcName,
    config.fullName,
    config.decimalPlaces,
    config.asset,
    undefined, // kind
    undefined,
    undefined, // prefix
    undefined, // suffix
    undefined, // network
    true, // isToken
    config.ofcAddressCoin ?? defaultAddressCoin
  );
}

// --- Ethereum ERC20 generators (erc20 / terc20) ---

export function generateErc20Coin(config: Erc20CoinConfig): Readonly<BaseCoin>[] {
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

export function generateTestErc20Coin(config: Erc20CoinConfig): Readonly<BaseCoin>[] {
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
    config.network ?? Networks.test.hoodi //default testnet eth network for new tokens
  );

  if (config.skipOfc) return [onChain];

  return [onChain, createOfcCoin(config, onChain.features, 'teth', true)];
}

// --- ERC20 Token generators (erc20Token for non-Ethereum EVM chains) ---

export function generateErc20Token(config: Erc20TokenConfig): Readonly<BaseCoin>[] {
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

export function generateTestErc20Token(config: Erc20TokenConfig): Readonly<BaseCoin>[] {
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
