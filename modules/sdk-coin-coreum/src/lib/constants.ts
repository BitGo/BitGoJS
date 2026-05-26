import { CosmosUtils } from '@bitgo/abstract-cosmos';
import { Networks } from '@bitgo/statics';

const cosmosUtils = new CosmosUtils();
const MAINNET_HRP = Networks.main.coreum.addressPrefix;
const TESTNET_HRP = Networks.test.coreum.addressPrefix;
export const validDenoms = ['ucore', 'utestcore', ...cosmosUtils.getTokenDenomsUsingCoinFamily('coreum')];
export const mainnetAccountAddressRegex = new RegExp(
  `^(${MAINNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}|['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})$`
);
export const mainnetValidatorAddressRegex = new RegExp(
  `^(${MAINNET_HRP}valoper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`
);
export const testnetAccountAddressRegex = new RegExp(
  `^(${TESTNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}|['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})$`
);
export const testnetValidatorAddressRegex = new RegExp(
  `^(${TESTNET_HRP}valoper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`
);
/** @deprecated Use `Networks.main.coreum.addressPrefix` from `@bitgo/statics` instead. */
export const MAINNET_ADDRESS_PREFIX = MAINNET_HRP;
/** @deprecated Use `Networks.test.coreum.addressPrefix` from `@bitgo/statics` instead. */
export const TESTNET_ADDRESS_PREFIX = TESTNET_HRP;

export const GAS_LIMIT = 200000;
export const GAS_AMOUNT = '6250';
