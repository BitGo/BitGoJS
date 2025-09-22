import { CosmosUtils } from '@bitgo-beta/abstract-cosmos';

const cosmosUtils = new CosmosUtils();
export const validDenoms = ['natom', 'uatom', 'matom', 'atom', ...cosmosUtils.getTokenDenomsUsingCoinFamily('atom')];
export const accountAddressRegex = /^(cosmos)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const validatorAddressRegex = /^(cosmosvaloper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const contractAddressRegex = /^(cosmos)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$/;
export const GAS_AMOUNT = '100000';
export const GAS_LIMIT = 200000;
