import { CosmosUtils } from '@bitgo/abstract-cosmos';
import { Networks } from '@bitgo/statics';

const cosmosUtils = new CosmosUtils();
const MAINNET_HRP = Networks.main.rune.addressPrefix;
const TESTNET_HRP = Networks.test.rune.addressPrefix;
export const validDenoms = ['rune', ...cosmosUtils.getTokenDenomsUsingCoinFamily('thor')];
export const mainnetAccountAddressRegex = new RegExp(`^(${MAINNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
export const mainnetValidatorAddressRegex = new RegExp(`^(${MAINNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
/** @deprecated Use `Networks.main.rune.addressPrefix` from `@bitgo/statics` instead. */
export const MAINNET_ADDRESS_PREFIX = MAINNET_HRP;

export const testnetAccountAddressRegex = new RegExp(`^(${TESTNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
export const testnetValidatorAddressRegex = new RegExp(`^(${TESTNET_HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
/** @deprecated Use `Networks.test.rune.addressPrefix` from `@bitgo/statics` instead. */
export const TESTNET_ADDRESS_PREFIX = TESTNET_HRP;

export const GAS_LIMIT = 200000;
export const GAS_AMOUNT = '0'; // Gas amount should be zero for RUNE transactions, as fees (0.02 RUNE) is cut from sender balance directly in the transaction
export const RUNE_FEES = '2000000'; // https://dev.thorchain.org/concepts/fees.html#thorchain-native-rune
export const ROOT_PATH = 'm/0';
