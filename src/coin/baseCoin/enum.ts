/**
 * Internal metadata. Defines the type of transaction.
 */
export enum TransactionType {
  Send,
  WalletInitialization,
  // Initialize a singlesig address. i.e. in Tezos, addresses have to be revealed
  AddressInitialization,
}

/**
 * Generic list of encoding formats. Can be used as arguments for methods inputs.
 */
export enum AddressFormat {
  hex = 'hex',
  base58 = 'base58',
}
