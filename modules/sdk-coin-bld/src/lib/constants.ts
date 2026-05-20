import { CosmosUtils } from '@bitgo/abstract-cosmos';

const cosmosUtils = new CosmosUtils();
export const validDenoms = ['nbld', 'ubld', 'mbld', 'bld', ...cosmosUtils.getTokenDenomsUsingCoinFamily('bld')];
export const accountAddressRegex = /^(agoric)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const validatorAddressRegex = /^(agoricvaloper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const contractAddressRegex = /^(agoric)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$/;
