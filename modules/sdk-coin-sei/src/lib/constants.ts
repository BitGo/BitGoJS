import { CosmosUtils } from '@bitgo-beta/abstract-cosmos';

const cosmosUtils = new CosmosUtils();
export const validDenoms = ['nsei', 'usei', 'msei', 'sei', ...cosmosUtils.getTokenDenomsUsingCoinFamily('sei')];
export const accountAddressRegex = /^(sei)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const validatorAddressRegex = /^(seivaloper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const contractAddressRegex = /^(sei)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$/;
