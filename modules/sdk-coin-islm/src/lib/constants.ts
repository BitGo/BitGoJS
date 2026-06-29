import { Networks } from '@bitgo/statics';

const HRP = Networks.main.islm.addressPrefix;
export const validDenoms = ['aISLM'];
export const accountAddressRegex = new RegExp(`^(${HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
export const validatorAddressRegex = new RegExp(`^(${HRP}valoper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
/** @deprecated Use `Networks.main.islm.addressPrefix` from `@bitgo/statics` instead. */
export const ADDRESS_PREFIX = HRP;
export const GAS_LIMIT = 200000;
export const GAS_AMOUNT = '4000000000000000';
