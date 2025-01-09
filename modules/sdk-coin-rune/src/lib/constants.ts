export const mainnetValidDenoms = ['rune'];
export const mainnetAccountAddressRegex = /^(thor)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const mainnetValidatorAddressRegex = /^(thor)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const MAINNET_ADDRESS_PREFIX = 'thor';

export const testnetValidDenoms = ['rune'];
export const testnetAccountAddressRegex = /^(sthor)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const testnetValidatorAddressRegex = /^(sthor)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const TESTNET_ADDRESS_PREFIX = 'sthor';

export const GAS_LIMIT = 200000;
export const GAS_AMOUNT = '0'; // Gas amount should be zero for RUNE transactions, as fees (0.02 RUNE) is cut from sender balance directly in the transaction
export const RUNE_FEES = '2000000'; // https://dev.thorchain.org/concepts/fees.html#thorchain-native-rune
export const ROOT_PATH = 'm/0';
