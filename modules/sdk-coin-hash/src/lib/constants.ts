import { CosmosUtils } from '@bitgo/abstract-cosmos';
import { Networks } from '@bitgo/statics';

const cosmosUtils = new CosmosUtils();
const MAINNET_HRP = Networks.main.hash.addressPrefix;
const TESTNET_HRP = Networks.test.hash.addressPrefix;
export const validDenoms = ['nhash', 'uhash', 'mhash', 'hash', ...cosmosUtils.getTokenDenomsUsingCoinFamily('hash')];
export const mainnetAccountAddressRegex = new RegExp(`^(${MAINNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38,58})$`);
export const mainnetValidatorAddressRegex = new RegExp(
  `^(${MAINNET_HRP}valoper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`
);
export const mainnetContractAddressRegex = new RegExp(`^(${MAINNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$`);
/** @deprecated Use `Networks.main.hash.addressPrefix` from `@bitgo/statics` instead. */
export const MAINNET_ADDRESS_PREFIX = MAINNET_HRP;

export const testnetAccountAddressRegex = new RegExp(`^(${TESTNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38,58})$`);
export const testnetValidatorAddressRegex = new RegExp(
  `^(${TESTNET_HRP}valoper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`
);
export const testnetContractAddressRegex = new RegExp(`^(${TESTNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$`);
/** @deprecated Use `Networks.test.hash.addressPrefix` from `@bitgo/statics` instead. */
export const TESTNET_ADDRESS_PREFIX = TESTNET_HRP;
