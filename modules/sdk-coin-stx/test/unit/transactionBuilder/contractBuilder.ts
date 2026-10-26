import assert from 'assert';
import should from 'should';
import BigNum from 'bn.js';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { InvalidParameterValueError, ParseTransactionError, TransactionType } from '@bitgo/sdk-core';
import { bufferCV, noneCV, someCV, standardPrincipalCV, tupleCV, uintCV, intCV } from '@stacks/transactions';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';

import { Stx, Tstx, StxLib } from '../../../src';
import * as testData from '../resources';

const { stringifyCv } = StxLib.Utils;

describe('Stacks: Contract Builder', function () {
  const coinName = 'stx';
  const coinNameTest = 'tstx';
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('stx', Stx.createInstance);
    bitgo.safeRegister('tstx', Tstx.createInstance);
  });

  describe('Stx Contract call Builder', () => {
    const factory = new StxLib.TransactionBuilderFactory(coins.get(coinNameTest));
    const factoryProd = new StxLib.TransactionBuilderFactory(coins.get(coinName));
    // Deployment-configured non-canonical pox-5 address (Stacks Foundation test contract) set on the
    // mainnet `Stx` statics network as `allowedStakingContractAddresses`.
    const CONFIGURED_STAKING_ADDRESS = 'SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY';

    const initTxBuilder = () => {
      const txBuilder = factory.getContractBuilder();
      txBuilder.fee({ fee: '180' });
      txBuilder.nonce(0);
      txBuilder.contractAddress(testData.CONTRACT_ADDRESS);
      txBuilder.contractName(testData.CONTRACT_NAME);
      txBuilder.functionName(testData.CONTRACT_FUNCTION_NAME);
      return txBuilder;
    };

    describe('contract builder environment', function () {
      it('should select the right network', function () {
        should.equal(factory.getTransferBuilder().coinName(), 'tstx');
        should.equal(factoryProd.getTransferBuilder().coinName(), 'stx');
        // used type any to access protected properties
        const txBuilder: any = factory.getTransferBuilder();
        const txBuilderProd: any = factoryProd.getTransferBuilder();

        txBuilder._network.should.deepEqual(STACKS_TESTNET);
        txBuilderProd._network.should.deepEqual(STACKS_MAINNET);
      });
    });

    describe('should build ', () => {
      it('an unsigned contract call transaction', async () => {
        const builder = initTxBuilder();
        builder.functionArgs([
          { type: 'uint128', val: '400000000' },
          { type: 'principal', val: testData.ACCOUNT_2.address },
          { type: 'optional', val: { type: 'uint128', val: '200' } },
          {
            type: 'optional',
            val: {
              type: 'tuple',
              val: [
                { key: 'hashbytes', type: 'buffer', val: Buffer.from('some-hash') },
                { key: 'version', type: 'buffer', val: new BigNum(1).toBuffer() },
              ],
            },
          },
        ]);
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.numberSignatures(1);
        const tx = await builder.build();

        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
        should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
        should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.fee.toString(), '180');
        should.deepEqual(tx.toBroadcastFormat(), testData.UNSIGNED_CONTRACT_CALL);

        tx.type.should.equal(TransactionType.ContractCall);
        tx.outputs.length.should.equal(1);
        tx.outputs[0].address.should.equal(testData.CONTRACT_ADDRESS);
        tx.outputs[0].value.should.equal('0');
        tx.inputs.length.should.equal(1);
        tx.inputs[0].address.should.equal(testData.TX_SENDER.address);
        tx.inputs[0].value.should.equal('0');
      });

      it('an unsigned self stacking contract call transaction', async () => {
        const builder = initTxBuilder();
        /* Contract call in clarity POX-4
        (define-public (stack-stx (amount-ustx uint)
                          (pox-addr (tuple (version (buff 1)) (hashbytes (buff 32))))
                          (start-burn-ht uint)
                          (lock-period uint)
                          (signer-sig (optional (buff 65)))
                          (signer-key (buff 33))
                          (max-amount uint)
                          (auth-id uint))
         */
        builder.functionArgs([
          { type: 'uint128', val: '400000000' },
          {
            type: 'tuple',
            val: [
              { key: 'hashbytes', type: 'buffer', val: Buffer.from('some-hash') },
              { key: 'version', type: 'buffer', val: new BigNum(1).toBuffer() },
            ],
          },
          { type: 'uint128', val: '52800' },
          { type: 'uint128', val: '2' },
          // Nakamoto upgrade new 4 parameters
          // https://docs.stacks.co/nakamoto-upgrade/signing-and-stacking/stacking-flow#solo-stacker-flow
          { type: 'optional', val: { type: 'buffer', val: Buffer.from('some-hash') } },
          { type: 'buffer', val: Buffer.from('some-hash') },
          { type: 'uint128', val: '340282366920938463463374607431768211455' },
          { type: 'uint128', val: '123456' },
        ]);
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.numberSignatures(1);
        const tx = await builder.build();

        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
        should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
        should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.fee.toString(), '180');
        should.deepEqual(tx.toBroadcastFormat(), testData.UNSIGNED_SELF_STACK_CONTRACT_CALL);

        tx.type.should.equal(TransactionType.ContractCall);
        tx.outputs.length.should.equal(1);
        tx.outputs[0].address.should.equal(testData.CONTRACT_ADDRESS);
        tx.outputs[0].value.should.equal('0');
        tx.inputs.length.should.equal(1);
        tx.inputs[0].address.should.equal(testData.TX_SENDER.address);
        tx.inputs[0].value.should.equal('0');
      });

      it('an unsigned PoX-5 register-for-bond contract call transaction', async () => {
        const builder = factory.getContractBuilder();
        builder.fee({ fee: '180' });
        builder.nonce(0);
        builder.contractAddress(testData.CONTRACT_ADDRESS);
        builder.contractName('pox-5');
        builder.functionName('register-for-bond');
        builder.functionArgs([
          { type: 'uint128', val: '210' },
          { type: 'principal', val: 'STDE7Y8HV3RX8VBM2TZVWJTS7ZA1XB0SSC3NEVH0.signer-manager' },
          { type: 'uint128', val: '1005000' },
          { type: 'optional' },
          { type: 'optional' },
        ]);
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.numberSignatures(1);

        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.contractName, 'pox-5');
        should.deepEqual(txJson.payload.functionName, 'register-for-bond');
        txJson.payload.functionArgs.length.should.equal(5);
      });

      it('an unsigned caller-allowlisted non-canonical pox-5 (dummy) contract call transaction', async () => {
        // The caller supplies the staking contract it is configured for — no SDK change needed.
        const builder = factoryProd.getContractBuilder();
        builder.allowedStakingContracts([
          { name: 'pox-5-dummy-v1', address: 'SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY' },
        ]);
        builder.fee({ fee: '180' });
        builder.nonce(0);
        builder.contractAddress('SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY');
        builder.contractName('pox-5-dummy-v1');
        builder.functionName('register-for-bond');
        builder.functionArgs([
          { type: 'uint128', val: '210' },
          { type: 'principal', val: 'SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY.signer-manager-stackslabs-dummy-v1' },
          { type: 'uint128', val: '1005000' },
          { type: 'optional' },
          { type: 'optional' },
        ]);
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.numberSignatures(1);

        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.contractName, 'pox-5-dummy-v1');
        should.deepEqual(txJson.payload.contractAddress, 'SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY');
        should.deepEqual(txJson.payload.functionName, 'register-for-bond');
      });

      it('rehydrates an allowlisted non-canonical contract call (sign / explain / fee-rebuild path)', async () => {
        // `signTransaction` / `explainTransaction` / the fee re-build all go through `factory.from(hex)`,
        // which re-creates the builder — re-parsing must not reject the allowlisted contract.
        const allowlist = [{ name: 'pox-5-dummy-v1', address: 'SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY' }];
        const builder = factoryProd.getContractBuilder();
        builder.allowedStakingContracts(allowlist);
        builder.fee({ fee: '180' });
        builder.nonce(0);
        builder.contractAddress('SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY');
        builder.contractName('pox-5-dummy-v1');
        builder.functionName('register-for-bond');
        builder.functionArgs([
          { type: 'uint128', val: '210' },
          { type: 'principal', val: 'SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY.signer-manager-stackslabs-dummy-v1' },
          { type: 'uint128', val: '1005000' },
          { type: 'optional' },
          { type: 'optional' },
        ]);
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.numberSignatures(1);
        const tx = await builder.build();

        const reparsed = factoryProd.from(tx.toBroadcastFormat(), { allowedStakingContracts: allowlist });
        reparsed.fromPubKey(testData.TX_SENDER.pub);
        reparsed.numberSignatures(1);
        const payload = (await reparsed.build()).toJson().payload;
        should.deepEqual(payload.contractAddress, 'SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY');
        should.deepEqual(payload.contractName, 'pox-5-dummy-v1');

        // Without the allowlist the rebuild is rejected — canonical validation is preserved (no relaxation).
        (() => factoryProd.from(tx.toBroadcastFormat())).should.throw(ParseTransactionError);
      });

      it('rejects an allowlisted name followed by a canonical address (order-independent pair check)', function () {
        const builder = factoryProd.getContractBuilder();
        builder.allowedStakingContracts([
          { name: 'pox-5-dummy-v1', address: 'SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY' },
        ]);
        builder.contractName('pox-5-dummy-v1'); // allowlisted name first
        (() => builder.contractAddress('SP000000000000000000002Q6VF78')).should.throw(/not an allowlisted pair/);
      });

      it('rejects an allowlisted address followed by a canonical name (order-independent pair check)', function () {
        const builder = factoryProd.getContractBuilder();
        // A dummy address that is NOT the network-configured pox-5 (otherwise the canonical `pox-5`
        // name would legitimately pair with it) — keeps the allowlist pair check under test.
        const dummyAddress = 'SP2T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY';
        builder.allowedStakingContracts([{ name: 'pox-5-dummy-v1', address: dummyAddress }]);
        builder.contractAddress(dummyAddress); // allowlisted address first
        (() => builder.contractName('pox-5')).should.throw(/not an allowlisted pair/);
      });

      it('rejects duplicate allowlisted contract names', function () {
        const builder = factoryProd.getContractBuilder();
        (() =>
          builder.allowedStakingContracts([
            { name: 'pox-5-dummy-v1', address: 'SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY' },
            { name: 'pox-5-dummy-v1', address: 'SP000000000000000000002Q6VF78' },
          ])).should.throw(/Duplicate staking contract name/);
      });

      it('rejects an allowlisted name paired with a different address', function () {
        const builder = factoryProd.getContractBuilder();
        builder.allowedStakingContracts([
          { name: 'pox-5-dummy-v1', address: 'SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY' },
        ]);
        builder.contractAddress('SP000000000000000000002Q6VF78'); // canonical address, wrong pair
        (() => builder.contractName('pox-5-dummy-v1')).should.throw(/not an allowlisted pair/);
      });

      it('rejects a function that is not in the pox-5 set for an allowlisted contract', function () {
        const builder = factoryProd.getContractBuilder();
        builder.allowedStakingContracts([
          { name: 'pox-5-dummy-v1', address: 'SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY' },
        ]);
        builder.contractAddress('SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY');
        builder.contractName('pox-5-dummy-v1');
        // `stack-stx` is a pox-4 function, not part of the pox-5 ABI the dummy mirrors.
        (() => builder.functionName('stack-stx')).should.throw(/is not supported contract function name/);
      });

      it('rejects a contract name that is not allowlisted', function () {
        const builder = factory.getContractBuilder();
        (() => builder.contractName('some-other-contract')).should.throw(/Only pox-4, pox-5, and send-many-memo/);
      });

      it('rejects a contract address that is not allowlisted', function () {
        const builder = factory.getContractBuilder();
        (() => builder.contractAddress('SP3JVSE4ZB5GMDJP5XBPX7ZB1BG3QDFW7RCEQJDMY')).should.throw(
          /Invalid contract address/
        );
      });

      it('accepts a deployment-configured staking address on the canonical pox-5 name (no allowlist)', async () => {
        // The network statics carry the configured address, so a canonical pox-5 call targeting it
        // builds/parses with no caller-supplied allowlist.
        const builder = factoryProd.getContractBuilder();
        builder.fee({ fee: '180' });
        builder.nonce(0);
        builder.contractAddress(CONFIGURED_STAKING_ADDRESS);
        builder.contractName('pox-5');
        builder.functionName('register-for-bond');
        builder.functionArgs([
          { type: 'uint128', val: '210' },
          { type: 'principal', val: `${CONFIGURED_STAKING_ADDRESS}.signer-manager` },
          { type: 'uint128', val: '1005000' },
          { type: 'optional' },
          { type: 'optional' },
        ]);
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.numberSignatures(1);

        const tx = await builder.build();
        tx.toJson().payload.contractAddress.should.equal(CONFIGURED_STAKING_ADDRESS);
        tx.toJson().payload.contractName.should.equal('pox-5');
      });

      it('rehydrates a configured-address pox-5 call with NO allowlist (OVC path)', async () => {
        // The key behaviour: `factory.from(hex)` — used by sign / explain / fee-rebuild — must parse
        // a register-for-bond targeting the configured address without any allowlist, so the offline
        // vault console needs no code change.
        const builder = factoryProd.getContractBuilder();
        builder.fee({ fee: '180' });
        builder.nonce(0);
        builder.contractAddress(CONFIGURED_STAKING_ADDRESS);
        builder.contractName('pox-5');
        builder.functionName('register-for-bond');
        builder.functionArgs([
          { type: 'uint128', val: '210' },
          { type: 'principal', val: `${CONFIGURED_STAKING_ADDRESS}.signer-manager` },
          { type: 'uint128', val: '1005000' },
          { type: 'optional' },
          { type: 'optional' },
        ]);
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.numberSignatures(1);
        const tx = await builder.build();

        // Routes to the pox-5 builder (parity) with no allowlist supplied.
        should.equal(
          StxLib.Pox5Builder.isValidContractCall(
            coins.get(coinName),
            (tx as StxLib.Transaction).stxTransaction.payload as any
          ),
          true
        );

        const reparsed = factoryProd.from(tx.toBroadcastFormat());
        reparsed.should.be.an.instanceOf(StxLib.Pox5Builder);
        reparsed.fromPubKey(testData.TX_SENDER.pub);
        reparsed.numberSignatures(1);
        const payload = (await reparsed.build()).toJson().payload as any;
        should.deepEqual(payload.contractAddress, CONFIGURED_STAKING_ADDRESS);
        should.deepEqual(payload.contractName, 'pox-5');
      });

      it('a signed contract call with args', async () => {
        const builder = initTxBuilder();
        builder.functionArgs([
          { type: 'uint128', val: '400000000' },
          { type: 'principal', val: testData.ACCOUNT_2.address },
          { type: 'optional' },
          {
            type: 'optional',
            val: {
              type: 'tuple',
              val: [
                { key: 'hashbytes', type: 'buffer', val: Buffer.from('some-hash') },
                { key: 'version', type: 'buffer', val: new BigNum(1).toBuffer() },
              ],
            },
          },
        ]);
        builder.sign({ key: testData.TX_SENDER.prv });
        const tx = await builder.build();

        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
        should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
        should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.fee.toString(), '180');
        should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_CONTRACT_WITH_ARGS);

        tx.type.should.equal(TransactionType.ContractCall);
        tx.outputs.length.should.equal(1);
        tx.outputs[0].address.should.equal(testData.CONTRACT_ADDRESS);
        tx.outputs[0].value.should.equal('0');
        tx.inputs.length.should.equal(1);
        tx.inputs[0].address.should.equal(testData.TX_SENDER.address);
        tx.inputs[0].value.should.equal('0');
      });

      it('a signed self stacking contract call', async () => {
        const builder = initTxBuilder();
        /* Contract call in clarity POX-4
        (define-public (stack-stx (amount-ustx uint)
                          (pox-addr (tuple (version (buff 1)) (hashbytes (buff 32))))
                          (start-burn-ht uint)
                          (lock-period uint)
                          (signer-sig (optional (buff 65)))
                          (signer-key (buff 33))
                          (max-amount uint)
                          (auth-id uint))
         */
        builder.functionArgs([
          { type: 'uint128', val: '400000000' },
          {
            type: 'tuple',
            val: [
              { key: 'hashbytes', type: 'buffer', val: Buffer.from('some-hash') },
              { key: 'version', type: 'buffer', val: new BigNum(1).toBuffer() },
            ],
          },
          { type: 'uint128', val: '52800' },
          { type: 'uint128', val: '2' },
          // Nakamoto upgrade new 4 parameters
          // https://docs.stacks.co/nakamoto-upgrade/signing-and-stacking/stacking-flow#solo-stacker-flow
          { type: 'optional', val: { type: 'buffer', val: Buffer.from('some-hash') } },
          { type: 'buffer', val: Buffer.from('some-hash') },
          { type: 'uint128', val: '340282366920938463463374607431768211455' },
          { type: 'uint128', val: '123456' },
        ]);
        builder.sign({ key: testData.TX_SENDER.prv });
        const tx = await builder.build();

        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
        should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
        should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.fee.toString(), '180');
        should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_SELF_STACK_CONTRACT_CALL);

        tx.type.should.equal(TransactionType.ContractCall);
        tx.outputs.length.should.equal(1);
        tx.outputs[0].address.should.equal(testData.CONTRACT_ADDRESS);
        tx.outputs[0].value.should.equal('0');
        tx.inputs.length.should.equal(1);
        tx.inputs[0].address.should.equal(testData.TX_SENDER.address);
        tx.inputs[0].value.should.equal('0');
      });

      it('a signed contract call transaction', async () => {
        const amount = 123;
        const builder = initTxBuilder();
        builder.functionArgs([{ type: 'optional', val: { type: 'int128', val: amount } }]);
        builder.sign({ key: testData.TX_SENDER.prv });
        const tx = await builder.build();

        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
        should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
        should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.fee.toString(), '180');
        should.deepEqual(txJson.payload.functionArgs, [stringifyCv(someCV(intCV(amount)))]);
        should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_CONTRACT_CALL);
        tx.type.should.equal(TransactionType.ContractCall);
      });

      it('a signed serialized contract call transaction', async () => {
        const builder = factory.from(testData.SIGNED_CONTRACT_CALL);
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
        should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
        should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.fee.toString(), '180');
        should.deepEqual(txJson.payload.functionArgs, [stringifyCv(someCV(intCV(123)))]);
        should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_CONTRACT_CALL);
        tx.type.should.equal(TransactionType.ContractCall);
        tx.outputs.length.should.equal(1);
        tx.outputs[0].address.should.equal(testData.CONTRACT_ADDRESS);
        tx.outputs[0].value.should.equal('0');
        tx.inputs.length.should.equal(1);
        tx.inputs[0].address.should.equal(testData.TX_SENDER.address);
        tx.inputs[0].value.should.equal('0');
      });

      it('a signed serialized self stacking contract call transaction', async () => {
        const builder = factory.from(testData.SIGNED_SELF_STACK_CONTRACT_CALL);
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
        should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
        should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.fee.toString(), '180');
        // Now stacks-stx self-stacking supports 8 parameters
        // https://docs.stacks.co/nakamoto-upgrade/signing-and-stacking/stacking-flow#solo-stacker-flow
        should.deepEqual(txJson.payload.functionArgs.length, 8);
        should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_SELF_STACK_CONTRACT_CALL);
        tx.type.should.equal(TransactionType.ContractCall);
        tx.outputs.length.should.equal(1);
        tx.outputs[0].address.should.equal(testData.CONTRACT_ADDRESS);
        tx.outputs[0].value.should.equal('0');
        tx.inputs.length.should.equal(1);
        tx.inputs[0].address.should.equal(testData.TX_SENDER.address);
        tx.inputs[0].value.should.equal('0');
      });

      it('a multisig transfer transaction', async () => {
        const builder = initTxBuilder();
        builder.functionArgs([{ type: 'optional', val: { type: 'int128', val: '123' } }]);

        builder.sign({ key: testData.prv1 });
        builder.sign({ key: testData.prv2 });
        builder.fromPubKey([testData.pub1, testData.pub2, testData.pub3]);
        builder.numberSignatures(2);
        const tx = await builder.build();
        JSON.stringify(tx.toJson());
        should.deepEqual(tx.toBroadcastFormat(), testData.MULTI_SIG_CONTRACT_CALL);
      });

      describe('ParseCV test', () => {
        it('Optional with out value', () => {
          const amount = '400000000';
          const builder = initTxBuilder();
          builder.functionArgs([
            { type: 'uint128', val: amount },
            { type: 'principal', val: testData.ACCOUNT_2.address },
            { type: 'optional' },
            {
              type: 'optional',
              val: {
                type: 'tuple',
                val: [
                  { key: 'hashbytes', type: 'buffer', val: Buffer.from('some-hash') },
                  { key: 'version', type: 'buffer', val: new BigNum(1).toBuffer() },
                ],
              },
            },
          ]);
          should.deepEqual((builder as any)._functionArgs, [
            uintCV(amount),
            standardPrincipalCV(testData.ACCOUNT_2.address),
            noneCV(),
            someCV(
              tupleCV({
                hashbytes: bufferCV(Buffer.from('some-hash')),
                version: bufferCV(new BigNum(1).toBuffer()),
              })
            ),
          ]);
        });

        it('rejects a malformed JSON descriptor instead of treating it as a ClarityValue', () => {
          const builder = initTxBuilder();
          // `{ type: 'list' }` / `{ type: 'tuple' }` reuse a ClarityType name but carry no
          // `val`/`value`; they must still be validated by `parseCv` (and rejected) rather than
          // passed through as raw ClarityValues.
          assert.throws(() => builder.functionArgs([{ type: 'list' } as never]), InvalidParameterValueError);
          assert.throws(() => builder.functionArgs([{ type: 'tuple' } as never]), InvalidParameterValueError);
        });

        it('use ClarityValue', () => {
          const amount = '400000000';
          const builder = initTxBuilder();
          builder.functionArgs([
            uintCV(amount),
            standardPrincipalCV(testData.ACCOUNT_2.address),
            noneCV(),
            someCV(
              tupleCV({
                hashbytes: bufferCV(Buffer.from('some-hash')),
                version: bufferCV(new BigNum(1).toBuffer()),
              })
            ),
          ]);
          should.deepEqual((builder as any)._functionArgs, [
            uintCV(amount),
            standardPrincipalCV(testData.ACCOUNT_2.address),
            noneCV(),
            someCV(
              tupleCV({
                hashbytes: bufferCV(Buffer.from('some-hash')),
                version: bufferCV(new BigNum(1).toBuffer()),
              })
            ),
          ]);
        });

        it('Buffer as string', () => {
          const builder = initTxBuilder();
          builder.functionArgs([
            { type: 'buffer', val: 'some-hash' },
            { type: 'buffer', val: '1' },
          ]);
          should.deepEqual((builder as any)._functionArgs, [
            bufferCV(Buffer.from('some-hash')),
            bufferCV(new BigNum(1).toBuffer()),
          ]);
        });

        it('Buffer as number', () => {
          const builder = initTxBuilder();
          builder.functionArgs([
            { type: 'buffer', val: '1' },
            { type: 'buffer', val: 1 },
          ]);
          should.deepEqual((builder as any)._functionArgs, [
            bufferCV(new BigNum(1).toBuffer()),
            bufferCV(new BigNum(1).toBuffer()),
          ]);
        });

        it('invalid type', () => {
          const builder = initTxBuilder();

          assert.throws(
            () => builder.functionArgs([{ type: 'unknow', val: 'any-val' }]),
            new RegExp('Unexpected Clarity ABI type primitive: "unknow"')
          );
        });
      });

      describe('should fail', () => {
        it('a contract call with an invalid key', () => {
          const builder = initTxBuilder();
          assert.throws(() => builder.sign({ key: 'invalidKey' }), /Unsupported private key/);
        });
        it('a contract call with an invalid contract address', () => {
          const builder = initTxBuilder();
          assert.throws(() => builder.contractAddress(testData.ACCOUNT_1.address), /Invalid contract address/);
        });
        it('a contract call with an invalid contract name pox-2', () => {
          const builder = initTxBuilder();
          assert.throws(
            () => builder.contractName('pox-2'),
            /Only pox-4, pox-5, and send-many-memo contracts supported/
          );
        });
        it('a contract call with an invalid contract name pox-3', () => {
          const builder = initTxBuilder();
          assert.throws(
            () => builder.contractName('pox-3'),
            /Only pox-4, pox-5, and send-many-memo contracts supported/
          );
        });
        it('a contract call with an invalid contract function name', () => {
          const builder = initTxBuilder();
          assert.throws(
            () => builder.functionName('test-function'),
            new RegExp('test-function is not supported contract function name')
          );
        });
        it('rejects a PoX-4 function on a PoX-5 contract', () => {
          const builder = factory.getContractBuilder();
          builder.contractName('pox-5');
          assert.throws(
            () => builder.functionName('stack-stx'),
            new RegExp('stack-stx is not supported contract function name')
          );
        });
        it('rejects a PoX-5 function before a contract is selected', () => {
          const builder = factory.getContractBuilder();
          assert.throws(
            () => builder.functionName('register-for-bond'),
            new RegExp('register-for-bond is not supported contract function name')
          );
        });
        it('revalidates the function when changing the contract', () => {
          const builder = initTxBuilder();
          assert.throws(
            () => builder.contractName('pox-5'),
            new RegExp('stack-stx is not supported contract function name')
          );
        });
        it('rejects malformed principal and nested Clarity values', () => {
          const builder = initTxBuilder();
          assert.throws(
            () => builder.functionArgs([{ type: 'contract-principal', val: 'no-dot' }]),
            /address.contract-name format/
          );
          assert.throws(
            () => builder.functionArgs([{ type: 'standard-principal', val: 'invalid-address' }]),
            /must be a valid standard principal/
          );
          assert.throws(() => builder.functionArgs([{ type: 'list', val: 'not-an-array' }]), /list requires Array val/);
          assert.throws(
            () =>
              builder.functionArgs([{ type: 'response', val: { type: 'maybe', val: { type: 'uint128', val: '1' } } }]),
            /response requires \{ type: ok\|err, val \}/
          );
        });
      });

      describe('contract builder validation and init edge cases', function () {
        it('rejects an invalid contract address and empty names', function () {
          const builder = factory.getContractBuilder();
          assert.throws(() => builder.contractAddress('invalid'), /Invalid address/);
          assert.throws(() => builder.contractName(''), /Invalid name/);
          assert.throws(() => builder.functionName(''), /Invalid name/);
        });

        it('parses a response-error Clarity value descriptor', function () {
          const builder = factory.getContractBuilder();
          builder.functionArgs([{ type: 'response', val: { type: 'err', val: { type: 'uint128', val: '1' } } }]);
        });

        it('rejects principal descriptors without a string val', function () {
          const builder = factory.getContractBuilder();
          assert.throws(
            () => builder.functionArgs([{ type: 'contractPrincipal', val: 1 } as never]),
            /contract principal requires string val/
          );
          assert.throws(
            () => builder.functionArgs([{ type: 'standardPrincipal', val: 1 } as never]),
            /standard principal requires string val/
          );
        });

        it('rejects a contract-call init with a missing or non-contract-call payload', function () {
          const builder = factory.getContractBuilder();
          assert.throws(
            () => builder.initBuilder({ toJson: () => ({ payload: undefined }) } as never),
            /payload must not be undefined/
          );
          assert.throws(
            () => builder.initBuilder({ toJson: () => ({ payload: { payloadType: 0 } }) } as never),
            /Transaction should be contract call/
          );
        });

        it('rejects building a contract call without a public key', async function () {
          const builder = initTxBuilder();
          await assert.rejects(builder.build(), /supply at least 1 public key/);
        });
      });
    });
  });
});
