import { decrypt } from '@bitgo/sdk-api';
import { bitcoin, isValidPrv, isValidXprv } from '@bitgo/sdk-core';
import { coins, KeyCurve } from '@bitgo/statics';

export type AuditKeyParams = {
  coinName: string;
  encryptedPrv: string;
  walletPassphrase: string;
} & (
  | {
      multiSigType: 'tss';
      publicKey: string;
    }
  | {
      multiSigType?: 'onchain';
      publicKey?: string;
    }
);

export type AuditKeyResponse = {
  // determines if the key is valid
  isValid: boolean;
  // Optional message providing additional information about the audit result
  message?: string;
};

/**
 * Audit a key by decrypting the encrypted private key and verifying it matches the provided public key
 *
 * @param coinName - The coin type
 * @param multiSigType - Optional type of multi-signature wallet
 * @param encryptedPrv - The encrypted private key to audit
 * @param publicKey - The public key to verify against
 * @param walletPassphrase - The passphrase to decrypt the encrypted private key
 * @returns AuditKeyResponse - An object indicating whether the key is valid and an optional message
 */
export async function auditKey({
  coinName,
  publicKey,
  encryptedPrv,
  walletPassphrase,
  multiSigType,
}: AuditKeyParams): Promise<{ isValid: boolean; message?: string }> {
  const coin = coins.get(coinName);
  if (!coin) {
    return { isValid: false, message: `Unsupported coin ${coinName}` };
  }
  try {
    // 1. Decrypt the encrypted private key
    const secret = decrypt(walletPassphrase, encryptedPrv);

    // 2. Determine curve type based on coin and multiSigType
    const curveType = coin.primaryKeyCurve; // default

    // 3. Validate the key

    switch (curveType) {
      case KeyCurve.Secp256k1:
        if (multiSigType === 'tss') {
          if (publicKey.length !== 130 && publicKey.length !== 0) {
            return { isValid: false, message: 'Incorrect TSS common keychain' };
          }

          // DKLs key chains do not have a fixed length but we know for sure they are greater than 192 in length
          if (secret.length !== 128 && secret.length !== 192 && secret.length <= 192) {
            return { isValid: false, message: 'Incorrect TSS keychain' };
          }
        } else {
          if (!isValidPrv(secret) && !isValidXprv(secret)) {
            return { isValid: false, message: 'Invalid private key' };
          }
          if (publicKey) {
            const genPubKey = bitcoin.HDNode.fromBase58(secret).neutered().toBase58();
            if (genPubKey !== publicKey) {
              return { isValid: false, message: 'Incorrect xpub' };
            }
          }
        }
        break;
      case KeyCurve.Ed25519:
        if (multiSigType === 'tss') {
          // For TSS validation, we would need GPG private key for full implementation
          // This is a simplified validation of key format
          if (publicKey.length !== 128) {
            return { isValid: false, message: 'Incorrect TSS common keychain' };
          }

          try {
            const parsedKey = JSON.parse(secret);
            if ('uShare' in parsedKey) {
              // If the key is in JSON format, we need to check the private key length
              const privateKeyLength = parsedKey.uShare.seed.length + parsedKey.uShare.chaincode.length;
              if (privateKeyLength !== 128) {
                return { isValid: false, message: 'Incorrect TSS keychain' };
              }
            } else {
              // If the key is not in JSON format, we need to check the length directly
              if (secret.length !== 128) {
                return { isValid: false, message: 'Incorrect TSS keychain' };
              }
            }
          } catch (e) {
            return { isValid: false, message: 'Invalid TSS keychain format' };
          }
        } else {
          switch (coinName) {
            case 'xlm':
              const { KeyPair } = await import('@bitgo/sdk-coin-xlm');
              try {
                const xlmKeyPair = new KeyPair({ prv: secret });
                if (publicKey && publicKey !== xlmKeyPair.getKeys().pub) {
                  return { isValid: false, message: 'Incorrect XLM public key' };
                }
              } catch (e) {
                return { isValid: false, message: 'Invalid private key' };
              }
              break;
            case 'algo':
              const { AlgoLib } = await import('@bitgo/sdk-coin-algo');

              try {
                const algoKey = new AlgoLib.KeyPair({ prv: secret });
                if (publicKey && publicKey !== algoKey.getKeys().pub) {
                  return { isValid: false, message: 'Incorrect ALGO public key' };
                }
              } catch (e) {
                return { isValid: false, message: 'Invalid private key' };
              }
              break;
            case 'hbar':
              const { KeyPair: hbarKeypair } = await import('@bitgo/sdk-coin-hbar');
              try {
                const hbarKeyPair = new hbarKeypair({ prv: secret });
                const genPubKey = hbarKeyPair.getKeys().pub;
                if (publicKey && publicKey !== genPubKey) {
                  return { isValid: false, message: 'Incorrect HBAR public key' };
                }
              } catch (e) {
                return { isValid: false, message: 'Invalid private key' };
              }
              break;
            default:
              return { isValid: false, message: `Unsupported coin ${coinName}` };
          }
        }
        break;
      default: {
        return { isValid: false, message: `Unsupported curve ${curveType}` };
      }
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, message: error.message };
  }
}
