import { CosmosUtils } from '@bitgo-beta/abstract-cosmos';

const cosmosUtils = new CosmosUtils();
export const validDenoms = ['ninj', 'uinj', 'minj', 'inj', ...cosmosUtils.getTokenDenomsUsingCoinFamily('injective')];
export const accountAddressRegex = /^(inj)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const validatorAddressRegex = /^(injvaloper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const contractAddressRegex = /^(inj)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$/;
