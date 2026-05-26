import { CosmosUtils } from '@bitgo/abstract-cosmos';
import { Networks } from '@bitgo/statics';

const cosmosUtils = new CosmosUtils();
const MAINNET_HRP = Networks.main.cronos.addressPrefix;
const TESTNET_HRP = Networks.test.cronos.addressPrefix;
export const validDenoms = [
  'cro',
  'tcro',
  'basecro',
  'basetcro',
  ...cosmosUtils.getTokenDenomsUsingCoinFamily('cronos'),
];

export const mainnetAccountAddressRegex = new RegExp(`^(${MAINNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
export const mainnetValidatorAddressRegex = new RegExp(
  `^(${MAINNET_HRP}cncl)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`
);
export const mainnetContractAddressRegex = new RegExp(`^(${MAINNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$`);
/** @deprecated Use `Networks.main.cronos.addressPrefix` from `@bitgo/statics` instead. */
export const MAINNET_ADDRESS_PREFIX = MAINNET_HRP;

export const testnetAccountAddressRegex = new RegExp(`^(${TESTNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
export const testnetValidatorAddressRegex = new RegExp(
  `^(${TESTNET_HRP}cncl)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`
);
export const testnetContractAddressRegex = new RegExp(`^(${TESTNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$`);
/** @deprecated Use `Networks.test.cronos.addressPrefix` from `@bitgo/statics` instead. */
export const TESTNET_ADDRESS_PREFIX = TESTNET_HRP;

export const GAS_AMOUNT = '30000';
export const GAS_LIMIT = 500000;
