import { CosmosUtils } from '@bitgo/abstract-cosmos';
import { Networks } from '@bitgo/statics';

const cosmosUtils = new CosmosUtils();
const HRP = Networks.main.bld.addressPrefix;
export const validDenoms = ['nbld', 'ubld', 'mbld', 'bld', ...cosmosUtils.getTokenDenomsUsingCoinFamily('bld')];
export const accountAddressRegex = new RegExp(`^(${HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
export const validatorAddressRegex = new RegExp(`^(${HRP}valoper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
export const contractAddressRegex = new RegExp(`^(${HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$`);
