export const UNAVAILABLE_TEXT = 'UNAVAILABLE';
export const TYPE_TAG = Array.from('TransactionData::').map((e) => e.charCodeAt(0));

// Need to keep in sync with
// https://github.com/MystenLabs/sui/blob/f32877f2e40d35a008710c232e49b57aab886462/crates/sui-types/src/messages.rs#L338
export const SUI_GAS_PRICE = 1;
export const SUI_ADDRESS_LENGTH = 20;

export enum SuiTransactionType {
  Pay = 'Pay',
  PaySui = 'PaySui',
  PayAllSui = 'PayAllSui',
}
