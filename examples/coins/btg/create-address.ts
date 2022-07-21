/**
 *
 * Create various types of bitcoin gold addresses. utxolib derives from bitcoinjs-lib.
 *
 */

{
  const utxolib = require('@bitgo/utxo-lib');

  // Generate Random Keypair

  const keyPair = utxolib.ECPair.makeRandom();

  console.log('Public Key: ', keyPair.publicKey.toString('hex'));
  console.log('Private Key: ', keyPair.toWIF());

  // Legacy (P2PKH)

  const { address: legacyAddress } = utxolib.payments.p2pkh({
    pubkey: keyPair.publicKey,
  });

  const legacyDecoded = utxolib.address.fromBase58Check(legacyAddress);
  const legacyBTGAddress = utxolib.address.toBase58Check(legacyDecoded['hash'], _getVersion(legacyDecoded['version']));

  console.log('legacyBTGAddress', legacyBTGAddress);

  // Native SegWit (Bech32)

  const { address: nativeSegWit } = utxolib.payments.p2sh({
    redeem: utxolib.payments.p2wpkh({ pubkey: keyPair.publicKey }),
  });

  const nativeDecoded = utxolib.address.fromBase58Check(nativeSegWit);
  const nativeBTGAddress = utxolib.address.toBase58Check(legacyDecoded['hash'], _getVersion(nativeDecoded['version']));

  console.log('nativeBTGAddress', nativeBTGAddress);

  // -----------------------------

  function _getVersion(version) {
    switch (version) {
      case 0:
        console.log('BTG p2pkh address: ');
        return 38;
      case 38:
        console.log('BTC p2pkh address: ');
        return 0;
      case 5:
        console.log('BTG p2sh address: ');
        return 23;
      case 23:
        console.log('BTC p2sh address: ');
        return 5;
      default:
        throw 'unknown';
    }
  }
}
