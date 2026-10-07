import 'should';
import { onchainSlotForCoin, safeSlotsForCoin, tssSlotForCoin } from '../../src';

describe('safeSlot', function () {
  describe('onchainSlotForCoin', function () {
    it('maps secp256k1 chains to secp256k1Multisig', function () {
      onchainSlotForCoin('tbtc').should.equal('secp256k1Multisig');
      onchainSlotForCoin('hteth').should.equal('secp256k1Multisig');
    });

    it('maps ed25519 chains to ed25519Multisig', function () {
      onchainSlotForCoin('txlm').should.equal('ed25519Multisig');
      onchainSlotForCoin('talgo').should.equal('ed25519Multisig');
    });

    it('rejects unknown chains', function () {
      (() => onchainSlotForCoin('definitely-not-a-coin')).should.throw();
    });
  });

  describe('tssSlotForCoin', function () {
    it('maps secp256k1 TSS chains to ecdsaMpc', function () {
      tssSlotForCoin('hteth').should.equal('ecdsaMpc');
      tssSlotForCoin('teth').should.equal('ecdsaMpc');
    });

    it('maps ed25519 TSS chains to eddsaMpc', function () {
      tssSlotForCoin('sol').should.equal('eddsaMpc');
      tssSlotForCoin('tsol').should.equal('eddsaMpc');
    });

    it('rejects unknown chains', function () {
      (() => tssSlotForCoin('definitely-not-a-coin')).should.throw();
    });
  });

  describe('safeSlotsForCoin', function () {
    it('returns the onchain slot for multisig secp256k1 coins', function () {
      safeSlotsForCoin('btc').should.deepEqual(['secp256k1Multisig']);
      safeSlotsForCoin('tbtc').should.deepEqual(['secp256k1Multisig']);
    });

    it('returns the onchain slot for multisig ed25519 coins', function () {
      safeSlotsForCoin('xlm').should.deepEqual(['ed25519Multisig']);
      safeSlotsForCoin('txlm').should.deepEqual(['ed25519Multisig']);
    });

    it('returns the tss slot for tss-only coins', function () {
      safeSlotsForCoin('eth').should.deepEqual(['ecdsaMpc']);
      safeSlotsForCoin('sol').should.deepEqual(['eddsaMpc']);
    });

    it('returns both slots in order for a coin with both features', function () {
      safeSlotsForCoin('zec').should.deepEqual(['secp256k1Multisig', 'ecdsaMpc']);
    });

    it('returns [] for a coin that mints under no safe slot', function () {
      safeSlotsForCoin('teth').should.deepEqual([]);
    });

    it('rejects unknown chains', function () {
      (() => safeSlotsForCoin('definitely-not-a-coin')).should.throw();
    });
  });
});
