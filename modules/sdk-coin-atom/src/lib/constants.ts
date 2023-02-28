export const DEFAULT_SEED_SIZE_BYTES = 16;
export enum AtomTransactionType {
  Pay = 'Pay',
}
export const sendMsgType = '/cosmos.bank.v1beta1.MsgSend';
export const validDenoms = ['natom', 'uatom', 'matom', 'atom'];
export const accountAddressRegex = /^(cosmos)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l']+)$/;
