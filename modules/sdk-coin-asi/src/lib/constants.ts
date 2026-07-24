import { CosmosUtils } from '@bitgo/abstract-cosmos';
import { Networks } from '@bitgo/statics';

const cosmosUtils = new CosmosUtils();
const HRP = Networks.main.asi.addressPrefix;
export const validDenoms = ['fet', 'tfet', 'afet', 'atestfet', ...cosmosUtils.getTokenDenomsUsingCoinFamily('asi')];
export const accountAddressRegex = new RegExp(`^(${HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
export const validatorAddressRegex = new RegExp(`^(${HRP}valoper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
export const contractAddressRegex = new RegExp(`^(${HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$`);
/** @deprecated Use `Networks.main.asi.addressPrefix` from `@bitgo/statics` instead. */
export const ADDRESS_PREFIX = HRP;
export const GAS_AMOUNT = '100000000000000';
export const GAS_LIMIT = 100000;
