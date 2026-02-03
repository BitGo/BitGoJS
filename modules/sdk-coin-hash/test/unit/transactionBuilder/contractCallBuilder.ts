import { BitGoAPI } from '@bitgo/sdk-api';
import { TransactionType } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { fromBase64, toHex } from '@cosmjs/encoding';
import should from 'should';
import { Hash, Thash } from '../../../src';
import { TEST_CONTRACT_CALL, testnetAddress } from '../../resources/hash';
import { wrapInGroupProposal } from '../../utils/groupProposalHelper';

describe('Hash ContractCall Builder', () => {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let factory;

  // Helper function to create a complete transaction builder with standard settings and message
  const contractCallBuilder = () => {
    const txBuilder = factory.getContractCallBuilder();
    txBuilder.sequence(TEST_CONTRACT_CALL.sequence);
    txBuilder.accountNumber(TEST_CONTRACT_CALL.accountNumber);
    txBuilder.chainId(TEST_CONTRACT_CALL.chainId);
    txBuilder.gasBudget({
      amount: [{ denom: 'nhash', amount: TEST_CONTRACT_CALL.fee }],
      gasLimit: TEST_CONTRACT_CALL.gasLimit,
    });
    txBuilder.feeGranter(TEST_CONTRACT_CALL.feeGranter);
    txBuilder.publicKey(toHex(fromBase64(TEST_CONTRACT_CALL.pubKey)));

    // Wrap the inner message in a group proposal
    const wrappedMessage = wrapInGroupProposal(
      TEST_CONTRACT_CALL.preEncodedMessageValue,
      TEST_CONTRACT_CALL.proposer,
      testnetAddress.groupPolicyAddress
    );

    txBuilder.messages([
      {
        typeUrl: '/cosmos.group.v1.MsgSubmitProposal',
        value: wrappedMessage.value,
      },
    ]);
    return txBuilder;
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('hash', Hash.createInstance);
    bitgo.safeRegister('thash', Thash.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('thash');
    factory = basecoin.getBuilder();
  });

  describe('Contract Call Builder Tests', () => {
    it('should build transaction with expected signable payload', async function () {
      const txBuilder = contractCallBuilder();
      const tx = await txBuilder.build();
      should.equal(toHex(tx.signablePayload), TEST_CONTRACT_CALL.expectedSignBytesHex);
      should.equal(tx.type, TransactionType.ContractCall);
    });

    it('should build, sign, and serialize contract call transactions', async function () {
      // Test unsigned transaction building
      const unsignedBuilder = contractCallBuilder();
      const unsignedTx = await unsignedBuilder.build();
      should.equal(unsignedTx.type, TransactionType.ContractCall);
      should.equal(unsignedTx.signature.length, 0);
      should.exist(unsignedTx.toBroadcastFormat());

      // Test signing functionality
      const signedBuilder = contractCallBuilder();
      signedBuilder.sign({ key: toHex(fromBase64(TEST_CONTRACT_CALL.privateKey)) });
      const signedTx = await signedBuilder.build();
      should.equal(signedTx.type, TransactionType.ContractCall);
      should.equal(signedTx.signature.length, 1);
      should.exist(signedTx.toBroadcastFormat());
    });

    it('should handle round-trip serialization for signed and unsigned transactions', async function () {
      // Test unsigned serialization
      const unsignedBuilder = contractCallBuilder();
      const unsignedTx = await unsignedBuilder.build();
      const unsignedRaw = unsignedTx.toBroadcastFormat();
      const rebuiltUnsigned = factory.from(unsignedRaw);
      const rebuiltUnsignedTx = await rebuiltUnsigned.build();
      should.equal(rebuiltUnsignedTx.toBroadcastFormat(), unsignedRaw);
      should.equal(rebuiltUnsignedTx.type, TransactionType.ContractCall);

      // Test signed serialization
      const signedBuilder = contractCallBuilder();
      signedBuilder.sign({ key: toHex(fromBase64(TEST_CONTRACT_CALL.privateKey)) });
      const signedTx = await signedBuilder.build();
      const signedRaw = signedTx.toBroadcastFormat();
      const rebuiltSigned = factory.from(signedRaw);
      const rebuiltSignedTx = await rebuiltSigned.build();
      should.equal(rebuiltSignedTx.toBroadcastFormat(), signedRaw);
      should.equal(rebuiltSignedTx.signature.length, 1);
      should.equal(rebuiltSignedTx.signature[0], signedTx.signature[0]);
    });
  });
});
