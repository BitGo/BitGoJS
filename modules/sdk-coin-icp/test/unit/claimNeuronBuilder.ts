import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { ClaimNeuronBuilder } from '../../src/lib/staking/claimNeuronBuilder';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../src/lib/transaction';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { Principal } from '@dfinity/principal';
import should from 'should';
import { createHash } from 'crypto';
import { GOVERNANCE_CANISTER_ID } from '../../src/lib/iface';

describe('ICP Claim Neuron Builder', () => {
  let bitgo: TestBitGoAPI;
  let builder: ClaimNeuronBuilder;
  const coinName = 'ticp';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('ticp', coins.get('ticp') as any);
  });

  beforeEach(() => {
    builder = new ClaimNeuronBuilder(coins.get(coinName));
  });

  it('should initialize with default values', () => {
    should.exist(builder);
    (builder as any)._neuronMemo.toString().should.equal('0');
  });

  it('should set neuron memo', () => {
    const memo = 12345n;
    builder.neuronMemo(memo);
    (builder as any)._neuronMemo.should.equal(memo);
  });

  it('should throw error for invalid neuron memo', () => {
    (() => builder.neuronMemo(-1n)).should.throw(BuildTransactionError);
  });

  describe('getClaimNeuronParams', () => {
    const publicKey = '03ab8d1d860207f559c630290e60a0afe31afacfcd8c900c07b40f1d3b11c954a1';

    it('should throw error if public key is missing', () => {
      (() => builder.getClaimNeuronParams()).should.throw(new BuildTransactionError('Public key is required'));
    });

    it('should return valid claim neuron params', () => {
      builder.sender('e8b8a75748496b0a2c5c21f1576f7ca6283809115a1b454039ac6e68ff61b80f', publicKey).neuronMemo(123n);
      const params = builder.getClaimNeuronParams();
      should.exist(params);
      params.memo.should.equal(123n);
      should.exist(params.controller);
      params.controller.should.be.instanceof(Principal);
    });
  });

  describe('neuron subaccount generation', () => {
    const publicKey = '03ab8d1d860207f559c630290e60a0afe31afacfcd8c900c07b40f1d3b11c954a1';
    const memo = 123n;

    it('should generate correct neuron subaccount', async () => {
      builder
        .sender('e8b8a75748496b0a2c5c21f1576f7ca6283809115a1b454039ac6e68ff61b80f', publicKey)
        .amount('1000000000')
        .neuronMemo(memo);
      const tx = (await builder.build()) as Transaction;

      // Verify the subaccount generation matches the expected algorithm
      const controllerPrincipal = (builder as any).utils.derivePrincipalFromPublicKey(publicKey);
      const nonceBuf = Buffer.alloc(8);
      nonceBuf.writeBigUInt64BE(memo);
      const domainSeparator = Buffer.from([0x0c]);
      const context = Buffer.from('neuron-stake', 'utf8');
      const principalBytes = controllerPrincipal.toUint8Array();
      const hashInput = Buffer.concat([domainSeparator, context, principalBytes, nonceBuf]);
      const expectedSubaccount = new Uint8Array(createHash('sha256').update(hashInput).digest());

      // Get utils and account ID prefix
      const utils = (builder as any).utils;
      const accountIdPrefix = utils.getAccountIdPrefix();

      // Debug logging for subaccount generation
      console.log('Account ID prefix:', accountIdPrefix.toString('hex'));
      console.log('Controller principal bytes:', Buffer.from(principalBytes).toString('hex'));
      console.log('Expected subaccount:', Buffer.from(expectedSubaccount).toString('hex'));
      console.log('Hash input:', Buffer.from(hashInput).toString('hex'));

      // Generate the expected full address using the governance principal
      const governancePrincipal = Principal.fromUint8Array(GOVERNANCE_CANISTER_ID);
      const governancePrincipalBytes = governancePrincipal.toUint8Array();

      // Debug logging for address components
      console.log('Governance principal bytes:', Buffer.from(governancePrincipalBytes).toString('hex'));

      // Generate expected address using the same method as the implementation
      const expectedAddress = utils.getAccountIdFromPrincipalBytes(
        accountIdPrefix,
        Buffer.from(governancePrincipalBytes),
        expectedSubaccount
      );
      console.log('Expected address:', expectedAddress);

      const icpTx = tx as Transaction;
      const receiverAddress = icpTx.icpTransactionData.receiverAddress;
      should.exist(receiverAddress);
      console.log('Actual receiver address:', receiverAddress);
      console.log(
        'Transaction data:',
        JSON.stringify(
          {
            icpTransactionData: icpTx.icpTransactionData,
            icpTransaction: icpTx.icpTransaction,
          },
          null,
          2
        )
      );

      receiverAddress.should.equal(expectedAddress);

      // Verify the transaction operations are set correctly
      should.exist(icpTx.icpTransaction);
      should.exist(icpTx.icpTransaction.operations);
      icpTx.icpTransaction.operations.should.have.length(3); // sender, receiver, fee operations

      // Verify the operations in detail
      const [senderOp, receiverOp, feeOp] = icpTx.icpTransaction.operations;
      console.log(
        'Operations:',
        JSON.stringify(
          {
            sender: senderOp,
            receiver: receiverOp,
            fee: feeOp,
          },
          null,
          2
        )
      );
    });
  });

  describe('build', () => {
    const sender = 'e8b8a75748496b0a2c5c21f1576f7ca6283809115a1b454039ac6e68ff61b80f';
    const amount = '1000000000';
    const publicKey = '03ab8d1d860207f559c630290e60a0afe31afacfcd8c900c07b40f1d3b11c954a1';

    it('should throw error if sender is missing', async () => {
      builder.amount(amount);
      await builder
        .build()
        .should.be.rejectedWith(new BuildTransactionError('Sender address and public key are required'));
    });

    it('should throw error if public key is missing', async () => {
      builder.amount(amount);
      await builder
        .build()
        .should.be.rejectedWith(new BuildTransactionError('Sender address and public key are required'));
    });

    it('should throw error if amount is missing', async () => {
      builder.sender(sender, publicKey);
      await builder.build().should.be.rejectedWith(new BuildTransactionError('Staking amount is required'));
    });

    it('should build a valid transaction and claim neuron params', async () => {
      builder.sender(sender, publicKey).amount(amount).neuronMemo(123n);

      const tx = await builder.build();
      const claimParams = builder.getClaimNeuronParams();
      should.exist(claimParams);
      claimParams.memo.should.equal(123n);
      should.exist(claimParams.controller);
      should.exist(tx);
      tx.should.be.instanceof(Transaction);

      const txData = tx.toJson();
      txData.sender.should.equal(sender);
      txData.senderPublicKey.should.equal(publicKey);
      txData.memo.should.equal(123);
    });
  });
});
