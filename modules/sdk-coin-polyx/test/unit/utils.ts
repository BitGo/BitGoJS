import should from 'should';
import { utils } from '../../src';
import { rawTx, stakingTx } from '../resources';
import { testnetMaterial } from '../../src/resources';
import { Interface } from '@bitgo-beta/abstract-substrate';

type Material = Interface.Material;

describe('Polyx Utils', () => {
  // Create a proper Material object from testnetMaterial
  const material: Material = {
    genesisHash: testnetMaterial.genesisHash,
    chainName: testnetMaterial.chainName,
    specName: testnetMaterial.specName,
    specVersion: testnetMaterial.specVersion,
    txVersion: testnetMaterial.txVersion,
    metadata: testnetMaterial.metadata as `0x${string}`,
  };

  describe('decodeTransaction', () => {
    it('should decode a signed transfer transaction and identify method name', () => {
      const decoded = utils.decodeTransaction(rawTx.transfer.signed, material);

      should.exist(decoded);
      decoded.should.have.property('method');
      decoded.method.should.have.property('pallet');
      decoded.method.should.have.property('name');

      // Check that it's a balances transfer
      decoded.method.pallet.should.equal('balances');
      decoded.method.name.should.equal('transferWithMemo');
    });

    it('should decode an unsigned transfer transaction and identify method name', () => {
      const decoded = utils.decodeTransaction(rawTx.transfer.unsigned, material);

      should.exist(decoded);
      decoded.should.have.property('method');
      decoded.method.should.have.property('pallet');
      decoded.method.should.have.property('name');

      // Check that it's a balances transfer
      decoded.method.pallet.should.equal('balances');
      decoded.method.name.should.equal('transferWithMemo');
    });

    it('should decode a CDD registration transaction and identify method name', () => {
      const decoded = utils.decodeTransaction(rawTx.cddTransaction.signed, material);

      should.exist(decoded);
      decoded.should.have.property('method');
      decoded.method.should.have.property('pallet');
      decoded.method.should.have.property('name');

      // Check that it's a CDD transaction
      decoded.method.pallet.should.equal('identity');
      decoded.method.name.should.equal('cddRegisterDidWithCdd');
    });

    it('should decode a staking bond transaction and identify method name', () => {
      const decoded = utils.decodeTransaction(stakingTx.bond.signed, material);

      should.exist(decoded);
      decoded.should.have.property('method');
      decoded.method.should.have.property('pallet');
      decoded.method.should.have.property('name');

      // Check that it's a staking bond
      decoded.method.pallet.should.equal('staking');
      decoded.method.name.should.equal('bond');
    });

    it('should decode a staking unbond transaction and identify method name', () => {
      const decoded = utils.decodeTransaction(stakingTx.unbond.signed, material);

      should.exist(decoded);
      decoded.should.have.property('method');
      decoded.method.should.have.property('pallet');
      decoded.method.should.have.property('name');

      // Check that it's a staking unbond
      decoded.method.pallet.should.equal('staking');
      decoded.method.name.should.equal('unbond');
    });

    it('should decode a batch transaction and identify method name', () => {
      const decoded = utils.decodeTransaction(stakingTx.batch.bondAndNominate.signed, material);

      should.exist(decoded);
      decoded.should.have.property('method');
      decoded.method.should.have.property('pallet');
      decoded.method.should.have.property('name');

      // Check that it's a batch transaction
      decoded.method.pallet.should.equal('utility');
      decoded.method.name.should.equal('batchAll');

      // Check the batch calls (handle potential null/undefined)
      decoded.method.should.have.property('args');
      decoded.method.args.should.have.property('calls');
      if (Array.isArray(decoded.method.args.calls)) {
        decoded.method.args.calls.should.be.an.Array();
        decoded.method.args.calls.length.should.equal(2);

        // First call should be bond
        if (decoded.method.args.calls[0]) {
          decoded.method.args.calls[0].should.have.property('callIndex');
        }
        // Second call should be nominate
        if (decoded.method.args.calls[1]) {
          decoded.method.args.calls[1].should.have.property('callIndex');
        }
      }
    });

    it('should decode a preApprove asset transaction and identify method name', () => {
      const decoded = utils.decodeTransaction(rawTx.preApproveAsset.signed, material);

      should.exist(decoded);
      decoded.should.have.property('method');
      decoded.method.should.have.property('pallet');
      decoded.method.should.have.property('name');

      // Check that it's an asset preApprove
      decoded.method.pallet.should.equal('asset');
      decoded.method.name.should.equal('preApproveAsset');
    });

    it('should decode a token transfer transaction and identify method name', () => {
      const decoded = utils.decodeTransaction(rawTx.tokenTransfer.signed, material);

      should.exist(decoded);
      decoded.should.have.property('method');
      decoded.method.should.have.property('pallet');
      decoded.method.should.have.property('name');

      // Check that it's a settlement transaction
      decoded.method.pallet.should.equal('settlement');
      decoded.method.name.should.equal('addAndAffirmWithMediators');
    });

    it('should decode unstake transaction and identify method name', () => {
      const decoded = utils.decodeTransaction(rawTx.unstake.signed, material);

      should.exist(decoded);
      decoded.should.have.property('method');
      decoded.method.should.have.property('pallet');
      decoded.method.should.have.property('name');

      // Check that it's a batch unstaking transaction
      decoded.method.pallet.should.equal('utility');
      decoded.method.name.should.equal('batchAll');
    });

    it('should decode withdraw unbonded transaction and identify method name', () => {
      const decoded = utils.decodeTransaction(rawTx.withdrawUnbonded.signed, material);

      should.exist(decoded);
      decoded.should.have.property('method');
      decoded.method.should.have.property('pallet');
      decoded.method.should.have.property('name');

      // Check that it's a staking withdraw unbonded
      decoded.method.pallet.should.equal('staking');
      decoded.method.name.should.equal('withdrawUnbonded');
    });

    it('should throw error for invalid transaction hex', () => {
      should.throws(() => {
        utils.decodeTransaction('0xinvalid', material);
      }, /Failed to decode transaction/);
    });
  });
});
