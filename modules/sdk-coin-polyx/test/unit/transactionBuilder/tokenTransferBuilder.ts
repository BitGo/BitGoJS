import should from 'should';
import { TokenTransferBuilder } from '../../../src/lib';
import { utils } from '../../../src';

import { accounts, rawTx, chainName, genesisHash, mockTssSignature } from '../../resources';
import { buildTestConfig } from './base';
import { testnetMaterial } from '../../../src/resources';

describe('Polyx token transfer Builder - Testnet', () => {
  let builder: TokenTransferBuilder;

  const sender = accounts.rbitgoTokenOwner;
  const senderDID = '0x28e8649fec23dd688090b9b5bb950fd34bf20a014cf05542e3ad0264915ee775';
  const receiverDID = '0x9202856204a721d2f5e8b85408067d54f1ca84390bf4f558b5615a5a6d3bddb8';
  const assetId = '0x780602887b358cf48989d0d9aa6c8d28';

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new TokenTransferBuilder(config).material(utils.getMaterial(config.network.type));
  });

  describe('build tokenTransfer transaction', () => {
    it('should build a tokenTransfer transaction', async () => {
      builder
        .toDID(receiverDID)
        .fromDID(senderDID)
        .memo('0')
        .assetId(assetId)
        .amount('100')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100');
      should.deepEqual(txJson.toDID, receiverDID);
      should.deepEqual(txJson.fromDID, senderDID);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.assetId, assetId);
      should.deepEqual(txJson.memo, '0x3030303030303030303030303030303030303030303030303030303030303030');
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName, testnetMaterial.chainName);
      should.deepEqual(txJson.eraPeriod, 64);

      const inputs = tx.inputs[0];
      should.deepEqual(inputs.address, senderDID);
      should.deepEqual(inputs.value, '100');

      const outputs = tx.outputs[0];
      should.deepEqual(outputs.address, receiverDID);
      should.deepEqual(outputs.value, '100');
    });

    it('should build an unsigned tokenTransfer transaction', async () => {
      builder
        .toDID(receiverDID)
        .fromDID(senderDID)
        .memo('0')
        .assetId(assetId)
        .amount('100')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100');
      should.deepEqual(txJson.toDID, receiverDID);
      should.deepEqual(txJson.fromDID, senderDID);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.assetId, assetId);
      should.deepEqual(txJson.memo, '0x3030303030303030303030303030303030303030303030303030303030303030');
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
      builder.from(rawTx.tokenTransfer.signed);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '1000000');
      should.deepEqual(txJson.toDID, '0xbc6f7ec808f361c1353ab9dc88c3cc54b98d9eb60fed9c063e67a40925b8ef61');
      should.deepEqual(txJson.fromDID, '0x1208d7851e6698249aea40742701ee1ef6cdcced260a7c49c1cca1a9db836342');
      should.deepEqual(txJson.sender, '5HK1b9uRQqkj422kbWmDYFgzoLcjtVZAgP9yXkQyAMNDJnpX');
      should.deepEqual(txJson.assetId, '0x780602887b358cf48989d0d9aa6c8d28');
      should.deepEqual(txJson.memo, '0x3000000000000000000000000000000000000000000000000000000000000000');
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 3);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(rawTx.tokenTransfer.unsigned);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: '5HK1b9uRQqkj422kbWmDYFgzoLcjtVZAgP9yXkQyAMNDJnpX' })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '1000000');
      should.deepEqual(txJson.toDID, '0xbc6f7ec808f361c1353ab9dc88c3cc54b98d9eb60fed9c063e67a40925b8ef61');
      should.deepEqual(txJson.fromDID, '0x1208d7851e6698249aea40742701ee1ef6cdcced260a7c49c1cca1a9db836342');
      should.deepEqual(txJson.sender, '5HK1b9uRQqkj422kbWmDYFgzoLcjtVZAgP9yXkQyAMNDJnpX');
      should.deepEqual(txJson.assetId, '0x780602887b358cf48989d0d9aa6c8d28');
      should.deepEqual(txJson.memo, '0x3000000000000000000000000000000000000000000000000000000000000000');
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 3);
      should.deepEqual(txJson.eraPeriod, 64);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName, chainName);
    });
  });
});
