import { CosmosUtils } from '@bitgo/abstract-cosmos';
import { Networks } from '@bitgo/statics';

const cosmosUtils = new CosmosUtils();
const HRP = Networks.main.initia.addressPrefix;
export const validDenoms = ['init', 'tinit', 'uinit', ...cosmosUtils.getTokenDenomsUsingCoinFamily('initia')];
export const accountAddressRegex = new RegExp(`^(${HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
export const validatorAddressRegex = new RegExp(`^(${HRP}valoper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
export const contractAddressRegex = new RegExp(`^(${HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$`);
/** @deprecated Use `Networks.main.initia.addressPrefix` from `@bitgo/statics` instead. */
export const ADDRESS_PREFIX = HRP;
export const GAS_AMOUNT = '30000';
export const GAS_LIMIT = 500000;
