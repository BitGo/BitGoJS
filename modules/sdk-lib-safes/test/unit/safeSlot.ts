import 'should';
import { onchainSlotForCoin, tssSlotForCoin } from '../../src';

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
});
