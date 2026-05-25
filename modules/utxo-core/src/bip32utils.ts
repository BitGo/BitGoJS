import { bip32utils } from '@bitgo/secp256k1';

/**
 * @deprecated Use signMessage from @bitgo/secp256k1 instead
 * @see {bip32utils.signMessage}
 */
export const signMessage = bip32utils.signMessage;

/**
 * @deprecated Use verifyMessage from @bitgo/secp256k1 instead
 * @see {bip32utils.verifyMessage}
 */
export const verifyMessage = bip32utils.verifyMessage;
