import { CosmosUtils } from '@bitgo/abstract-cosmos';

const cosmosUtils = new CosmosUtils();
export const validDenoms = ['ntia', 'utia', 'mtia', 'tia', ...cosmosUtils.getTokenDenomsUsingCoinFamily('tia')];
export const accountAddressRegex = /^(celestia)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const validatorAddressRegex = /^(celestiavaloper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$/;
export const contractAddressRegex = /^(celestia)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$/;
