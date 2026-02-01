import { CosmosUtils } from '@bitgo/abstract-cosmos';

const cosmosUtils = new CosmosUtils();
export const validDenoms = ['nhash', 'uhash', 'mhash', 'hash', ...cosmosUtils.getTokenDenomsUsingCoinFamily('hash')];
// HASH has seen bech32 addresses that do not conform to a fixed length, so we do not enforce a strict data-part length here.
export const mainnetAccountAddressRegex = /^(pb)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$/;
export const mainnetValidatorAddressRegex = /^(pbvaloper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$/;
export const mainnetContractAddressRegex = /^(pb)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$/;
export const MAINNET_ADDRESS_PREFIX = 'pb';

export const testnetAccountAddressRegex = /^(tp)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$/;
export const testnetValidatorAddressRegex = /^(tpvaloper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$/;
export const testnetContractAddressRegex = /^(tp)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$/;
export const TESTNET_ADDRESS_PREFIX = 'tp';
