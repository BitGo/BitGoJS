/**
 *
 * Create various types of utxo addresses. utxolib derives the following functionality from bitcoinjs-lib.
 * Bitcoin
 * Bitcoin Cash
 * Bitcoin SV
 * Litecoin
 */

{
  const utxolib = require('@bitgo/utxo-lib');

  // Generate Random Keypair

  const keyPair = utxolib.ECPair.makeRandom();

  console.log('Public Key: ', keyPair.publicKey.toString('hex'));
  console.log('Private Key: ', keyPair.toWIF());

  // Legacy (P2PKH)

  const { address: legacyAddress } = utxolib.payments.p2pkh({ pubkey: keyPair.publicKey });

  console.log('legacyAddress', legacyAddress);

  // Native SegWit (Bech32)

  const { address: nativeSegWit } = utxolib.payments.p2sh({
    redeem: utxolib.payments.p2wpkh({ pubkey: keyPair.publicKey }),
  });

  console.log('nativeSegWit', nativeSegWit);

  // Multi-signature Address (2 of 3)

  const keyPair2 = utxolib.ECPair.makeRandom();
  const keyPair3 = utxolib.ECPair.makeRandom();

  const pubkeys = [
    keyPair.publicKey.toString('hex'),
    keyPair2.publicKey.toString('hex'),
    keyPair3.publicKey.toString('hex'),
  ].map((hex) => Buffer.from(hex, 'hex'));

  const { address: multiSigAddress } = utxolib.payments.p2sh({
    redeem: utxolib.payments.p2ms({ m: 2, pubkeys }),
  });

  console.log('multiSigAddress', multiSigAddress);
}
