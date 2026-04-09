export const DEFAULT_SIGNER_NUMBER = 3;

export enum HederaTransactionTypes {
  Transfer = 'cryptoTransfer',
  CreateAccount = 'cryptoCreateAccount',
  TokenAssociateToAccount = 'tokenAssociate',
  TokenDissociateFromAccount = 'tokenAssociate',
}
