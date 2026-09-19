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

    it('rejects ed25519 TSS chains', function () {
      (() => tssSlotForCoin('txlm')).should.throw(/ed25519 MPC safe wallet minting is not yet supported/);
    });

    it('rejects unknown chains', function () {
      (() => tssSlotForCoin('definitely-not-a-coin')).should.throw();
    });
  });
});
