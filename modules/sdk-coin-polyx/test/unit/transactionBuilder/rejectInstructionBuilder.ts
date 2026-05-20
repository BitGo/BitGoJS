import should from 'should';
import { RejectInstructionBuilder } from '../../../src/lib';
import { utils } from '../../../src';

import { accounts, rawTx, chainName, genesisHash, mockTssSignature } from '../../resources';
import { buildTestConfig } from './base';
import { testnetMaterial } from '../../../src/resources';

describe('Polyx Reject Instruction Builder - Testnet', () => {
  let builder: RejectInstructionBuilder;

  const sender = accounts.account1;
  const instructionId = '14100';
  const portfolioDID = '0x1208d7851e6698249aea40742701ee1ef6cdcced260a7c49c1cca1a9db836342';

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new RejectInstructionBuilder(config).material(utils.getMaterial(config.network.type));
  });

  describe('build rejectInstruction transaction', () => {
    it('should build a rejectInstruction transaction', async () => {
      builder
        .instructionId(instructionId)
        .portfolioDID(portfolioDID)
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.instructionId, instructionId);
      should.deepEqual(txJson.portfolioDID, portfolioDID);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName, testnetMaterial.chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build an unsigned rejectInstruction transaction', async () => {
      builder
        .instructionId(instructionId)
        .portfolioDID(portfolioDID)
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.instructionId, instructionId);
      should.deepEqual(txJson.portfolioDID, portfolioDID);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async () => {
      if (rawTx.rejectInstruction?.signed) {
        builder.from(rawTx.rejectInstruction.signed);
        builder
          .validity({ firstValid: 3933, maxDuration: 64 })
          .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.exist(txJson.instructionId);
        should.deepEqual(txJson.instructionId, instructionId);
        should.exist(txJson.portfolioDID);
        should.deepEqual(txJson.portfolioDID, portfolioDID);
        should.deepEqual(txJson.blockNumber, 3933);
        should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
        should.deepEqual(txJson.genesisHash, genesisHash);
        should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
        should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
        should.deepEqual(txJson.chainName, chainName);
        should.deepEqual(txJson.eraPeriod, 64);
      }
    });

    it('should build from raw unsigned tx', async () => {
      if (rawTx.rejectInstruction?.unsigned) {
        builder.from(rawTx.rejectInstruction.unsigned);
        builder
          .validity({ firstValid: 3933, maxDuration: 64 })
          .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
          .sender({ address: sender.address })
          .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

        const tx = await builder.build();
        const txJson = tx.toJson();
        should.exist(txJson.instructionId);
        should.deepEqual(txJson.instructionId, instructionId);
        should.exist(txJson.portfolioDID);
        should.deepEqual(txJson.portfolioDID, portfolioDID);
        should.deepEqual(txJson.sender, sender.address);
        should.deepEqual(txJson.blockNumber, 3933);
        should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
        should.deepEqual(txJson.genesisHash, genesisHash);
        should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
        should.deepEqual(txJson.eraPeriod, 64);
        should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
        should.deepEqual(txJson.chainName, chainName);
      }
    });

    it('should validate instruction ID is set', async () => {
      builder
        .portfolioDID(portfolioDID)
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });

      await builder.build().should.be.rejected();
    });
  });
});
