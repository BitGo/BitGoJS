import * as testData from '../resources/apt';
import should from 'should';
import utils from '../../src/lib/utils';
import {
  SignedTransaction,
  TransactionAuthenticatorFeePayer,
  TransactionPayloadEntryFunction,
} from '@aptos-labs/ts-sdk';

describe('Aptos util library', function () {
  describe('isValidAddress', function () {
    it('should succeed to validate raw transactoin', function () {
      for (const address of testData.addresses.validAddresses) {
        should.equal(utils.isValidAddress(address), true);
      }
    });

    it('should fail to validate invalid addresses', function () {
      for (const address of testData.addresses.invalidAddresses) {
        should.doesNotThrow(() => utils.isValidAddress(address));
        should.equal(utils.isValidAddress(address), false);
      }
      // @ts-expect-error Testing for missing param, should not throw an error
      should.doesNotThrow(() => utils.isValidAddress(undefined));
      // @ts-expect-error Testing for missing param, should return false
      should.equal(utils.isValidAddress(undefined), false);
    });
  });

  describe('isValidDeserialize', function () {
    it('should succeed to correctly deserialize serialized transaction', function () {
      const signedTxn: SignedTransaction = utils.deserializeSignedTransaction(testData.TRANSFER);
      const authenticator = signedTxn.authenticator as TransactionAuthenticatorFeePayer;
      should.equal(
        authenticator.fee_payer.address.toString(),
        '0xdbc87a1c816d9bcd06b683c37e80c7162e4d48da7812198b830e4d5d8e0629f2'
      );
    });
    it('should fail to deserialize an invalid serialized transaction', function () {
      should.throws(() => utils.deserializeSignedTransaction(testData.INVALID_TRANSFER));
    });
  });

  it('strip hex prefix', function () {
    const s = utils.stripHexPrefix('0x9b4e96086d111500259f9b38680b0509a405c1904da18976455a20c691d3bb07');
    should.equal(s, '9b4e96086d111500259f9b38680b0509a405c1904da18976455a20c691d3bb07');
  });

  it('is valid public key', function () {
    // with 0x prefix
    should.equal(false, utils.isValidPublicKey('0x9b4e96086d111500259f9b38680b0509a405c1904da18976455a20c691d3bb07'));
    // without 0x prefix
    should.equal(true, utils.isValidPublicKey('9b4e96086d111500259f9b38680b0509a405c1904da18976455a20c691d3bb07'));
  });

  it('deserializeFeePayerRawTransaction', function () {
    const signablePayloadHex =
      '5efa3c4f02f83a0f4b2d69fc95c607cc02825cc4e7be536ef0992df050d9e67c01f22fa009b6473cdc539ecbd570d00d0585682f5939ffe256a90ddee0d616292f000000000000000002000000000000000000000000000000000000000000000000000000000000000104636f696e087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000220da22bdc19f873fd6ce48c32912965c8a9dde578b2a3cf4fae3dd85dfaac784c908e803000000000000a8610000000000006400000000000000901cdd68000000000200adba44b46722b8da1797645f71ddcdab28626c06acd36b88d5198a684966306c';
    const feePayerRawTransactionHex = signablePayloadHex.slice(66); // remove the first 33 bytes (66 hex characters)
    const feePayerRawTransaction = utils.deserializeFeePayerRawTransaction(feePayerRawTransactionHex);
    const rawTxn = feePayerRawTransaction.raw_txn;

    const sender = rawTxn.sender.toString();
    const sequenceNumber = utils.castToNumber(rawTxn.sequence_number);
    const maxGasAmount = utils.castToNumber(rawTxn.max_gas_amount);
    const gasUnitPrice = utils.castToNumber(rawTxn.gas_unit_price);
    const expirationTime = utils.castToNumber(rawTxn.expiration_timestamp_secs);
    should.equal(sender, '0xf22fa009b6473cdc539ecbd570d00d0585682f5939ffe256a90ddee0d616292f');
    should.equal(sequenceNumber, 0);
    should.equal(maxGasAmount, 25000);
    should.equal(gasUnitPrice, 100);
    should.equal(expirationTime, 1759321232);

    const entryFunction = (rawTxn.payload as TransactionPayloadEntryFunction).entryFunction;
    const functionName = `${entryFunction.module_name.address.toString()}::${entryFunction.module_name.name.identifier.toString()}::${entryFunction.function_name.identifier.toString()}`;
    should.equal(functionName, '0x1::coin::transfer');
    const assetId = entryFunction.type_args[0].toString();
    should.equal(assetId, '0x1::aptos_coin::AptosCoin');

    const addressArg = entryFunction.args[0];
    const amountArg = entryFunction.args[1];
    const recipients = utils.parseRecipients(addressArg, amountArg);
    should.equal(recipients.length, 1);
    should.equal(recipients[0].address, '0xda22bdc19f873fd6ce48c32912965c8a9dde578b2a3cf4fae3dd85dfaac784c9');
    should.equal(recipients[0].amount, '1000');
  });
});
