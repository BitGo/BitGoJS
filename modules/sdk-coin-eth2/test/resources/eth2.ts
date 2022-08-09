import { KeyPair } from '../../src';

// ACCOUNT_1 has public and private keys
export const ACCOUNT_1 = {
  privateKey: '8fa1aa4aaa6c54aa2aacaafaaa23aCaa8fa1aa4aaa6c54aa2aacaafaaa23aCaa',
  publicKey: '8fa1aa4aaa6c54aa2aacaafaaa23aCaa8fa1aa4aaa6c54aa2aacaafaaa23aCaa',
  privateKeyBytes: Uint8Array.from(
    Buffer.from('4fd90ae1b8f724a4902615c09145ae134617c325b98c6970dcf62ab9cc5e12f3', 'hex')
  ),
};

export const errorMessageInvalidPrivateKey = 'Private key derivation is not supported in bls';

export const errorMessageInvalidPublicKey = 'Public key derivation is not supported in bls';

export const KEYPAIR_PRV = new KeyPair({
  prv: '302e020100300506032b65700422042062b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01',
});
